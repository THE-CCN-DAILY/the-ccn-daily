import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { BookOpen, BookOpenCheck, Headphones, NotebookPen, Users, GraduationCap } from 'lucide-react';

export interface FeaturesAmbientProps {
  theme?: 'dark' | 'light' | 'sepia';
}

const FEATURES = [
  {
    label: 'Daily Devotionals',
    text: 'A structured, quiet rhythm to meet God. Scripture, reflection, and journaling every morning.',
    accent: '#E8645A', // Crimson
    icon: BookOpen,
  },
  {
    label: 'Bible Reader',
    text: 'Read the Word without distraction. Support for multiple translations and reading plans.',
    accent: '#F08060', // Ember
    icon: BookOpenCheck,
  },
  {
    label: 'Podcasts & Audio',
    text: 'Listen to careful, sound teaching. Faith-building conversations while you commute or walk.',
    accent: '#F5A855', // Amber
    icon: Headphones,
  },
  {
    label: 'Private Journal',
    text: 'Record your choices, prayers, and convictions in a quiet space without public feeds.',
    accent: '#D4A840', // Gold
    icon: NotebookPen,
  },
  {
    label: 'Community & Prayer',
    text: 'Share requests, stand with others, and carry each other\'s burdens in digital rooms.',
    accent: '#8EB470', // Sage
    icon: Users,
  },
  {
    label: 'Courses & Events',
    text: 'Structured online studies and gatherings to build up your faith and local ministry.',
    accent: '#5E88B5', // Blue
    icon: GraduationCap,
  },
];

const THEME_SURFACES = {
  dark: { skyFrom: '#0D0B09', skyTo: '#171310' },
  light: { skyFrom: '#FDF8F0', skyTo: '#FFF2DD' },
  sepia: { skyFrom: '#F5EDD8', skyTo: '#EADFC6' },
};

export const FeaturesAmbient: React.FC<FeaturesAmbientProps> = ({ theme = 'dark' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  const surface = THEME_SURFACES[theme] ?? THEME_SURFACES.dark;
  const slideDuration = Math.floor(durationInFrames / FEATURES.length);
  
  const index = Math.floor(frame / slideDuration) % FEATURES.length;
  const localFrame = frame % slideDuration;
  
  const activeFeature = FEATURES[index];
  
  // Transition timing: 15 frames for transition window at the end of each slide.
  const transitionFrames = 15;
  const isTransitioning = localFrame >= (slideDuration - transitionFrames);
  
  const nextIndex = (index + 1) % FEATURES.length;
  const nextFeature = FEATURES[nextIndex];
  
  let currOpacity = 1;
  let nextOpacity = 0;
  let currYOffset = 0;
  let nextYOffset = 20;
  
  if (isTransitioning) {
    const progress = (localFrame - (slideDuration - transitionFrames)) / transitionFrames;
    currOpacity = 1 - progress;
    nextOpacity = progress;
    currYOffset = interpolate(progress, [0, 1], [0, -20], { extrapolateRight: 'clamp' });
    nextYOffset = interpolate(progress, [0, 1], [20, 0], { extrapolateRight: 'clamp' });
  }
  
  // Background scale pulsing
  const scale = 1.0 + 0.05 * Math.sin((2 * Math.PI * frame) / 180);
 
  const renderSlide = (idx: number, opacity: number, yOffset: number) => {
    const feat = FEATURES[idx];
    const IconComponent = feat.icon;
    
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 12%',
          opacity,
          transform: `translateY(${yOffset}px)`,
        }}
      >
        {/* Animated Feature Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '24%',
            backgroundColor: `${feat.accent}18`,
            border: `1.5px solid ${feat.accent}40`,
            color: feat.accent,
            marginBottom: 24,
            boxShadow: `0 8px 24px ${feat.accent}0f`,
          }}
        >
          <IconComponent size={32} strokeWidth={1.6} />
        </div>

        {/* Feature Title */}
        <h2
          style={{
            fontFamily: '"Cormorant Garamond", "Didot", Georgia, serif',
            fontSize: 48,
            fontWeight: 700,
            color: theme === 'dark' ? '#F0E8D8' : '#2A1C15',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {feat.label}
        </h2>

        {/* Feature Subtext */}
        <p
          style={{
            fontFamily: '"EB Garamond", "Cormorant Garamond", "Garamond", Georgia, serif',
            fontSize: 22,
            fontWeight: 400,
            lineHeight: 1.55,
            color: theme === 'dark' ? 'rgba(250,248,245,0.72)' : 'rgba(42,28,21,0.72)',
            marginTop: 20,
            maxWidth: 620,
          }}
        >
          {feat.text}
        </p>

        {/* Progress Dots inside the slide so it fades and lines up perfectly */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 40,
          }}
        >
          {FEATURES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === idx ? feat.accent : 'rgba(128,128,128,0.25)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${surface.skyFrom} 0%, ${surface.skyTo} 100%)` }}>
      {/* Background glow cross-fade: current glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 500px at center, ${activeFeature.accent}12 0%, transparent 80%)`,
          opacity: currOpacity,
          transform: `scale(${scale})`,
        }}
      />
      {/* Background glow cross-fade: next glow */}
      {isTransitioning && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle 500px at center, ${nextFeature.accent}12 0%, transparent 80%)`,
            opacity: nextOpacity,
            transform: `scale(${scale})`,
          }}
        />
      )}

      {/* Render slides: current slide and next slide (fading in on top during transition) */}
      {renderSlide(index, currOpacity, currYOffset)}
      {isTransitioning && renderSlide(nextIndex, nextOpacity, nextYOffset)}
    </AbsoluteFill>
  );
};
