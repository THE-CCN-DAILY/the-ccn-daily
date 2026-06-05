export interface LiveSessionCallbacks {
  onAudioData: (base64Audio: string) => void;
  onTranscription: (text: string, isUser: boolean) => void;
  onError: (msg: string) => void;
}

export const connectToPrayerCompanion = async (callbacks: LiveSessionCallbacks) => {
  const message =
    'Live voice prayer is paused while the voice provider and budget are finalized.';
  callbacks.onError(message);
  throw new Error(message);
};
