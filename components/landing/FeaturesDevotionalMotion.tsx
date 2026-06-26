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
  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center bg-brand-dark overflow-hidden">
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
    <p className="relative mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent mb-6">
      Colossians 3:16
    </p>
    
    {/* Infinite scrolling features ticker for clean mobile display */}
    <div className="relative w-full overflow-hidden py-3 border-t border-brand-border/10">
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div 
        className="flex gap-8 text-[11px] font-bold uppercase tracking-widest text-brand-text-tertiary w-fit"
        style={{ animation: 'marqueeScroll 25s linear infinite' }}
      >
        {['Devotionals', 'Bible Reader', 'Podcasts & Audio', 'Private Journal', 'Community & Prayer', 'Courses & Events'].map((name, i) => (
          <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="text-brand-accent">✦</span> {name}
          </span>
        ))}
        {['Devotionals', 'Bible Reader', 'Podcasts & Audio', 'Private Journal', 'Community & Prayer', 'Courses & Events'].map((name, i) => (
          <span key={`dup-${i}`} className="inline-flex items-center gap-2 whitespace-nowrap">
            <span className="text-brand-accent">✦</span> {name}
          </span>
        ))}
      </div>
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
      <div ref={ref} className="relative w-full min-h-[280px] sm:min-h-0 sm:aspect-[1920/800]">
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
