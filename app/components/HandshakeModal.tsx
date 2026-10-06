'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '../identity';
import { Check, X } from 'lucide-react';

interface HandshakeModalProps {
  request: {
    fromSocketId: string;
    senderProfile: Profile;
  } | null;
  onAccept: (fromSocketId: string) => void;
  onDecline: () => void;
}

export function HandshakeModal({ request, onAccept, onDecline }: HandshakeModalProps) {
  return (
    <AnimatePresence>
      {request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm rounded-2xl border border-accent/30 bg-surface p-6 shadow-2xl text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-3xl ring-1 ring-accent/40">
              {request.senderProfile.avatar}
            </div>

            <h3 className="text-lg font-semibold text-ink">
              {request.senderProfile.name}
            </h3>
            <p className="mt-1 text-sm text-subtle">
              wants to drop a message nearby
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onDecline}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-raised/80 px-4 py-3 text-sm font-medium text-soft hover:bg-line-strong transition"
              >
                <X className="h-4 w-4" />
                Decline
              </button>

              <button
                onClick={() => onAccept(request.fromSocketId)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-on-accent hover:bg-accent-hover transition shadow-lg shadow-accent/20"
              >
                <Check className="h-4 w-4" />
                Accept
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}