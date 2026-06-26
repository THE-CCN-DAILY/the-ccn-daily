import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const FeaturesPlayer = React.lazy(() => import('./FeaturesPlayer'));

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
};

const StaticFallback: React.FC = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center bg-brand-dark">
    <div
      className="pointer-events-none absolute inset-0 opacity-15"
      aria-hidden
      style={{
        background:
          'radial-gradient(circle 400px at center, var(--color-brand-accent) 0%, transparent 80%)',
      }}
    />
    <p className="relative font-serif italic text-base leading-relaxed text-brand-text-secondary sm:text-lg">
      "Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom."
    </p>
    <p className="relative mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
      Colossians 3:16
    </p>
    <div className="relative mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-widest text-brand-text-tertiary">
      <span>Devotionals</span>
      <span>•</span>
      <span>Bible Reader</span>
      <span>•</span>
      <span>Podcasts</span>
      <span>•</span>
      <span>Journal</span>
      <span>•</span>
      <span>Community</span>
      <span>•</span>
      <span>Courses</span>
    </div>
  </div>
);

const FeaturesDevotionalMotion: React.FC = () => {
  const { theme } = useTheme();
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isSmallScreen = useMediaQuery('(max-width: 640px)');
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playerTheme = theme === 'light' || theme === 'sepia' ? theme : 'dark';

  return (
    <section
      aria-label="App features visual showcase"
      className="relative w-full overflow-hidden border-y border-brand-border bg-brand-dark"
    >
      <div ref={ref} className="relative mx-auto w-full max-w-6xl min-h-[280px] sm:min-h-0 sm:aspect-[1920/800]">
        {reduced || isSmallScreen || !inView ? (
          <StaticFallback />
        ) : (
          <Suspense fallback={<StaticFallback />}>
            <FeaturesPlayer theme={playerTheme} />
          </Suspense>
        )}
      </div>
    </section>
  );
};

export default FeaturesDevotionalMotion;
