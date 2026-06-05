export interface LiveSessionCallbacks {
  onAudioData: (base64Audio: string) => void;
  onTranscription: (text: string, isUser: boolean) => void;
  onError: (msg: string) => void;
}

export interface PrayerCompanionSession {
  close: () => void;
  sendText: (text: string) => void;
  isSpeechSupported: boolean;
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

const OPENING_PRAYER =
  'I am here with you. Take one slow breath. What would you like to bring before God right now?';

const CLOSING_BLESSING =
  'Amen. Carry this gently: God is present, your heart has been heard, and the next faithful step can be small.';

const RESPONSE_BANK = [
  {
    match: ['anxious', 'worry', 'worried', 'fear', 'afraid', 'stress', 'stressed'],
    response:
      'Let us slow that down before the Lord. Name the worry in one sentence, then release the outcome you cannot control today.',
  },
  {
    match: ['thank', 'grateful', 'gratitude', 'praise'],
    response:
      'That is holy ground. Stay with gratitude for a moment and name the gift plainly before God.',
  },
  {
    match: ['forgive', 'sin', 'guilt', 'repent'],
    response:
      'Bring it into the light without hiding. Confession is not a performance; it is returning to the Father who receives you.',
  },
  {
    match: ['family', 'child', 'children', 'marriage', 'home'],
    response:
      'Lord, meet this household with patience, wisdom, and peace. Show one loving action that can be taken today.',
  },
  {
    match: ['work', 'job', 'business', 'meeting', 'leadership'],
    response:
      'Invite God into the work before you. Ask for clarity, courage, and a clean heart in the decisions ahead.',
  },
  {
    match: ['tired', 'weary', 'exhausted', 'burned'],
    response:
      'You do not have to carry the whole day at once. Receive enough strength for the next faithful step.',
  },
];

const fallbackResponse = (text: string) => {
  if (!text.trim()) return OPENING_PRAYER;
  if (/\b(amen|done|finish|finished|end)\b/i.test(text)) return CLOSING_BLESSING;
  const lower = text.toLowerCase();
  const matched = RESPONSE_BANK.find(item => item.match.some(word => lower.includes(word)));
  if (matched) return matched.response;
  return 'I hear you. Hold that before God for a breath, then ask: what is the faithful response for today?';
};

const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.88;
  utterance.pitch = 0.92;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
};

const getSpeechRecognition = () => {
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition;
};

export const connectToPrayerCompanion = async (callbacks: LiveSessionCallbacks): Promise<PrayerCompanionSession> => {
  const RecognitionCtor = getSpeechRecognition();
  let recognition: SpeechRecognitionLike | null = null;
  let closed = false;

  const sendText = (text: string) => {
    const clean = text.trim();
    if (!clean || closed) return;
    callbacks.onTranscription(clean, true);
    window.setTimeout(() => {
      if (closed) return;
      const reply = fallbackResponse(clean);
      callbacks.onTranscription(reply, false);
      speak(reply);
    }, 350);
  };

  callbacks.onTranscription(OPENING_PRAYER, false);
  speak(OPENING_PRAYER);

  if (RecognitionCtor) {
    recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = event => {
      const latest = event.results?.[event.results.length - 1]?.[0]?.transcript || '';
      sendText(latest);
    };
    recognition.onerror = event => {
      const error = event?.error === 'not-allowed'
        ? 'Microphone access was blocked. You can still type your prayer below.'
        : 'Voice capture needs typed mode. You can continue below.';
      callbacks.onError(error);
    };
    recognition.onend = () => {
      if (!closed) {
        try {
          recognition?.start();
        } catch {
          callbacks.onError('Voice capture needs typed mode. You can continue below.');
        }
      }
    };
    try {
      recognition.start();
    } catch {
      callbacks.onError('Voice capture needs typed mode. You can continue below.');
    }
  } else {
    callbacks.onError('Voice capture is not supported in this browser. You can type your prayer below.');
  }

  return {
    isSpeechSupported: Boolean(RecognitionCtor),
    sendText,
    close: () => {
      closed = true;
      recognition?.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
  };
};
