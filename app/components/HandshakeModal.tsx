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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 shadow-2xl text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl ring-1 ring-emerald-500/40">
              {request.senderProfile.avatar}
            </div>

            <h3 className="text-lg font-semibold text-slate-100">
              {request.senderProfile.name}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              wants to drop a message nearby
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onDecline}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                <X className="h-4 w-4" />
                Decline
              </button>

              <button
                onClick={() => onAccept(request.fromSocketId)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
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