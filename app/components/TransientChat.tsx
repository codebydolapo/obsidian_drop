'use client';

import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { Profile } from '../identity';
import { decryptMessage, encryptMessage, EncryptedPayload } from '../lib/crypto';
import { Send, X, ShieldCheck } from 'lucide-react';

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
  const [showSafetyCode, setShowSafetyCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!text || peerLeft) return;
    setInput('');

    // The server only ever sees the ciphertext
    const payload = await encryptMessage(chatKey, text.slice(0, MAX_MESSAGE_LENGTH), myPublicKey);
    socket.emit('send_message', { roomId, ...payload });
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-40 flex flex-col bg-slate-950 text-slate-100"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xl border border-slate-700">
            {peerProfile.avatar}
          </div>
          <div>
            <h2 className="font-semibold text-sm text-slate-100">{peerProfile.name}</h2>
            <button
              type="button"
              onClick={() => setShowSafetyCode((shown) => !shown)}
              className="flex items-center gap-1 text-xs text-emerald-400 font-mono hover:text-emerald-300"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>End-to-end encrypted • Not stored</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Safety code: matching codes on both screens mean nobody intercepted the keys */}
      {showSafetyCode && (
        <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-3 text-center">
          <p className="font-mono text-base tracking-widest text-emerald-300">{safetyCode}</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Compare this code with {peerProfile.name}&apos;s screen. If it matches, only the two of you can read this chat.
          </p>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 text-xs gap-2">
            <span className="text-3xl">🔒</span>
            <p>Session started. Messages will auto-destruct when closed.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === socket.id;
            return (
              <div
                key={index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/50'
                  }`}
                >
                  {msg.undecryptable ? <em className="opacity-70">Couldn&apos;t decrypt this message</em> : msg.text}
                </div>
                <span className="mt-1 text-[10px] text-slate-500 font-mono px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        {peerLeft && (
          <p className="text-center text-xs font-mono text-slate-500 py-2">
            {peerProfile.name} left the chat
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={sendMessage} className="border-t border-slate-800 bg-slate-900/50 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={peerLeft}
            maxLength={1000}
            placeholder={peerLeft ? 'Chat ended' : `Message ${peerProfile.name}...`}
            className="flex-1 rounded-full border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || peerLeft}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}