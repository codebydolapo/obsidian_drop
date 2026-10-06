import { TESTIMONIALS } from './content';

// Sample quotes are for previewing the design locally; production shows only real ones
const visibleTestimonials = TESTIMONIALS.filter((t) => !t.sample || process.env.NODE_ENV !== 'production');

export const hasTestimonials = visibleTestimonials.length > 0;

export function Testimonials() {
  if (!hasTestimonials) return null;

  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-ink">What people say</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Loved by rooms full of strangers</h2>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {visibleTestimonials.map((t, i) => (
          <figure key={i} className="flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm">
            {t.sample && (
              <span className="mb-4 self-start rounded-full bg-danger/10 px-2 py-0.5 font-mono text-[10px] uppercase text-danger-ink">
                Sample, dev only
              </span>
            )}
            <blockquote className="flex-1 text-sm leading-relaxed text-soft">“{t.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-raised text-xl">{t.avatar}</span>
              <span>
                <span className="block text-sm font-semibold text-ink">{t.name}</span>
                <span className="block text-xs text-muted">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
