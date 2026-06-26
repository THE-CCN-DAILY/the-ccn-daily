import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export interface FeaturesAmbientProps {
  theme?: 'dark' | 'light' | 'sepia';
}

const FEATURES = [
  {
    label: 'Daily Devotionals',
    text: 'A structured, quiet rhythm to meet God. Scripture, reflection, and journaling every morning.',
    accent: '#E8645A', // Crimson
    iconPath: 'M12 21c-1.17 0-2.07-.93-2.07-2.1v-13.8c0-1.17.9-2.1 2.07-2.1h8c1.17 0 2.07.93 2.07 2.1v13.8c0 1.17-.9 2.1-2.07 2.1h-8zm0 0c-1.17 0-2.07-.93-2.07-2.1v-13.8c0-1.17-.9-2.1-2.07-2.1h-4c-1.17 0-2.07.93-2.07 2.1v13.8c0 1.17.9 2.1 2.07 2.1h4',
  },
  {
    label: 'Bible Reader',
    text: 'Read the Word without distraction. Support for multiple translations and reading plans.',
    accent: '#F08060', // Ember
    iconPath: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z',
  },
  {
    label: 'Podcasts & Audio',
    text: 'Listen to careful, sound teaching. Faith-building conversations while you commute or walk.',
    accent: '#F5A855', // Amber
    iconPath: 'M12 2a5 5 0 0 0-5 5v5a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5zm7 10h-1.7a5.3 5.3 0 0 1-10.6 0H5a7 7 0 0 0 14 0z',
  },
  {
    label: 'Private Journal',
    text: 'Record your choices, prayers, and convictions in a quiet space without public feeds.',
    accent: '#D4A840', // Gold
    iconPath: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  },
  {
    label: 'Community & Prayer',
    text: 'Share requests, stand with others, and carry each other\'s burdens in digital rooms.',
    accent: '#8EB470', // Sage
    iconPath: 'M16.5 13c-1.2 0-3.07.34-3.5 1-1 .2-2 .2-3 0-.43-.66-2.3-1-3.5-1C4.3 13 2 14.8 2 17v2h18v-2c0-2.2-2.3-4-3.5-4zM6 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm12 0c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z',
  },
  {
    label: 'Courses & Events',
    text: 'Structured online studies and gatherings to build up your faith and local ministry.',
    accent: '#5E88B5', // Blue
    iconPath: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5.47 12.5L12 16l6.53-3.5L12 9.5 5.47 12.5z',
  },
];

const THEME_SURFACES = {
  dark: { skyFrom: '#0D0B09', skyTo: '#171310' },
  light: { skyFrom: '#FDF8F0', skyTo: '#FFF2DD' },
  sepia: { skyFrom: '#F5EDD8', skyTo: '#EADFC6' },
};

export const FeaturesAmbient: React.FC<FeaturesAmbientProps> = ({ theme = 'dark' }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  
  const surface = THEME_SURFACES[theme] ?? THEME_SURFACES.dark;
  const slideDuration = Math.floor(durationInFrames / FEATURES.length);
  
  const index = Math.floor(frame / slideDuration) % FEATURES.length;
  const localFrame = frame % slideDuration;
  
  const activeFeature = FEATURES[index];
  
  // Transition animations within each slide
  const fadeIn = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(localFrame, [slideDuration - 15, slideDuration], [1, 0], { extrapolateLeft: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);
  
  const yOffset = interpolate(localFrame, [0, 25], [18, 0], {
    extrapolateRight: 'clamp',
  });
  
  // Background glow scale breathing
  const scale = 1.0 + 0.05 * Math.sin((2 * Math.PI * frame) / 180);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${surface.skyFrom} 0%, ${surface.skyTo} 100%)` }}>
      {/* Dynamic background glow matching the active feature's accent */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 500px at center, ${activeFeature.accent}12 0%, transparent 80%)`,
          opacity,
          transform: `scale(${scale})`,
          transition: 'background 0.5s ease',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          textAlign: 'center',
          padding: '0 10%',
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
            width: width * 0.07,
            height: width * 0.07,
            borderRadius: '24%',
            backgroundColor: `${activeFeature.accent}18`,
            border: `1.5px solid ${activeFeature.accent}40`,
            color: activeFeature.accent,
            marginBottom: height * 0.05,
            boxShadow: `0 10px 30px ${activeFeature.accent}0f`,
          }}
        >
          <svg
            width={width * 0.035}
            height={width * 0.035}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={activeFeature.iconPath} />
          </svg>
        </div>

        {/* Feature Title */}
        <h2
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: Math.round(width * 0.038),
            fontWeight: 700,
            color: theme === 'dark' ? '#F0E8D8' : '#2A1C15',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {activeFeature.label}
        </h2>

        {/* Feature Subtext */}
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: Math.round(width * 0.016),
            fontWeight: 400,
            lineHeight: 1.6,
            color: theme === 'dark' ? 'rgba(250,248,245,0.65)' : 'rgba(42,28,21,0.65)',
            marginTop: height * 0.03,
            maxWidth: width * 0.6,
          }}
        >
          {activeFeature.text}
        </p>

        {/* Progress Dots */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: height * 0.06,
          }}
        >
          {FEATURES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? activeFeature.accent : 'rgba(128,128,128,0.25)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
