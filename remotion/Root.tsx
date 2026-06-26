/**
 * Remotion Root — registers all CCN Daily video compositions.
 *
 * To preview: npx remotion studio remotion/index.ts
 * To render:  npx remotion render remotion/index.ts VerseCard out/verse.mp4
 */

import React from 'react';
import { Composition } from 'remotion';
import { VerseCard, type VerseCardProps } from './VerseCard';
import { DawnAmbient, type DawnAmbientProps } from './DawnAmbient';
import { FeaturesAmbient } from './FeaturesAmbient';

// Remotion requires ComponentType<Record<string, unknown>> — cast through unknown
const VC = VerseCard as unknown as React.ComponentType<Record<string, unknown>>;
const DA = DawnAmbient as unknown as React.ComponentType<Record<string, unknown>>;
const FA = FeaturesAmbient as unknown as React.ComponentType<Record<string, unknown>>;

const dawnDefaults: DawnAmbientProps = {
  verseText: 'But those who hope in the Lord will renew their strength.',
  verseRef: 'Isaiah 40:31',
  theme: 'dark',
};

const defaultProps: VerseCardProps = {
  verseText: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.',
  verseRef: 'Isaiah 40:31',
  brandName: 'THE CCN DAILY',
  theme: 'dark',
};

export const RemotionRoot: React.FC = () => (
  <>
    {/* 9:16 portrait — WhatsApp Status, Instagram Stories, YouTube Shorts */}
    <Composition
      id="VerseCard"
      component={VC}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={defaultProps as unknown as Record<string, unknown>}
    />
    {/* 1:1 square — Instagram Feed, WhatsApp messages */}
    <Composition
      id="VerseCardSquare"
      component={VC}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={defaultProps as unknown as Record<string, unknown>}
    />
    {/* 16:9 landscape — Facebook, YouTube thumbnails */}
    <Composition
      id="VerseCardLandscape"
      component={VC}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultProps as unknown as Record<string, unknown>}
    />
    {/* Seamless-looping ambient devotional motion — landing hero/section breaks.
        Wide banner ratio; plays live via @remotion/player and renders to MP4. */}
    <Composition
      id="DawnAmbient"
      component={DA}
      durationInFrames={240}
      fps={30}
      width={1920}
      height={800}
      defaultProps={dawnDefaults as unknown as Record<string, unknown>}
    />
    {/* Animated app features slideshow — highlight and transition features. */}
    <Composition
      id="FeaturesAmbient"
      component={FA}
      durationInFrames={600}
      fps={30}
      width={1920}
      height={800}
      defaultProps={{ theme: 'dark' } as unknown as Record<string, unknown>}
    />
  </>
);
