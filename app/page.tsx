import Link from 'next/link';
import { ArrowRight, ChevronDown, Lock, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { HeroVisual } from './components/landing/HeroVisual';
import { LiveStats } from './components/landing/LiveStats';
import { Testimonials, hasTestimonials } from './components/landing/Testimonials';
import { FACTS, FAQS, FEATURES, STEPS, USE_CASES } from './components/landing/content';

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#security', label: 'Security' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#faq', label: 'FAQ' },
];

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-ink">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-base leading-relaxed text-subtle">{body}</p>}
    </div>
  );
}

function PrimaryCta({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href="/chat"
      className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-lg shadow-accent/25 transition hover:bg-accent-hover"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6" aria-label="Main">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm">📍</span>
            <span className="font-mono text-sm font-semibold uppercase tracking-widest text-ink">Obsidian Drop</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-subtle transition hover:text-ink">
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/chat"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas transition hover:opacity-90"
            >
              Open app
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top,var(--color-accent)_0%,transparent_60%)] opacity-[0.12]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-2 lg:pt-24">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent-ink">
                <Lock className="h-3 w-3" />
                End-to-end encrypted · No sign-up
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                Talk to the people in the room. <span className="text-accent-ink">Leave no trace.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-subtle lg:mx-0">
                Obsidian Drop shows you who&apos;s on your Wi-Fi and lets you start a private, encrypted chat in one tap.
                No accounts, no phone numbers, no history. Close the chat and it&apos;s gone.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <PrimaryCta>Start chatting nearby</PrimaryCta>
                <a href="#how-it-works" className="inline-flex items-center gap-1 text-sm font-medium text-soft transition hover:text-ink">
                  See how it works <ChevronDown className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-6 text-xs text-muted">Free · Works in your browser on any phone or laptop</p>
            </div>
            <div className="pb-16">
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* Live count and facts */}
        <section aria-label="Obsidian Drop in numbers" className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <LiveStats />
            </div>
            {FACTS.map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-line bg-canvas p-6">
                <p className="text-4xl font-semibold tracking-tight text-ink">{fact.value}</p>
                <p className="mt-2 text-sm leading-snug text-subtle">{fact.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
          <SectionHeading
            eyebrow="How it works"
            title="From stranger to private chat in three taps"
            body="No downloads, no contact swapping. If you're on the same network, you can talk."
          />
          <ol className="mt-16 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative rounded-2xl border border-line bg-surface p-8 shadow-sm">
                <span className="absolute right-6 top-6 font-mono text-5xl font-semibold text-line">{i + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/30">
                  <step.icon className="h-6 w-6 text-accent-ink" />
                </span>
                <h3 className="mt-6 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-subtle">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <SectionHeading eyebrow="Features" title="Private by design, simple by default" />
            <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <feature.icon className="h-5 w-5 text-accent-ink" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-subtle">{feature.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent-ink">Security</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                We can&apos;t read your messages. Here&apos;s how you can check.
              </h2>
              <ul className="mt-8 space-y-5">
                {[
                  ['Keys made on your device', 'Each chat gets a fresh key pair in your browser. The private half never leaves it.'],
                  ['Only scrambled text on our server', 'Messages are encrypted with AES-256-GCM before they leave your phone. We relay them and keep nothing.'],
                  ['A code you can compare', 'Both screens show the same 20-digit safety code. If they match, nobody swapped the keys in between.'],
                ].map(([title, body]) => (
                  <li key={title} className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" />
                    <div>
                      <p className="font-semibold text-ink">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-subtle">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety code illustration, matching the in-app card */}
            <div className="relative" aria-hidden="true">
              <div className="absolute -inset-6 rounded-3xl bg-accent/10 blur-2xl" />
              <div className="relative grid gap-4 sm:grid-cols-2">
                {[
                  ['🦊', 'Your screen'],
                  ['🐼', 'Their screen'],
                ].map(([avatar, label]) => (
                  <div key={label} className="rounded-2xl border border-line bg-surface p-5 text-center shadow-lg">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
                    <span className="mt-3 inline-block text-2xl">{avatar}</span>
                    <Lock className="mx-auto mt-3 h-4 w-4 text-accent-ink" />
                    <p className="mt-2 font-mono text-sm tracking-widest text-accent-ink">
                      38245 51645
                      <br />
                      02672 15640
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent-ink">
                      <ShieldCheck className="h-3 w-3" /> Codes match
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section id="use-cases" className="scroll-mt-20 border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <SectionHeading
              eyebrow="Use cases"
              title="Made for places full of people you haven't met"
              body="Anywhere people share a network but not each other's numbers."
            />
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {USE_CASES.map((useCase) => (
                <div key={useCase.title} className="rounded-2xl border border-line bg-canvas p-6 transition hover:border-accent/40">
                  <useCase.icon className="h-6 w-6 text-accent-ink" />
                  <h3 className="mt-4 font-semibold text-ink">{useCase.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-subtle">{useCase.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />

        {/* FAQ */}
        <section
          id="faq"
          className={`mx-auto max-w-3xl scroll-mt-20 px-6 py-24 ${hasTestimonials ? 'border-t border-line' : ''}`}
        >
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <div className="mt-12 divide-y divide-line rounded-2xl border border-line bg-surface">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-subtle">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final call to action */}
        <section className="px-6 pb-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,var(--color-accent)_0%,transparent_55%)] opacity-40" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight text-canvas sm:text-4xl">Someone nearby is one tap away</h2>
              <p className="mx-auto mt-4 max-w-xl text-canvas/70">
                Open the radar, see who&apos;s around, and say hello. Nothing to install, nothing saved.
              </p>
              <div className="mt-8">
                <PrimaryCta>Open the radar</PrimaryCta>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted sm:flex-row">
          <p className="font-mono text-xs uppercase tracking-widest">Obsidian Drop</p>
          <div className="flex gap-6">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-ink">
                {link.label}
              </a>
            ))}
          </div>
          <p>No accounts. No history. No trace.</p>
        </div>
      </footer>
    </div>
  );
}
