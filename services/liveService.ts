export interface LiveSessionCallbacks {
  onAudioData: (base64Audio: string) => void;
  onTranscription: (text: string, isUser: boolean) => void;
  onError: (msg: string) => void;
}

export const connectToSentientGuide = async (callbacks: LiveSessionCallbacks) => {
  const message =
    'Live voice guidance is paused while the app moves to Cloudflare-native AI. Text AI routes are active; realtime audio needs an approved provider and budget.';
  callbacks.onError(message);
  throw new Error(message);
};
