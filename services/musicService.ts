import type { Mood } from '../types';

type TrackSpec = {
  title: string;
  root: number;
  harmony: number[];
};

const musicSpecs: Record<Mood, TrackSpec> = {
  Reflective: {
    title: 'Gentle Contemplation',
    root: 220,
    harmony: [1, 1.5, 2],
  },
  Joyful: {
    title: 'Uplifting Spirit',
    root: 261.63,
    harmony: [1, 1.25, 1.5, 2],
  },
  Hopeful: {
    title: 'Peaceful Dawn',
    root: 246.94,
    harmony: [1, 1.333, 1.5, 2],
  },
  Courageous: {
    title: 'Resolute Heart',
    root: 196,
    harmony: [1, 1.2, 1.5, 2],
  },
};

const cache = new Map<Mood, { title: string; url: string }>();

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

const createAmbientWavDataUrl = (spec: TrackSpec) => {
  const sampleRate = 22050;
  const durationSeconds = 9;
  const sampleCount = sampleRate * durationSeconds;
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + sampleCount * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, sampleCount * bytesPerSample, true);

  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / sampleRate;
    const fadeIn = Math.min(1, time / 1.8);
    const fadeOut = Math.min(1, (durationSeconds - time) / 1.8);
    const envelope = Math.min(fadeIn, fadeOut);
    const shimmer = Math.sin(2 * Math.PI * 0.08 * time) * 0.12;
    const signal = spec.harmony.reduce((sum, ratio, index) => {
      const level = 0.13 / (index + 1);
      return sum + Math.sin(2 * Math.PI * spec.root * ratio * time) * level;
    }, 0);
    const sample = Math.max(-1, Math.min(1, (signal + shimmer * 0.08) * envelope));
    view.setInt16(44 + i * bytesPerSample, sample * 0x7fff, true);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
};

export const getAtmosphericMusic = async (mood: Mood): Promise<{ title: string; url: string }> => {
  const cached = cache.get(mood);
  if (cached) return cached;

  const spec = musicSpecs[mood];
  const track = {
    title: spec.title,
    url: createAmbientWavDataUrl(spec),
  };
  cache.set(mood, track);
  return track;
};
