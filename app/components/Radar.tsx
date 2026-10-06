// components/Radar.tsx
'use client';
import { motion } from 'framer-motion';

interface Peer {
  socketId: string;
  name: string;
  avatar: string;
}

export function Radar({ peers, onSelectPeer }: { peers: Peer[]; onSelectPeer: (peer: Peer) => void }) {
  return (
    <div className="relative w-80 h-80 rounded-full border border-accent/30 bg-canvas flex items-center justify-center overflow-hidden">
      {/* Pulsing Radar Ring Animation */}
      <motion.div
        className="absolute inset-0 rounded-full border border-accent/50"
        animate={{ scale: [0.2, 1], opacity: [1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
      />
      
      {/* Centered User Indicator */}
      <div className="z-10 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-xl shadow-lg shadow-accent/50">
        📍
      </div>

      {/* Discovered Peers */}
      {peers.map((peer, idx) => {
        // Distribute peers around circular orbits
        const angle = (idx / peers.length) * 2 * Math.PI;
        const radius = 100; // px offset from center
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.button
            key={peer.socketId}
            onClick={() => onSelectPeer(peer)}
            className="absolute z-20 p-2 bg-raised/90 border border-accent/50 rounded-full flex items-center gap-1.5 shadow-md hover:scale-110 transition-transform"
            style={{ x, y }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <span className="text-lg">{peer.avatar}</span>
            <span className="text-xs text-accent-ink font-mono pr-1">{peer.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}