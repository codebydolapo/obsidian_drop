'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';

// Decorative preview of the app: a radar with peers, plus an incoming request card
const PEERS = [
  { avatar: '🦊', name: 'Neon Fox', x: -92, y: -54, delay: 0.4 },
  { avatar: '🐼', name: 'Lunar Panda', x: 88, y: -18, delay: 0.9 },
  { avatar: '🦉', name: 'Solar Owl', x: -40, y: 86, delay: 1.4 },
];

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      {/* Glow */}
      <div className="absolute -inset-10 rounded-full bg-accent/20 blur-3xl" />

      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border border-line bg-surface p-3 shadow-2xl shadow-accent/10">
        <div className="rounded-4xl border border-line bg-canvas px-5 pb-8 pt-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent-ink">Obsidian Drop</span>
            <span className="rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[10px] text-soft">🦄 Velvet Owl</span>
          </div>

          {/* Radar */}
          <div className="relative mx-auto mt-6 flex h-64 w-64 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-accent/30" />
            <div className="absolute inset-12 rounded-full border border-accent/20" />
            {!reduceMotion &&
              [0, 1].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-accent/50"
                  animate={{ scale: [0.15, 1], opacity: [0.9, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: i * 1.5 }}
                />
              ))}
            <div className="z-10 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-lg shadow-lg shadow-accent/40">
              📍
            </div>
            {PEERS.map((peer) => (
              <motion.div
                key={peer.name}
                className="absolute z-20 flex items-center gap-1 rounded-full border border-accent/40 bg-surface px-2 py-1 shadow-md"
                style={{ x: peer.x, y: peer.y }}
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: peer.delay, type: 'spring', stiffness: 260, damping: 18 }}
              >
                <span className="text-sm">{peer.avatar}</span>
                <span className="font-mono text-[10px] text-accent-ink">{peer.name}</span>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-center font-mono text-[10px] text-muted">3 active peers on your network</p>
        </div>
      </div>

      {/* Incoming request card */}
      <motion.div
        className="absolute -bottom-16 -left-2 w-56 rounded-2xl border border-line bg-surface p-4 shadow-xl sm:-left-12"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🐼</span>
          <div>
            <p className="text-xs font-semibold text-ink">Lunar Panda</p>
            <p className="text-[11px] text-muted">wants to chat</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="flex-1 rounded-lg border border-line py-1.5 text-center text-[11px] text-soft">Decline</span>
          <span className="flex-1 rounded-lg bg-accent py-1.5 text-center text-[11px] font-medium text-on-accent">Accept</span>
        </div>
      </motion.div>

      {/* Encryption badge */}
      <motion.div
        className="absolute -right-2 bottom-28 flex items-center gap-1.5 rounded-full border border-accent/40 bg-surface px-3 py-1.5 shadow-lg sm:-right-10"
        initial={reduceMotion ? false : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.6, duration: 0.5 }}
      >
        <Lock className="h-3 w-3 text-accent-ink" />
        <span className="font-mono text-[10px] text-accent-ink">End-to-end encrypted</span>
      </motion.div>
    </div>
  );
}
