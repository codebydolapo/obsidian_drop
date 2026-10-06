# Obsidian Drop

An anonymous, end-to-end encrypted chat app for people on the same network. Nothing is saved: messages exist only while a chat is open.

When you open the app, it gives you a random identity (for example `🦊 Neon Fox`) and shows a radar with everyone else on the same network who also has the app open. Tap someone on the radar to send a chat request. If they accept, you both get a private chat. Messages are encrypted in the browser and relayed by a Socket.IO server that can't read them and doesn't store them.

## How it works

```
Browser (Next.js)                         Socket server (socket/server.js)
──────────────────                        ────────────────────────────────
getOrCreateProfile()  ──join_radar──────▶ groups sockets by IP (+ venue code)
Radar  ◀──────────────radar_update──────  sends the peer list to that radar room
tap a peer  ─────────send_request + 🔑A─▶ stores A's public key with the request
HandshakeModal ◀───receive_request───────
Accept  ────────────accept_request + 🔑B▶ puts both sockets in chat_<idA>_<idB>
TransientChat ◀──────chat_started────────  each side gets the other's public key
encrypt → send ─────send_message────────▶ relays ciphertext, stores nothing
decrypt ◀──────────receive_message───────
```

- **Discovery is by IP address.** The server puts every socket from the same network into one radar. For IPv4 that means the same public IP; for IPv6 it means the same `/64` prefix, because each IPv6 device has its own address. In practice, "nearby" means "on the same Wi-Fi/NAT". Behind a hosting proxy, the IP comes from the header set in `CLIENT_IP_HEADER`.
- **Venue codes** narrow that radar further. Typing a code like `stage1` (or opening `/?venue=stage1`) shows only people on the same network who entered the same code. This helps where hundreds of people share one IP, such as large public Wi-Fi or mobile networks. Codes are 1–16 characters (letters, digits, dashes), and case and a leading `#` are ignored. A code doesn't connect people on different networks.
- **Identity** is created in the browser and saved in `localStorage` under `obsidian_profile` ([app/identity.ts](app/identity.ts)). There are no accounts.
- **Chats are temporary.** Messages are kept in React state only. Closing the chat or reloading the page deletes them.

## End-to-end encryption

Implemented in [app/lib/crypto.ts](app/lib/crypto.ts) with the browser's Web Crypto API. No extra packages are needed.

- Each side creates a new ECDH P-256 key pair **for each chat**. Only the public keys pass through the server, attached to the request and the accept. Private keys never leave the browser and can't be exported.
- Both sides derive the same AES-256-GCM key (ECDH → HKDF-SHA-256). Every message gets a random 12-byte IV.
- The sender's public key is bound to each message as authenticated data. If the server relabels one person's message as coming from the other, it fails to decrypt.
- **Safety code:** every chat opens with a 20-digit code computed from both public keys, plus "They match" / "They don't match" buttons. The header shows whether the chat is verified. "They don't match" turns sending off. If it matches on both phones, the server didn't swap the keys (a man-in-the-middle attack). People using the app are physically near each other, so comparing codes in person is easy.
- The server only checks that messages are well-formed base64 within a size limit. It never sees the text.

**Web Crypto only works on HTTPS or `localhost`.** If you open the app over plain HTTP on another device (for example `http://192.168.1.5:3000` on a phone), it shows "Encrypted chat needs HTTPS" and won't start chats. To test on phones, serve both the app and the socket server over HTTPS. Two ways: a tunnel such as `cloudflared` or `ngrok`, or `next dev --experimental-https` plus TLS on the socket server.

## Project structure

| Path | Purpose |
| --- | --- |
| [app/page.tsx](app/page.tsx) | Main screen: connects to the socket, holds peer, request and chat state |
| [app/identity.ts](app/identity.ts) | Creates the random name and avatar and saves them |
| [app/components/Radar.tsx](app/components/Radar.tsx) | Animated radar showing peers in a circle |
| [app/components/HandshakeModal.tsx](app/components/HandshakeModal.tsx) | Accept/decline popup for an incoming request |
| [app/components/TransientChat.tsx](app/components/TransientChat.tsx) | Full-screen chat: encrypts, decrypts, shows the safety code |
| [app/lib/crypto.ts](app/lib/crypto.ts) | Key exchange, message encryption and safety codes |
| [app/lib/venue.ts](app/lib/venue.ts) | Venue code checks and the `?venue=` URL parameter |
| [app/components/Onboarding.tsx](app/components/Onboarding.tsx) | Three-step intro on the first visit, reopened from the ? button |
| [app/lib/hints.ts](app/lib/hints.ts) | Remembers which one-time hints (intro, close warning) this browser has seen |
| [socket/server.js](socket/server.js) | Express + Socket.IO server: discovery and message relay (port 4000) |

Stack: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, framer-motion, lucide-react, socket.io-client.

## Running locally

```bash
npm install
npm run dev      # starts the web app (port 3000) and the socket server (port 4000) together
```

To run them separately, use `npx next dev` and `npm run server`.

Open http://localhost:3000 in two different browser profiles (or one normal and one incognito window), so each gets its own identity. Both run on the same machine, so they share an IP and appear on each other's radar.

### Configuration

