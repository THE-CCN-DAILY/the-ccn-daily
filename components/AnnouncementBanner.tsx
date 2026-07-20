import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Megaphone, Sparkles, Gift, CalendarDays, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getLiveAnnouncements, type Announcement, type AnnouncementStyle } from '../services/announcementService';

const PAID_TIERS = new Set(['pro', 'max', 'partner']);
const DISMISS_KEY = 'phoenix_dismissed_announcements';

// Tonal themes — a tinted surface from the brand ramp + an accent, never a loud fill.
const STYLE_THEME: Record<AnnouncementStyle, { seed: string; icon: typeof Megaphone; eyebrow: string }> = {
  default: { seed: 'var(--ember)', icon: Megaphone, eyebrow: 'Announcement' },
  seasonal: { seed: 'var(--gold-ds)', icon: Sparkles, eyebrow: 'Seasonal' },
  product: { seed: 'var(--crimson)', icon: Gift, eyebrow: 'New' },
  event: { seed: 'var(--sage)', icon: CalendarDays, eyebrow: 'Event' },
};

const loadDismissed = (): string[] => {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]'); } catch { return []; }
};

const AnnouncementBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);

  const isPaid = PAID_TIERS.has((user?.tier as string) || 'free');

  useEffect(() => {
    let mounted = true;
    getLiveAnnouncements('banner', isPaid)
      .then((list) => { if (mounted) setItems(list); })
      .catch(() => { if (mounted) setItems([]); });
    return () => { mounted = false; };
  }, [isPaid]);

  const current = useMemo(
    () => items.find((a) => !dismissed.includes(a.id)) ?? null,
    [items, dismissed],
  );

  if (!current) return null;

  const theme = STYLE_THEME[current.style] ?? STYLE_THEME.default;
  const Icon = theme.icon;

  const dismiss = () => {
    const next = [...dismissed, current.id];
    setDismissed(next);
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next.slice(-50))); } catch { /* ignore */ }
  };

  const onCta = () => {
    const url = current.ctaUrl?.trim();
    if (!url) return;
    if (/^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
    else navigate(url.startsWith('/') ? url : `/${url}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-6 overflow-hidden rounded-2xl border"
        style={{
          borderColor: `color-mix(in srgb, ${theme.seed} 15%, transparent)`,
          background: `linear-gradient(135deg, color-mix(in srgb, ${theme.seed} 14%, var(--bg-card)) 0%, var(--bg-card) 70%)`,
          boxShadow: 'var(--sh-card)',
        }}
      >
        {/* Accent edge */}
        <div className="absolute inset-y-0 left-0 w-1" style={{ background: theme.seed }} aria-hidden />

        <div className="flex items-center gap-4 p-4 pl-6 sm:p-5 sm:pl-7">
          {current.imageUrl ? (
            current.mediaType === 'video' ? (
              <video src={current.imageUrl} className="hidden sm:block h-16 w-28 rounded-xl object-cover flex-shrink-0" muted autoPlay loop playsInline />
            ) : (
              <img src={current.imageUrl} alt="" className="hidden sm:block h-16 w-16 rounded-xl object-cover flex-shrink-0" />
            )
          ) : (
            <div
              className="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${theme.seed} 18%, transparent)`, color: theme.seed }}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.seed }}>
              {theme.eyebrow}
            </p>
            <h3 className="mt-0.5 text-base font-bold leading-snug text-brand-text-primary sm:text-lg">
              {current.title}
            </h3>
            {current.body && (
              <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary line-clamp-2">{current.body}</p>
            )}
          </div>

          {current.ctaLabel && current.ctaUrl && (
            <button
              type="button"
              onClick={onCta}
              className="hidden sm:inline-flex flex-shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: theme.seed }}
            >
              {current.ctaLabel} <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss announcement"
            className="flex-shrink-0 self-start rounded-full p-1.5 text-brand-text-secondary transition-colors hover:bg-brand-secondary hover:text-brand-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile CTA (full-width under content) */}
        {current.ctaLabel && current.ctaUrl && (
          <div className="px-4 pb-4 sm:hidden">
            <button
              type="button"
              onClick={onCta}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: theme.seed }}
            >
              {current.ctaLabel} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBanner;
