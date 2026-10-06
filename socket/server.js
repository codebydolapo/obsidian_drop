// server.js (Node.js + Socket.io)
const express = require('express');
const http = require('http');
const net = require('net');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 4000;
const IS_PROD = process.env.NODE_ENV === 'production';
// Comma-separated list of allowed frontend origins, e.g. "https://drop.example.com"
const CORS_ORIGINS = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
// Header your host's proxy puts the real client IP in, e.g. "x-forwarded-for".
// Leave unset when clients connect directly; never set it without a proxy in front,
// or clients can pick their own IP and join any network's radar.
const CLIENT_IP_HEADER = process.env.CLIENT_IP_HEADER?.trim().toLowerCase() || null;
// Which entry of a comma-separated header to use: "first" or "last" (default)
const CLIENT_IP_POSITION = process.env.CLIENT_IP_POSITION === 'first' ? 'first' : 'last';

const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 30_000;
// Messages are end-to-end encrypted, so only the ciphertext size can be checked.
// 1000 chars × up to 4 UTF-8 bytes + 16-byte auth tag, base64-encoded ≈ 5356 chars
const MAX_CIPHERTEXT_LENGTH = 5600;
const MAX_NAME_LENGTH = 40;
const MAX_AVATAR_LENGTH = 16; // emoji can span several UTF-16 code units

if (IS_PROD && !CORS_ORIGINS?.length) {
  console.error('CORS_ORIGIN must be set in production');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // Dev default allows any origin so phones on the LAN can connect
  cors: { origin: CORS_ORIGINS?.length ? CORS_ORIGINS : true },
  maxHttpBufferSize: 10_000, // bytes per packet; default is 1 MB
});

// Memory store for active rooms and connected sockets
const activePeers = new Map(); // socketId -> { socketId, id, name, avatar, room }

// Pending handshakes: "<fromSocketId>-><toSocketId>" -> { timer, publicKey }
const pendingRequests = new Map();
const requestKey = (from, to) => `${from}->${to}`;

// Profile fields safe to send to other clients
const publicProfile = ({ id, name, avatar }) => ({ id, name, avatar });

// --- Validation -------------------------------------------------------------

const isString = (value, min, max) => typeof value === 'string' && value.length >= min && value.length <= max;

function parseProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const id = profile.id;
  const name = typeof profile.name === 'string' ? profile.name.trim() : null;
  const avatar = profile.avatar;
  if (!isString(id, 1, 64) || !isString(name, 1, MAX_NAME_LENGTH) || !isString(avatar, 1, MAX_AVATAR_LENGTH)) {
    return null;
  }
  return { id, name, avatar };
}

const isSocketId = (value) => isString(value, 1, 64);

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const isBase64 = (value, min, max) => isString(value, min, max) && BASE64.test(value);
// Raw P-256 public key is 65 bytes → 88 base64 chars
const isPublicKey = (value) => isBase64(value, 88, 88);

