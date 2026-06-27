import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { BookOpen, BookOpenCheck, Headphones, NotebookPen, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const FEATURES = [
  {
    label: 'Daily Devotionals',
    text: 'A structured, quiet rhythm to meet God. Scripture, reflection, and journaling every morning.',
    accent: '#E8645A', // Crimson
    icon: BookOpen,
    bgGlow: 'rgba(232, 100, 90, 0.08)',
  },
  {
    label: 'Bible Reader',
    text: 'Read the Word without distraction. Support for multiple translations and reading plans.',
    accent: '#F08060', // Ember
    icon: BookOpenCheck,
    bgGlow: 'rgba(240, 128, 96, 0.08)',
  },
  {
    label: 'Podcasts & Audio',
    text: 'Listen to careful, sound teaching. Faith-building conversations while you commute or walk.',
    accent: '#F5A855', // Amber
    icon: Headphones,
    bgGlow: 'rgba(245, 168, 85, 0.08)',
  },
  {
    label: 'Private Journal',
    text: 'Record your choices, prayers, and convictions in a quiet space without public feeds.',
    accent: '#D4A840', // Gold
    icon: NotebookPen,
    bgGlow: 'rgba(212, 168, 64, 0.08)',
  },
  {
    label: 'Community & Prayer',
    text: 'Share requests, stand with others, and carry each other\'s burdens in digital rooms.',
    accent: '#8EB470', // Sage
    icon: 'rgba(142, 180, 112, 0.08)',
    iconComponent: Users,
    bgGlow: 'rgba(142, 180, 112, 0.08)',
  },
  {
    label: 'Courses & Events',
    text: 'Structured online studies and gatherings to build up your faith and local ministry.',
    accent: '#5E88B5', // Blue
    icon: GraduationCap,
    bgGlow: 'rgba(94, 136, 181, 0.08)',
  },
];

// Re-map community icon properly
const FEATURES_CLEANED = FEATURES.map(f => ({
  ...f,
  icon: typeof f.icon === 'string' ? f.iconComponent || Users : f.icon
}));

const InteractiveFeaturesCarousel: React.FC = () => {
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const isReducedMotion = useReducedMotion();
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % FEATURES_CLEANED.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + FEATURES_CLEANED.length) % FEATURES_CLEANED.length);
  };

  const handleDotClick = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  // Reset autoplay timer when index changes
  useEffect(() => {
    if (isReducedMotion) return;

    autoplayRef.current = setInterval(() => {
      handleNext();
    }, 4500); // 4.5 seconds per slide

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [index, isReducedMotion]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '30%' : '-30%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-30%' : '30%',
      opacity: 0,
    }),
  };

  const active = FEATURES_CLEANED[index];
  const IconComponent = active.icon;

  const surfaceClass = theme === 'light'
    ? 'bg-gradient-to-b from-[#FDF8F0] to-[#FFF2DD] border-brand-border/20 text-[#2A1C15]'
    : theme === 'sepia'
    ? 'bg-gradient-to-b from-[#F5EDD8] to-[#EADFC6] border-brand-border/20 text-[#2A1C15]'
    : 'bg-gradient-to-b from-[#0D0B09] to-[#171310] border-brand-border/10 text-[#F0E8D8]';

  return (
    <section
      aria-label="Interactive features showcase"
      className={`relative w-full overflow-hidden border-y border-brand-border/30 py-16 px-6 md:py-24 ${surfaceClass}`}
    >
      {/* Soft Ambient Glow from active feature color */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 blur-[120px] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle 350px at center, ${active.accent} 0%, transparent 80%)`,
        }}
      />

      <div className="relative max-w-3xl mx-auto flex flex-col items-center">
        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-brand-dark/20 border border-brand-border/40 hover:bg-brand-accent/10 hover:border-brand-accent text-brand-text-secondary hover:text-brand-accent transition-all duration-200"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-brand-dark/20 border border-brand-border/40 hover:bg-brand-accent/10 hover:border-brand-accent text-brand-text-secondary hover:text-brand-accent transition-all duration-200"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slide Content Display */}
        <div className="w-full min-h-[16rem] flex flex-col items-center justify-center text-center overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center max-w-xl"
            >
              {/* Icon Container with custom colored background glow */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-300"
                style={{
                  backgroundColor: active.bgGlow,
                  borderColor: `${active.accent}40`,
                  color: active.accent,
                  boxShadow: `0 8px 24px -6px ${active.accent}20`
                }}
              >
                <IconComponent className="w-8 h-8" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'var(--serif-display, "Cormorant Garamond", Georgia, serif)',
                  fontWeight: 600,
                  fontSize: '2rem',
                  lineHeight: 1.2
                }}
                className="mb-4 text-brand-text-primary"
              >
                {active.label}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'var(--serif-body, "EB Garamond", Georgia, serif)',
                  fontSize: '1.25rem',
                  lineHeight: 1.65,
                }}
                className="text-brand-text-secondary"
              >
                {active.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Interactive Progress Indicator Dots */}
        <div className="flex gap-3 mt-12 z-10" role="tablist" aria-label="Feature slides selection">
          {FEATURES_CLEANED.map((feat, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => handleDotClick(i)}
              className="group relative py-2 focus:outline-none"
            >
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? '24px' : '8px',
                  backgroundColor: i === index ? feat.accent : 'rgba(128,128,128,0.25)',
                }}
              />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-brand-dark border border-brand-border text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-brand-text-secondary whitespace-nowrap transition-transform origin-bottom duration-150">
                {feat.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InteractiveFeaturesCarousel;
