/**
 * AmbientDevotionalMotion — a quiet, looping dawn-over-Scripture motion piece for
 * a landing section break. Performance- and accessibility-minded:
 *  - The Remotion player is code-split (React.lazy) and only mounts once the
 *    section scrolls into view, so it never weighs down first paint.
 *  - `prefers-reduced-motion` is respected: those visitors get a still, gentle
 *    gradient with the same verse — no animation, no player loaded at all.
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AmbientPlayer = React.lazy(() => import('./AmbientPlayer'));

interface AmbientDevotionalMotionProps {
  verseText?: string;
  verseRef?: string;
}

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

const StaticFallback: React.FC<{ verseText: string; verseRef: string }> = ({ verseText, verseRef }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden
      style={{
        background:
          'radial-gradient(ellipse 60% 46% at 50% 62%, rgba(242,125,38,0.28) 0%, rgba(123,50,0,0.18) 30%, transparent 68%)',
      }}
    />
    <p className="relative font-serif italic text-base leading-[1.7] text-brand-text-secondary sm:text-lg">
      &ldquo;{verseText}&rdquo;
    </p>
    <p className="relative mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">
      {verseRef}
    </p>
  </div>
);

const AmbientDevotionalMotion: React.FC<AmbientDevotionalMotionProps> = ({
  verseText = 'But those who hope in the Lord will renew their strength.',
  verseRef = 'Isaiah 40:31',
}) => {
  const { theme } = useTheme();
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  // The Remotion player is scaled hard on a narrow phone and the bright dawn glow can
  // moiré into a noisy band there; the still gradient + verse reads cleaner and is far
  // lighter on mobile. So phones get the static fallback, desktops keep the motion.
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
      aria-label="Ambient devotional motion"
      className="relative w-full overflow-hidden border-y border-brand-border bg-brand-dark"
    >
      <div ref={ref} className="relative mx-auto w-full max-w-6xl min-h-[240px] sm:min-h-0 sm:aspect-[1920/800]">
        {reduced || isSmallScreen || !inView ? (
          <StaticFallback verseText={verseText} verseRef={verseRef} />
        ) : (
          <Suspense fallback={<StaticFallback verseText={verseText} verseRef={verseRef} />}>
            <AmbientPlayer verseText={verseText} verseRef={verseRef} theme={playerTheme} />
          </Suspense>
        )}
      </div>
    </section>
  );
};

export default AmbientDevotionalMotion;
