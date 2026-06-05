export type NarratorVoice = 'Zephyr' | 'Nova' | 'Kore';

export interface ReaderNarrationController {
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

type NarrationEvents = {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  onError?: () => void;
};

const voiceProfiles: Record<NarratorVoice, { rate: number; pitch: number; preferredIndex: number }> = {
  Zephyr: { rate: 0.92, pitch: 1.04, preferredIndex: 0 },
  Nova: { rate: 0.98, pitch: 1.0, preferredIndex: 1 },
  Kore: { rate: 0.88, pitch: 0.92, preferredIndex: 2 },
};

const loadVoices = async (): Promise<SpeechSynthesisVoice[]> => {
  if (!('speechSynthesis' in window)) return [];

  const existing = window.speechSynthesis.getVoices();
  if (existing.length) return existing;

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timeout);
      resolve(window.speechSynthesis.getVoices());
    };
  });
};

export const startReaderNarration = async (
  text: string,
  voice: NarratorVoice,
  events: NarrationEvents = {},
): Promise<ReaderNarrationController> => {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    throw new Error('Narration is not supported in this browser.');
  }

  const trimmedText = text.trim();
  if (!trimmedText) throw new Error('There is no text to read.');

  window.speechSynthesis.cancel();

  const profile = voiceProfiles[voice];
  const voices = await loadVoices();
  const englishVoices = voices.filter((availableVoice) =>
    availableVoice.lang.toLowerCase().startsWith('en')
  );

  const utterance = new SpeechSynthesisUtterance(trimmedText);
  utterance.rate = profile.rate;
  utterance.pitch = profile.pitch;
  utterance.voice = englishVoices[profile.preferredIndex] || englishVoices[0] || voices[0] || null;
  utterance.onstart = () => events.onStart?.();
  utterance.onpause = () => events.onPause?.();
  utterance.onresume = () => events.onResume?.();
  utterance.onend = () => events.onEnd?.();
  utterance.onerror = () => events.onError?.();

  window.speechSynthesis.speak(utterance);

  return {
    pause: () => window.speechSynthesis.pause(),
    resume: () => window.speechSynthesis.resume(),
    stop: () => window.speechSynthesis.cancel(),
  };
};
