/**
 * VerseCard — Remotion composition
 *
 * A 10-second animated video card for daily Scripture verses.
 * Designed for sharing to WhatsApp Status, Instagram Stories, and Reels.
 * Dimensions: 1080×1920 (9:16 portrait) — Stories / WhatsApp format.
 *
 * Usage from Remotion Studio:
 *   npx remotion studio remotion/index.ts
 *
 * Render a video:
 *   npx remotion render remotion/index.ts VerseCard out/verse-card.mp4
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Easing,
} from 'remotion';

/* ─── Props ──────────────────────────────────────────────────────────────── */

export interface VerseCardProps {
  verseText: string;
  verseRef: string;
  brandName?: string;
  theme?: 'dark' | 'light' | 'sepia';
}

/* ─── Palette ─────────────────────────────────────────────────────────────── */

const THEMES = {
  dark: {
    bg: ['#0F0D0B', '#1A1208'],
    surface: 'rgba(28,25,23,0.85)',
    accent: '#F27D26',
    accentLight: '#FFAF50',
    text: '#FAF8F5',
    textSecondary: '#C4BEBA',
    border: 'rgba(242,125,38,0.3)',
  },
  light: {
    bg: ['#FAF8F5', '#F0E8DC'],
    surface: 'rgba(244,240,234,0.90)',
    accent: '#F27D26',
    accentLight: '#E06A15',
    text: '#1C1917',
    textSecondary: '#57534E',
    border: 'rgba(242,125,38,0.4)',
  },
  sepia: {
    bg: ['#F5F2E8', '#E8DCC8'],
    surface: 'rgba(237,230,216,0.90)',
    accent: '#B4913C',
    accentLight: '#D4A84A',
    text: '#29201A',
    textSecondary: '#5C4A3A',
    border: 'rgba(180,145,60,0.4)',
  },
};

/* ─── Helper: sunrise cross SVG ─────────────────────────────────────────── */

const CrossMark: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="17" y="6" width="6" height="28" rx="1.5" fill={color} />
    <rect x="8"  y="14" width="24" height="6" rx="1.5" fill={color} />
  </svg>
);

/* ─── Component ──────────────────────────────────────────────────────────── */

export const VerseCard: React.FC<VerseCardProps> = ({
  verseText,
  verseRef,
  brandName = 'THE CCN DAILY',
  theme = 'dark',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const palette = THEMES[theme];

  /* Timings (frames at 30fps, total = 300) */
  const bgDelay    = 0;
  const glowDelay  = 8;
  const crossDelay = 15;
  const lineDelay  = 22;
  const textDelay  = 30;
  const refDelay   = 55;
  const brandDelay = 70;
  const holdEnd    = durationInFrames - 20; // start fade-out 20 frames before end

  /* Global fade-out */
  const fadeOut = interpolate(frame, [holdEnd, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /* Background fade-in */
  const bgOpacity = interpolate(frame, [bgDelay, bgDelay + 20], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.ease,
  });

  /* Glow pulse — slow oscillation */
  const glowPulse = interpolate(
    Math.sin(((frame - glowDelay) / fps) * Math.PI),
    [-1, 1],
    [0.25, 0.55],
  );

  /* Cross scale spring */
  const crossScale = spring({
    frame: frame - crossDelay,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
  });

  /* Divider line width */
  const lineWidth = interpolate(frame, [lineDelay, lineDelay + 25], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  /* Verse text slide up */
  const textY = interpolate(frame, [textDelay, textDelay + 30], [24, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const textOpacity = interpolate(frame, [textDelay, textDelay + 30], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  /* Reference fade in */
  const refOpacity = interpolate(frame, [refDelay, refDelay + 20], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  /* Brand fade in */
  const brandOpacity = interpolate(frame, [brandDelay, brandDelay + 20], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(160deg, ${palette.bg[0]} 0%, ${palette.bg[1]} 100%)`,
          opacity: bgOpacity,
        }}
      />

      {/* Ambient glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${palette.accent}${Math.round(glowPulse * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          opacity: frame < glowDelay ? 0 : 1,
        }}
      />

      {/* Content container */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 72px',
          gap: 0,
        }}
      >
        {/* Cross mark */}
        <div
          style={{
            transform: `scale(${crossScale})`,
            marginBottom: 32,
            filter: `drop-shadow(0 0 24px ${palette.accent}88)`,
          }}
        >
          <CrossMark color={palette.accent} size={64} />
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${lineWidth * 80}px`,
            height: 1.5,
            background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`,
            marginBottom: 48,
          }}
        />

        {/* Verse text */}
        <div
          style={{
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <p
            style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              fontSize: 52,
              fontStyle: 'italic',
              fontWeight: 400,
              color: palette.text,
              lineHeight: 1.5,
              letterSpacing: '0.01em',
            }}
          >
            "{verseText}"
          </p>
        </div>

        {/* Reference */}
        <p
          style={{
            opacity: refOpacity,
            fontFamily: '"Inter", sans-serif',
            fontSize: 28,
            fontWeight: 600,
            color: palette.accent,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 64,
          }}
        >
          {verseRef}
        </p>

        {/* Brand footer */}
        <div
          style={{
            opacity: brandOpacity,
            position: 'absolute',
            bottom: 72,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 40,
              height: 1,
              background: palette.border,
              marginBottom: 8,
            }}
          />
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: palette.textSecondary,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            {brandName}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