// Venue codes split one network's radar into smaller groups, e.g. "stage1"
// Returns null for "no venue", undefined for an invalid code
function parseVenue(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const venue = value.trim().replace(/^#/, '').toLowerCase();
  return /^[a-z0-9-]{1,16}$/.test(venue) ? venue : undefined;
}

// --- Rate limiting ------------------------------------------------------------

// Fixed-window limits per socket and event: [max events, window ms]
const RATE_LIMITS = {
  join_radar: [10, 60_000],
  send_request: [5, 30_000],
  accept_request: [10, 30_000],
  decline_request: [10, 30_000],
  leave_chat: [10, 30_000],
  send_message: [20, 10_000],
};

function createRateLimiter() {
  const windows = new Map(); // event -> { start, count }
  return (event) => {
    const [max, windowMs] = RATE_LIMITS[event];
    const now = Date.now();
    const current = windows.get(event);
    if (!current || now - current.start >= windowMs) {
      windows.set(event, { start: now, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= max;
  };
}

// --- Helpers -------------------------------------------------------------------

function getClientIp(headers, remoteAddress) {
  const raw = CLIENT_IP_HEADER ? headers[CLIENT_IP_HEADER] : undefined;
  if (typeof raw === 'string') {
    const hops = raw.split(',').map((ip) => ip.trim()).filter(Boolean);
    if (hops.length) return CLIENT_IP_POSITION === 'first' ? hops[0] : hops[hops.length - 1];
  }
  return remoteAddress || 'unknown';
}

// Expands "2001:db8::1" to its 8 hextets
function expandIPv6(address) {
  const [head, tail = ''] = address.split('::');
  const toGroups = (part) => {
    if (!part) return [];
    return part.split(':').flatMap((group) => {
      // Embedded IPv4 at the end, e.g. "::ffff:1.2.3.4"
      if (group.includes('.')) {
        const [a, b, c, d] = group.split('.').map(Number);
        return [((a << 8) | b).toString(16), ((c << 8) | d).toString(16)];
      }
      return [group];
    });
  };
  const headGroups = toGroups(head);
  const tailGroups = toGroups(tail);
  const missing = address.includes('::') ? 8 - headGroups.length - tailGroups.length : 0;
  return [...headGroups, ...Array(missing).fill('0'), ...tailGroups].map((g) => parseInt(g, 16).toString(16));
}

// Key for "same network". IPv4 devices behind one router share an address, but
// IPv6 gives each device its own, so group IPv6 by its /64 network prefix instead.
function networkKey(ip) {
  const address = ip.replace(/^\[|\]$/g, '').split('%')[0];
  const mappedIPv4 = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mappedIPv4) return mappedIPv4[1];
  if (net.isIPv6(address)) return `${expandIPv6(address).slice(0, 4).join(':')}::/64`;
  return address;
}

function broadcastRadar(roomName) {
  const peersInRoom = Array.from(activePeers.values())
    .filter((p) => p.room === roomName)
    .map((p) => ({ socketId: p.socketId, ...publicProfile(p) }));
  io.to(roomName).emit('radar_update', peersInRoom);
}

function clearRequest(key) {
  clearTimeout(pendingRequests.get(key)?.timer);
  pendingRequests.delete(key);
}

// --- Connection handling -------------------------------------------------------

// Health check for the host's monitoring
app.get('/health', (req, res) => res.json({ ok: true }));

// Live count for the landing page. Only a total, never who or where.
app.get('/stats', (req, res) => {
  const origin = req.headers.origin;
  if (origin && (!CORS_ORIGINS?.length || CORS_ORIGINS.includes(origin))) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Cache-Control', 'no-store');
  res.json({ online: activePeers.size });
});

// Shows which IP and network the server groups the caller under, to verify CLIENT_IP_HEADER after deploying
app.get('/whoami', (req, res) => {
  const ip = getClientIp(req.headers, req.socket.remoteAddress);
  res.json({ ip, network: networkKey(ip) });
});

io.on('connection', (socket) => {
  const networkRoom = `room_${networkKey(getClientIp(socket.handshake.headers, socket.handshake.address))}`;
  const allow = createRateLimiter();

  // Registers a handler that is rate limited and never crashes the server on bad input
  const on = (event, handler) => {
    socket.on(event, (payload) => {
      if (!allow(event)) {
        socket.emit('rate_limited', { event });
        return;
      }
      try {
        handler(payload && typeof payload === 'object' ? payload : {});
      } catch (err) {
        console.error(`Error handling ${event}:`, err);
      }
    });
  };

  // Also used to switch venue: payload is the profile plus an optional venue code
  on('join_radar', (payload) => {
    const profile = parseProfile(payload);
    const venue = parseVenue(payload.venue);
    if (!profile || venue === undefined) return;

    // Venues are scoped to the network, so a code only groups people who share an IP
    const radarRoom = venue ? `${networkRoom}_venue_${venue}` : networkRoom;
    const previousRoom = activePeers.get(socket.id)?.room;

    // Only store validated fields so clients cannot overwrite socketId or room
    activePeers.set(socket.id, { socketId: socket.id, ...profile, room: radarRoom });

    if (previousRoom && previousRoom !== radarRoom) {
      socket.leave(previousRoom);
      broadcastRadar(previousRoom);
    }
    socket.join(radarRoom);
    broadcastRadar(radarRoom);
  });

  on('send_request', ({ targetSocketId, publicKey }) => {
    if (!isPublicKey(publicKey)) return;
    const me = activePeers.get(socket.id);
    const them = activePeers.get(targetSocketId);
    // Only peers on the same radar can be contacted
    if (!me || !them || them.room !== me.room || targetSocketId === socket.id) return;

    const key = requestKey(socket.id, targetSocketId);
    if (pendingRequests.has(key)) return;

    const timer = setTimeout(() => {
      pendingRequests.delete(key);
      socket.emit('request_expired', { targetSocketId });
      io.to(targetSocketId).emit('request_expired', { fromSocketId: socket.id });
    }, REQUEST_TIMEOUT_MS);
    pendingRequests.set(key, { timer, publicKey });

    // Sender profile comes from the server's record, not the payload, so it cannot be spoofed
    io.to(targetSocketId).emit('receive_request', {
      fromSocketId: socket.id,
      senderProfile: publicProfile(me),
    });
  });

  on('accept_request', ({ targetSocketId, publicKey }) => {
    if (!isSocketId(targetSocketId) || !isPublicKey(publicKey)) return;
    const key = requestKey(targetSocketId, socket.id);
    // Can only accept a request that was actually sent to you
    const request = pendingRequests.get(key);
    if (!request) return;
    clearRequest(key);

    const me = activePeers.get(socket.id);
    const them = activePeers.get(targetSocketId);
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (!me || !them || !targetSocket) return; // requester left before acceptance

    const roomId = `chat_${[socket.id, targetSocketId].sort().join('_')}`;
    socket.join(roomId);
    targetSocket.join(roomId);

    // Each side gets the other's public key to derive the shared chat key
    socket.emit('chat_started', {
      roomId,
      peerSocketId: targetSocketId,
      peerProfile: publicProfile(them),
      peerPublicKey: request.publicKey,
    });
    targetSocket.emit('chat_started', {
      roomId,
      peerSocketId: socket.id,
      peerProfile: publicProfile(me),
      peerPublicKey: publicKey,
    });
  });

  on('decline_request', ({ targetSocketId }) => {
    if (!isSocketId(targetSocketId)) return;
    const key = requestKey(targetSocketId, socket.id);
    if (!pendingRequests.has(key)) return;
    clearRequest(key);

    const me = activePeers.get(socket.id);
    if (!me) return;
    io.to(targetSocketId).emit('request_declined', { byProfile: publicProfile(me) });
  });

  // Ends the chat for both sides: notify the other peer, then empty the room
  const endChat = (roomId) => {
    socket.to(roomId).emit('peer_left', { roomId });
    io.in(roomId).socketsLeave(roomId);
  };

  on('leave_chat', ({ roomId }) => {
    if (isString(roomId, 1, 200) && roomId.startsWith('chat_') && socket.rooms.has(roomId)) endChat(roomId);
  });

  on('send_message', ({ roomId, iv, ciphertext }) => {
    // Only members of the chat room may post to it
    if (!isString(roomId, 1, 200) || !roomId.startsWith('chat_') || !socket.rooms.has(roomId)) return;
    // 12-byte IV → 16 base64 chars; ciphertext is opaque to the server
    if (!isBase64(iv, 16, 16) || !isBase64(ciphertext, 1, MAX_CIPHERTEXT_LENGTH)) return;

    // Relay in volatile memory only - no database store
    io.to(roomId).emit('receive_message', {
      senderId: socket.id,
      iv,
      ciphertext,
      timestamp: Date.now(),
    });
  });

  // socket.rooms is already empty in 'disconnect', so close chats here
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId.startsWith('chat_')) endChat(roomId);
    }
  });

  socket.on('disconnect', () => {
    // Drop pending requests to or from this socket
    for (const key of pendingRequests.keys()) {
      const [from, to] = key.split('->');
      if (from === socket.id || to === socket.id) clearRequest(key);
    }

    const peer = activePeers.get(socket.id);
    if (peer) {
      activePeers.delete(socket.id);
      broadcastRadar(peer.room);
    }
  });
});

server.listen(PORT, () => console.log(`Socket server running on port ${PORT}`));