| Variable | Default | Used by |
| --- | --- | --- |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | Web app: socket server address |
| `PORT` | `4000` | Socket server: port to listen on |
| `CORS_ORIGIN` | any origin (dev only) | Socket server: comma-separated allowed frontend origins. **Required** when `NODE_ENV=production`, or the server won't start |
| `CLIENT_IP_HEADER` | unset (use the connection's address) | Socket server: header your host's proxy puts the client IP in, e.g. `x-forwarded-for`. **Only set this behind a proxy**, or clients can choose their own IP |
| `CLIENT_IP_POSITION` | `last` | Socket server: which entry of a comma-separated `CLIENT_IP_HEADER` is the client: `first` or `last` |
| `REQUEST_TIMEOUT_MS` | `30000` | Socket server: how long a chat request waits before expiring |

The socket server also serves `GET /health` (for uptime checks) and `GET /whoami`. `/whoami` returns the IP and network the server assigns the caller to, which you use to check the client-IP settings after deploying.

## Deploying (Vercel + Railway)

Vercel can't keep WebSocket connections open, so the app is deployed in two parts: **Next.js on Vercel** and **the socket server on Railway**. Both use the same repo. [railway.json](railway.json) tells Railway to skip the Next.js build, run `npm run server`, and health-check `/health`.

### 1. Socket server on Railway
1. In Railway: **New Project → Deploy from GitHub repo** → pick this repo. Railway reads `railway.json`.
2. **Settings → Networking → Generate Domain.** Note the URL, e.g. `https://obsidian-drop-socket.up.railway.app`.
3. **Variables:**
   ```
   NODE_ENV=production
   CORS_ORIGIN=https://<your-app>.vercel.app
   CLIENT_IP_HEADER=x-forwarded-for
   CLIENT_IP_POSITION=last
   ```
   `CORS_ORIGIN` can't be filled in until Vercel gives you a URL, and the server refuses to start in production without it. Put in a placeholder for now and fix it in step 3.
   Don't set `PORT`: Railway provides it.
4. Keep **one replica**. Radar and chat state live in the server's memory.

### 2. Web app on Vercel
1. **Add New → Project** → import the same repo. The defaults (Next.js, `npm run build`) are correct.
2. **Environment Variables:** `NEXT_PUBLIC_SOCKET_URL=https://<your-railway-domain>`. The value is baked in at build time, so **redeploy** after changing it.
3. Deploy, and note the URL.

### 3. Connect and verify
1. Set `CORS_ORIGIN` on Railway to the exact Vercel URL (no trailing slash). Add a custom domain the same way, comma-separated.
2. **Check the client IP.** From a terminal:
   ```bash
   curl https://<railway-domain>/whoami
   curl -H "X-Forwarded-For: 8.8.8.8" https://<railway-domain>/whoami
   ```
   - The first call should show **your** public IP (compare with https://ifconfig.me).
   - The second must **not** show `8.8.8.8`. If it does, clients can fake their IP. Switch `CLIENT_IP_POSITION` (`last` ↔ `first`) and check again.
   - If neither setting shows your IP, try `CLIENT_IP_HEADER=x-real-ip`.
3. Open the Vercel URL on two phones on the same Wi-Fi. They should see each other, and chats should open with matching safety codes.

## Server protections

- **Validation:** every event payload is checked. Profiles are limited to `id` ≤ 64, `name` ≤ 40 and `avatar` ≤ 16 characters, and only those fields are stored. Public keys must be 88-character base64. Messages must be base64 IV + ciphertext, up to 5600 characters (about 1000 characters of text, which the client enforces). Packets over 10 KB are rejected. A bad payload is dropped instead of crashing the server.
- **Authorization:** a request can only be sent to a peer on the same radar. A request can only be accepted or declined by the person it was sent to, while it is still pending. Messages are only delivered from members of the chat room. The sender's profile comes from the server's record, so it can't be faked.
- **Rate limits** (per connection): 20 messages / 10 s, 5 chat requests / 30 s, 10 radar joins or venue changes / min. Extra events are dropped and the client gets `rate_limited`.
- **Request expiry:** unanswered requests expire after 30 s for both people.
- **Stale peers:** Socket.IO's built-in heartbeat (ping every 25 s, 20 s timeout) disconnects sleeping or offline devices. That removes them from the radar and ends their chats.

## Known gaps

### Missing features
- **Outgoing requests can't be cancelled.** They expire after 30 s.
- **Mobile-data users often can't find each other.** Phones on mobile data usually have different public IPs, and venue codes only group people on the same network.
- **Some app details are still the defaults.** Page title/metadata in [app/layout.tsx](app/layout.tsx) still say "Create Next App", and `globals.css` still has the starter theme.

### Security and privacy
- **The safety code is only useful if people compare it.** Every chat asks them to, but it's optional. Someone who taps "They match" without checking gets no protection against a server that swaps keys.
- **The server can see metadata.** It can't read messages, but it knows who chats with whom, when, and roughly how long each message is.
- **No replay protection.** A malicious server could re-deliver an earlier ciphertext in the same chat, and it would decrypt as a duplicate message.
- **Rate limits are per connection.** A client that keeps reconnecting gets a fresh limit each time. Per-IP limits would close this.

### Quality
- No automated tests or CI.
- Messages use the array index as the React key.
- The venue code rules are defined twice, in [app/lib/venue.ts](app/lib/venue.ts) and [socket/server.js](socket/server.js).
- The radar uses a fixed 100px orbit, so peer labels overlap once there are more than about 6 peers.
- The server keeps its state in memory in one process. Running more than one instance would need the Socket.IO Redis adapter.
