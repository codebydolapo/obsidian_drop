'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Handshake, Lock, Radar as RadarIcon } from 'lucide-react';

const STEPS = [
  {
    icon: RadarIcon,
    title: 'Find people nearby',
    body: 'Everyone on your Wi-Fi with Obsidian Drop open shows up on your radar. No sign-up, just a random name.',
  },
  {
    icon: Handshake,
    title: 'Say hello',
    body: 'Tap someone on the radar to send a chat request. They have 30 seconds to accept.',
  },
  {
    icon: Lock,
    title: 'Private and temporary',
    body: 'Chats are end-to-end encrypted and never saved. Closing a chat ends it for both of you.',
  },
];

export function Onboarding({ open, onDone }: { open: boolean; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const { icon: Icon, title, body } = STEPS[step];

  const finish = () => {
    setStep(0);
    onDone();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/40">
              <Icon className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 id="onboarding-title" className="mt-4 text-lg font-semibold text-slate-100">
              {title}
            </h2>
            <p className="mt-2 min-h-[3.75rem] text-sm text-slate-400">{body}</p>

            {/* Progress dots */}
            <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-emerald-400' : 'w-1.5 bg-slate-700'}`}
                />
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={step === 0 ? finish : () => setStep(step - 1)}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                {step === 0 ? 'Skip' : 'Back'}
              </button>
              <button
                onClick={isLast ? finish : () => setStep(step + 1)}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-emerald-400"
              >
                {isLast ? 'Get started' : 'Next'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
