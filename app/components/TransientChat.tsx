'use client';

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { Profile } from '../identity';
import { decryptMessage, encryptMessage, EncryptedPayload } from '../lib/crypto';
import { hasSeenHint, markHintSeen } from '../lib/hints';
import { Lock, Send, ShieldAlert, ShieldCheck, X } from 'lucide-react';

export interface Message {
  senderId: string;
  text: string;
  timestamp: number;
  undecryptable?: boolean;
}

type EncryptedMessage = EncryptedPayload & { senderId: string; timestamp: number };

const MAX_MESSAGE_LENGTH = 1000;

interface TransientChatProps {
  socket: Socket;
  roomId: string;
  peerProfile: Profile;
  chatKey: CryptoKey;
  myPublicKey: string;
  peerPublicKey: string;
  safetyCode: string;
  onClose: () => void;
}

export function TransientChat({
  socket,
  roomId,
  peerProfile,
  chatKey,
  myPublicKey,
  peerPublicKey,
  safetyCode,
  onClose,
}: TransientChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [peerLeft, setPeerLeft] = useState(false);
  // Whether the user compared safety codes with the peer
  const [verification, setVerification] = useState<'unchecked' | 'match' | 'mismatch'>('unchecked');
  const [confirmingClose, setConfirmingClose] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const safetyCardRef = useRef<HTMLDivElement>(null);
  const chatLocked = peerLeft || verification === 'mismatch';

  useEffect(() => {
    // Decrypt one at a time so messages keep their arrival order
    let queue = Promise.resolve();

    const handleReceiveMessage = (msg: EncryptedMessage) => {
      // A message only decrypts with the key of the side that really sent it
      const senderPublicKey = msg.senderId === socket.id ? myPublicKey : peerPublicKey;
      queue = queue.then(async () => {
        let text = '';
        let undecryptable = false;
        try {
          text = await decryptMessage(chatKey, msg, senderPublicKey);
        } catch {
          undecryptable = true;
        }
        setMessages((prev) => [...prev, { senderId: msg.senderId, timestamp: msg.timestamp, text, undecryptable }]);
      });
    };

    // Peer closed the chat or disconnected
    const handlePeerLeft = ({ roomId: leftRoomId }: { roomId: string }) => {
      if (leftRoomId === roomId) setPeerLeft(true);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('peer_left', handlePeerLeft);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('peer_left', handlePeerLeft);
    };
  }, [socket, roomId, chatKey, myPublicKey, peerPublicKey]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerLeft]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || chatLocked) return;
    setInput('');

    // The server only ever sees the ciphertext
    const payload = await encryptMessage(chatKey, text.slice(0, MAX_MESSAGE_LENGTH), myPublicKey);
    socket.emit('send_message', { roomId, ...payload });
  };

  // First close explains that the chat is gone for good; later closes are instant
  const handleCloseClick = () => {
    if (peerLeft || hasSeenHint('close_chat')) {
      onClose();
    } else {
      setConfirmingClose(true);
    }
  };

  const confirmClose = () => {
    markHintSeen('close_chat');
    onClose();
  };

  const headerStatus = {
    unchecked: { icon: Lock, text: 'Encrypted • Tap to verify', className: 'text-subtle hover:text-ink' },
    match: { icon: ShieldCheck, text: 'Encrypted • Verified', className: 'text-accent-ink hover:text-accent-ink' },
    mismatch: { icon: ShieldAlert, text: 'Codes did not match', className: 'text-danger-ink hover:text-danger-ink' },
  }[verification];
  const StatusIcon = headerStatus.icon;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-40 flex flex-col bg-canvas text-ink"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-raised text-xl border border-line-strong">
            {peerProfile.avatar}
          </div>
          <div>
            <h2 className="font-semibold text-sm text-ink">{peerProfile.name}</h2>
            <button
              type="button"
              onClick={() => safetyCardRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className={`flex items-center gap-1 text-xs font-mono transition ${headerStatus.className}`}
            >
              <StatusIcon className="h-3 w-3" />
              <span>{headerStatus.text}</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleCloseClick}
          aria-label="Close chat"
          className="rounded-full p-2 text-subtle hover:bg-raised hover:text-ink transition"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Safety code: matching codes on both screens mean nobody intercepted the keys */}
        <div ref={safetyCardRef} className="mx-auto max-w-sm">
          {verification === 'unchecked' && (
            <div className="rounded-2xl border border-line-strong bg-surface p-4 text-center">
              <Lock className="mx-auto h-5 w-5 text-accent-ink" />
              <p className="mt-2 text-xs text-soft">
                This chat is end-to-end encrypted. Check it&apos;s really {peerProfile.name}: compare this code with their screen.
              </p>
              <p className="mt-3 font-mono text-lg tracking-widest text-accent-ink">{safetyCode}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setVerification('mismatch')}
                  className="flex-1 rounded-xl border border-line-strong px-3 py-2 text-xs text-soft transition hover:bg-raised"
                >
                  They don&apos;t match
                </button>
                <button
                  onClick={() => setVerification('match')}
                  className="flex-1 rounded-xl bg-accent px-3 py-2 text-xs font-medium text-on-accent transition hover:bg-accent-hover"
                >
                  They match
                </button>
              </div>
              <p className="mt-3 text-[11px] text-muted">Messages aren&apos;t saved anywhere. Closing the chat ends it for both of you.</p>
            </div>
          )}
          {verification === 'match' && (
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-mono text-accent-ink/80">
              <ShieldCheck className="h-3 w-3" />
              You verified the safety code with {peerProfile.name}
            </p>
          )}
          {verification === 'mismatch' && (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-center">
              <ShieldAlert className="mx-auto h-5 w-5 text-danger-ink" />
              <p className="mt-2 text-xs text-danger-ink">
                The codes don&apos;t match. Someone may be intercepting this chat, so sending is turned off. Close it and try again.
              </p>
              <button
                onClick={() => setVerification('unchecked')}
                className="mt-3 text-[11px] text-subtle underline underline-offset-2 hover:text-ink"
              >
                I misread it, compare again
              </button>
            </div>
          )}
        </div>

        {messages.map((msg, index) => {
          const isMe = msg.senderId === socket.id;
          return (
            <div
              key={index}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMe
                    ? 'bg-accent text-on-accent font-medium rounded-br-none'
                    : 'bg-raised text-ink rounded-bl-none border border-line-strong/50'
                }`}
              >
                {msg.undecryptable ? <em className="opacity-70">Couldn&apos;t decrypt this message</em> : msg.text}
              </div>
              <span className="mt-1 text-[10px] text-muted font-mono px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        })}
        {peerLeft && (
          <p className="text-center text-xs font-mono text-muted py-2">
            {peerProfile.name} left the chat
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={sendMessage} className="border-t border-line bg-surface/50 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={chatLocked}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={
              peerLeft ? 'Chat ended' : verification === 'mismatch' ? 'Sending turned off' : `Message ${peerProfile.name}...`
            }
            className="flex-1 rounded-full border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatLocked}
            aria-label="Send"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-on-accent transition hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* One-time reminder that closing is permanent */}
      {confirmingClose && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-scrim p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-line-strong bg-surface p-6 text-center">
            <h3 className="text-base font-semibold text-ink">End this chat?</h3>
            <p className="mt-2 text-sm text-subtle">
              Closing ends the chat for both of you. Messages aren&apos;t saved, so they can&apos;t be recovered.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmingClose(false)}
                className="flex-1 rounded-xl border border-line-strong bg-raised/80 px-4 py-3 text-sm font-medium text-soft transition hover:bg-line-strong"
              >
                Keep chatting
              </button>
              <button
                onClick={confirmClose}
                className="flex-1 rounded-xl bg-danger px-4 py-3 text-sm font-medium text-on-danger transition hover:bg-danger-hover"
              >
                End chat
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}