/**
 * DawnAmbient — Remotion composition
 *
 * A seamless-looping ambient motion piece for the landing page: dawn light
 * breathing over an open Scripture, the CCN flame rising and settling. Built to
 * loop perfectly (every animated value is a periodic function of
 * frame / durationInFrames, so frame 0 == frame N) so it can run as a quiet
 * background loop without a visible seam.
 *
 * Lives in the app bundle (played live via @remotion/player, lazy-loaded) and is
 * also renderable to MP4/WebM for social:
 *   npx remotion render remotion/index.ts DawnAmbient out/dawn-ambient.mp4
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export interface DawnAmbientProps {
  verseText?: string;
  verseRef?: string;
  theme?: 'dark' | 'light' | 'sepia';
}

const THEMES = {
  dark: {
    skyFrom: '#0D0B09', skyTo: '#1C0F08',
    glow: '#F27D26', glowSoft: '#7B3200',
    arc: '#F27D26', flame: '#FFAF50', flameCore: '#FFD9A0',
    text: 'rgba(250,248,245,0.82)', ref: '#F8A060',
  },
  light: {
    skyFrom: '#FDF8F0', skyTo: '#FFF4E0',
    glow: '#E87A2C', glowSoft: '#D4813C',
    arc: '#C23B1E', flame: '#E06A15', flameCore: '#F27D26',
    text: 'rgba(42,28,21,0.72)', ref: '#C23B1E',
  },
  sepia: {
    skyFrom: '#F5EDD8', skyTo: '#EDE0C4',
    glow: '#C23B1E', glowSoft: '#A8521E',
    arc: '#8E1B1B', flame: '#C23B1E', flameCore: '#D4A84A',
    text: 'rgba(42,28,21,0.70)', ref: '#8E1B1B',
  },
};

const TAU = Math.PI * 2;

export const DawnAmbient: React.FC<DawnAmbientProps> = ({
  verseText = 'But those who hope in the Lord will renew their strength.',
  verseRef = 'Isaiah 40:31',
  theme = 'dark',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const p = THEMES[theme] ?? THEMES.dark;

  // Single normalized phase [0,1) over the whole loop. Every value below is a
  // periodic function of `t`, so the last frame eases back into the first.
  const t = (frame % durationInFrames) / durationInFrames;

  // One soft "breath" per loop: 0 at the seam, peaks mid-loop, returns to 0.
  const breath = 0.5 - 0.5 * Math.cos(TAU * t);
  // Slow drift that returns to start (full sine period over the loop).
  const drift = Math.sin(TAU * t);

  const cx = width / 2;
  const horizon = height * 0.72;

  // Dawn glow rises and settles a touch with the breath.
  const glowY = horizon - 40 - breath * 26;
  const glowOpacity = 0.28 + breath * 0.22;

  // Flame breathes: scales and brightens gently.
  const flameScale = 0.94 + breath * 0.12;
  const flameOpacity = 0.7 + breath * 0.3;

  // Verse fades up softly then settles — never fully out, so it reads the whole loop.
  const verseOpacity = 0.55 + breath * 0.45;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${p.skyFrom} 0%, ${p.skyTo} 100%)` }}>
      {/* Drifting dawn glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 46% at ${50 + drift * 4}% ${(glowY / height) * 100}%, ${p.glow} 0%, ${p.glowSoft} 30%, transparent 68%)`,
          opacity: glowOpacity,
        }}
      />

      {/* Concentric sunrise arcs — opacity ripples outward with the breath */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }}>
        <g fill="none" stroke={p.arc}>
          {[150, 250, 360, 480, 620].map((r, i) => {
            // Phase-shift each ring so the ripple travels outward, looping seamlessly.
            const ripple = 0.5 - 0.5 * Math.cos(TAU * (t - i * 0.08));
            return (
              <circle
                key={r}
                cx={cx}
                cy={horizon}
                r={r}
                strokeWidth={1.4 - i * 0.18}
                strokeOpacity={(0.06 + ripple * 0.1) * (1 - i * 0.12)}
              />
            );
          })}
        </g>

        {/* Horizon line */}
        <line x1={cx - 360} y1={horizon} x2={cx + 360} y2={horizon} stroke={p.arc} strokeWidth="1" strokeOpacity="0.18" />
      </svg>

      {/* Breathing flame above the horizon */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: horizon - 150,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${flameScale})`,
          transformOrigin: 'center bottom',
          opacity: flameOpacity,
          filter: `drop-shadow(0 0 30px ${p.flame}66)`,
        }}
      >
        <svg width="120" height="150" viewBox="0 0 120 150" fill="none">
          <path d="M60 8 C 84 44, 80 78, 60 96 C 40 78, 36 44, 60 8 Z" fill={p.flame} />
          <path d="M60 34 C 72 56, 70 74, 60 86 C 50 74, 48 56, 60 34 Z" fill={p.flameCore} fillOpacity="0.9" />
        </svg>
      </div>

      {/* Scripture line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: horizon + 40,
          padding: '0 8%',
          textAlign: 'center',
          opacity: verseOpacity,
        }}
      >
        <p
          style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: Math.round(width * 0.026),
            lineHeight: 1.5,
            color: p.text,
            margin: 0,
          }}
        >
          &ldquo;{verseText}&rdquo;
        </p>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: Math.round(width * 0.013),
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: p.ref,
            marginTop: Math.round(height * 0.03),
          }}
        >
          {verseRef}
        </p>
      </div>
    </AbsoluteFill>
  );
};
