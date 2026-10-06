'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getOrCreateProfile, Profile } from './helpers/identity';
import { Radar } from '../components/Radar';
import { HandshakeModal } from '../components/HandshakeModal';
import { TransientChat } from '../components/TransientChat';
import { Onboarding } from '../components/Onboarding';
import { ThemeToggle } from '../components/ThemeToggle';
import { deriveChatKey, generateKeyPair, isCryptoAvailable, safetyCode } from '../lib/crypto';
import { hasSeenHint, markHintSeen } from '../lib/hints';
import { parseVenue, sanitizeVenueInput, setVenueInUrl } from '../lib/venue';
import { SOCKET_SERVER_URL } from '../lib/config';
import { CircleHelp, Share2 } from 'lucide-react';
const NO_CRYPTO_NOTICE = 'Encrypted chat needs HTTPS (or localhost).';

type Peer = { socketId: string; name: string; avatar: string };

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);

  // Venue State
  const [venue, setVenue] = useState<string | null>(null);
  const [venueInput, setVenueInput] = useState('');
  const [showVenueHint, setShowVenueHint] = useState(false);
  const venueRef = useRef<string | null>(null); // read by the reconnect handler

  // First-visit intro; the page renders nothing until mounted, so reading storage here is safe
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenHint('onboarding'));

  // Handshake State
  const [incomingRequest, setIncomingRequest] = useState<{
    fromSocketId: string;
    senderProfile: Profile;
  } | null>(null);
  const [outgoingRequest, setOutgoingRequest] = useState<Peer | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Our key pair for each handshake in progress, by peer socket id
  const keyPairsRef = useRef(new Map<string, { keyPair: CryptoKeyPair; publicKey: string }>());

  // Active Chat State
  const [activeChat, setActiveChat] = useState<{
    roomId: string;
    peerProfile: Profile;
    chatKey: CryptoKey;
    myPublicKey: string;
    peerPublicKey: string;
    safetyCode: string;
  } | null>(null);

  useEffect(() => {
    // 1. Initialize identity from LocalStorage, venue from ?venue=
    const userProfile = getOrCreateProfile();
    setProfile(userProfile);
    const initialVenue = parseVenue(new URLSearchParams(window.location.search).get('venue'));
    venueRef.current = initialVenue;
    setVenue(initialVenue);

    // 2. Connect to Socket Server
    const socketInstance = io(SOCKET_SERVER_URL);
    setSocket(socketInstance);
    const keyPairs = keyPairsRef.current;

    socketInstance.on('connect', () => {
      socketInstance.emit('join_radar', { ...userProfile, venue: venueRef.current });
    });

    // Handle online peers update
    socketInstance.on('radar_update', (updatedPeers: Peer[]) => {
      // Filter out self from radar
      setPeers(updatedPeers.filter((p) => p.socketId !== socketInstance.id));

      // Drop pending requests involving peers who went offline
      const isOnline = (socketId: string) => updatedPeers.some((p) => p.socketId === socketId);
      setIncomingRequest((req) => (req && !isOnline(req.fromSocketId) ? null : req));
      setOutgoingRequest((req) => (req && !isOnline(req.socketId) ? null : req));
    });

    // Handle incoming chat request
    socketInstance.on('receive_request', ({ fromSocketId, senderProfile }) => {
      setIncomingRequest({ fromSocketId, senderProfile });
    });

    socketInstance.on('request_declined', ({ byProfile }: { byProfile: Profile }) => {
      setOutgoingRequest(null);
      setNotice(`${byProfile.name} declined your request`);
    });

    // Server cancels requests nobody answered within 30s
    socketInstance.on('request_expired', ({ fromSocketId, targetSocketId }: { fromSocketId?: string; targetSocketId?: string }) => {
      if (fromSocketId) {
        setIncomingRequest((req) => (req?.fromSocketId === fromSocketId ? null : req));
      } else if (targetSocketId) {
        keyPairs.delete(targetSocketId);
        setOutgoingRequest(null);
        setNotice('Request expired. No response.');
      }
    });

    socketInstance.on('rate_limited', () => {
      setNotice('Slow down a little and try again.');
    });

    // Handle accepted chat session: derive the shared key from the peer's public key
    socketInstance.on('chat_started', async ({ roomId, peerSocketId, peerProfile, peerPublicKey }) => {
      setOutgoingRequest(null);
      const own = keyPairs.get(peerSocketId);
      if (!own) return;
      keyPairs.delete(peerSocketId);

      try {
        const chatKey = await deriveChatKey(own.keyPair.privateKey, peerPublicKey);
        const code = await safetyCode(own.publicKey, peerPublicKey);
        setActiveChat({ roomId, peerProfile, chatKey, myPublicKey: own.publicKey, peerPublicKey, safetyCode: code });
      } catch {
        // Invalid peer key: close the room rather than chat unencrypted
        socketInstance.emit('leave_chat', { roomId });
        setNotice('Could not set up an encrypted chat.');
      }
    });

    return () => {
      socketInstance.disconnect();
      keyPairs.clear();
    };
  }, []);

  // Auto-dismiss notices
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Join a venue, or pass null to go back to the whole network
  const applyVenue = (next: string | null) => {
    venueRef.current = next;
    setVenue(next);
    setVenueInUrl(next);
    setVenueInput('');
    if (socket && profile) socket.emit('join_radar', { ...profile, venue: next });
  };

  const finishOnboarding = () => {
    markHintSeen('onboarding');
    setShowOnboarding(false);
  };

  // Share sheet on phones, clipboard elsewhere. The link keeps the venue code.
  const handleInvite = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Obsidian Drop', text: 'Chat with me on Obsidian Drop', url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return; // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Invite link copied');
    } catch {
      setNotice(`Share this link: ${url}`);
    }
  };

  const handleVenueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = parseVenue(venueInput);
    if (next) applyVenue(next);
  };

  // Request chat with selected radar peer
  const handleSelectPeer = async (peer: Peer) => {
    if (!socket) return;
    if (!isCryptoAvailable()) {
      setNotice(NO_CRYPTO_NOTICE);
      return;
    }
    const own = await generateKeyPair();
    keyPairsRef.current.set(peer.socketId, own);
    // Server attaches our profile from its own record
    socket.emit('send_request', { targetSocketId: peer.socketId, publicKey: own.publicKey });
    setOutgoingRequest(peer);
    setNotice(null);
  };

  // Accept incoming chat request
  const handleAcceptRequest = async (fromSocketId: string) => {
    if (!socket) return;
    setIncomingRequest(null);
    if (!isCryptoAvailable()) {
      setNotice(NO_CRYPTO_NOTICE);
      return;
    }
    const own = await generateKeyPair();
    keyPairsRef.current.set(fromSocketId, own);
    // The server replies with chat_started, which opens the chat
    socket.emit('accept_request', { targetSocketId: fromSocketId, publicKey: own.publicKey });
  };

  // Decline request
  const handleDeclineRequest = () => {
    if (socket && incomingRequest) {
      socket.emit('decline_request', { targetSocketId: incomingRequest.fromSocketId });
    }
    setIncomingRequest(null);
  };

  // Close chat for both sides
  const handleCloseChat = () => {
    if (socket && activeChat) {
      socket.emit('leave_chat', { roomId: activeChat.roomId });
    }
    setActiveChat(null);
  };

  if (!profile) return null;

  const where = venue ? `in #${venue}` : 'on your network';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between bg-canvas p-6 text-ink overflow-hidden">
      {/* Header Badge */}
      <header className="z-10 flex items-center justify-between w-full max-w-md border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-ping" />
          <span className="font-mono text-xs uppercase tracking-widest text-accent-ink">Obsidian Drop</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setShowOnboarding(true)}
            aria-label="How it works"
            className="rounded-full p-1.5 text-muted transition hover:bg-raised hover:text-ink"
          >
            <CircleHelp className="h-4 w-4" />
          </button>
          <div className="ml-1 flex items-center gap-2 bg-surface border border-line rounded-full px-3 py-1">
            <span className="text-base">{profile.avatar}</span>
            <span className="text-xs font-mono text-soft">{profile.name}</span>
          </div>
        </div>
      </header>

      {/* Center Radar Screen */}
      <div className="flex flex-col items-center justify-center flex-1 my-8">
        <Radar peers={peers} onSelectPeer={handleSelectPeer} />

        {notice || outgoingRequest || peers.length > 0 ? (
          <p className="mt-6 text-xs font-mono text-muted" role="status">
            {notice ??
              (outgoingRequest
                ? `Waiting for ${outgoingRequest.name} to accept...`
                : `${peers.length} active peer(s) ${where}. Tap one to chat.`)}
          </p>
        ) : (
          // Empty radar: explain who shows up here and offer a way to bring them in
          <div className="mt-6 flex max-w-xs flex-col items-center text-center">
            <p className="text-sm text-soft">Nobody nearby yet</p>
            <p className="mt-1 text-xs text-muted">
              {venue
                ? `People on this network who enter #${venue} will appear here.`
                : 'People on the same Wi-Fi who open Obsidian Drop will appear here.'}
            </p>
            <button
              onClick={handleInvite}
              className="mt-3 flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-xs text-soft transition hover:border-accent/50 hover:text-accent-ink"
            >
              <Share2 className="h-3.5 w-3.5" />
              Invite someone nearby
            </button>
          </div>
        )}

        {/* Venue code: narrows the radar when many people share one network */}
        {venue ? (
          <div className="mt-4 flex items-center gap-2 font-mono text-xs">
            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-accent-ink">
              #{venue}
            </span>
            <button
              onClick={() => applyVenue(null)}
              className="rounded-full px-3 py-1 text-subtle hover:bg-raised hover:text-ink transition"
            >
              Leave venue
            </button>
          </div>
        ) : (
          <form onSubmit={handleVenueSubmit} className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setShowVenueHint((shown) => !shown)}
              aria-label="What is a venue code?"
              aria-expanded={showVenueHint}
              className="rounded-full p-1.5 text-muted transition hover:bg-raised hover:text-ink"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={venueInput}
              onChange={(e) => setVenueInput(sanitizeVenueInput(e.target.value))}
              placeholder="Venue code (optional)"
              aria-label="Venue code"
              className="w-44 rounded-full border border-line bg-surface px-4 py-2 font-mono text-xs text-ink placeholder-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={!venueInput}
              className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-on-accent transition hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent"
            >
              Join
            </button>
            {showVenueHint && (
              <p className="w-full max-w-xs text-center text-[11px] text-muted">
                Lots of people on this network? Pick a code like <span className="font-mono text-soft">stage1</span> and
                share it. Only people here who enter the same code will see each other.
              </p>
            )}
          </form>
        )}
      </div>

      {/* First-visit intro, reopened from the ? button */}
      <Onboarding open={showOnboarding} onDone={finishOnboarding} />

      {/* Handshake Request Modal */}
      <HandshakeModal
        request={incomingRequest}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />

      {/* Active Transient Chat UI */}
      {activeChat && socket && (
        <TransientChat
          socket={socket}
          roomId={activeChat.roomId}
          peerProfile={activeChat.peerProfile}
          chatKey={activeChat.chatKey}
          myPublicKey={activeChat.myPublicKey}
          peerPublicKey={activeChat.peerPublicKey}
          safetyCode={activeChat.safetyCode}
          onClose={handleCloseChat}
        />
      )}
    </main>
  );
}
