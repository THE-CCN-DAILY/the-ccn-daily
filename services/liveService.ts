import { adminAuthHeaders } from './adminAuth';
import { generateCloudflareText, scrubSlop } from './geminiService';

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


// Global speaking state to block audio echo loop in microphone capture
let isSpeaking = false;
let speakingTimeout: any = null;
let currentAudioElement: HTMLAudioElement | null = null;
let activeRecognition: any = null;

const speakLocalFallback = (text: string) => {
  if (!('speechSynthesis' in window)) {
    isSpeaking = false;
    return;
  }
  window.speechSynthesis.cancel();

  // Stop recognition to prevent echo loop
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      console.error('Failed to stop recognition', e);
    }
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.88;
  utterance.pitch = 0.92;
  utterance.volume = 0.9;

  utterance.onstart = () => {
    isSpeaking = true;
  };
  utterance.onend = () => {
    if (speakingTimeout) clearTimeout(speakingTimeout);
    speakingTimeout = setTimeout(() => {
      isSpeaking = false;
      if (activeRecognition) {
        try {
          activeRecognition.start();
        } catch (e) {
          console.error('Failed to restart recognition', e);
        }
      }
    }, 1200); // 1.2s decay buffer for echo to clear
  };
  utterance.onerror = () => {
    isSpeaking = false;
    if (activeRecognition) {
      try {
        activeRecognition.start();
      } catch (e) {
        console.error('Failed to restart recognition', e);
      }
    }
  };
  window.speechSynthesis.speak(utterance);
};

const speakResponse = async (text: string) => {
  isSpeaking = true;
  if (speakingTimeout) {
    clearTimeout(speakingTimeout);
    speakingTimeout = null;
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }

  // Stop recognition to prevent echo loop
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {
      console.error('Failed to stop recognition', e);
    }
  }

  try {
    const authHeaders = await adminAuthHeaders();
    const response = await fetch('/api/ai/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioElement = audio;

      audio.onended = () => {
        if (speakingTimeout) clearTimeout(speakingTimeout);
        speakingTimeout = setTimeout(() => {
          isSpeaking = false;
          if (activeRecognition) {
            try {
              activeRecognition.start();
            } catch (e) {
              console.error('Failed to restart recognition', e);
            }
          }
        }, 1200);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        isSpeaking = false;
        URL.revokeObjectURL(audioUrl);
        speakLocalFallback(text);
      };

      await audio.play();
      return;
    }
  } catch (err) {
    console.error('Workers AI TTS failed, using local fallback', err);
  }

  speakLocalFallback(text);
};

const getSpeechRecognition = () => {
  const win = window as any;
  return win.SpeechRecognition || win.webkitSpeechRecognition;
};

export const connectToPrayerCompanion = async (callbacks: LiveSessionCallbacks): Promise<PrayerCompanionSession> => {
  const RecognitionCtor = getSpeechRecognition();
  let recognition: SpeechRecognitionLike | null = null;
  let closed = false;

  const sendText = async (text: string) => {
    const clean = text.trim();
    if (!clean || closed) return;
    callbacks.onTranscription(clean, true);

    try {
      const isFinishing = /\b(amen|done|finish|finished|end)\b/i.test(clean);
      if (isFinishing) {
        callbacks.onTranscription(CLOSING_BLESSING, false);
        void speakResponse(CLOSING_BLESSING);
        return;
      }

      const reply = await generateCloudflareText({
        feature: 'prayerCompanion',
        prompt: clean,
        units: 300,
        systemInstruction: `You are a quiet, gentle, and wise prayer companion. Speak in the voice of a warm pastoral guide. 
Your role is to help the user bring their concerns before God. 

### RESPONDING RULES:
1. Keep your response extremely brief — exactly 1 or 2 short, gentle sentences of pastoral encouragement, followed by a brief invitation/prompt to pray.
2. Focus the attention on God, not on yourself. Acknowledge what they said with deep empathy, then direct their heart to prayer.
3. NEVER use bullet points, lists, numbered lists, or bold highlights in your conversation.
4. Adhere strictly to the theological guardrails and writing voice. 

### BLACKLISTED WORDS:
Additionally, Crucial, Elevate, Embark, Essentially, Furthermore, However, Journey, Landscape, Navigate, Realm, Robust, Symphony, Tapestry, Therefore, Thus, Ultimately, Vibrant, Vital.
Do not use em-dashes (—).`,
      });

      if (closed) return;
      const scrubbed = scrubSlop(reply || 'I hear you. Bring that before God for a breath, and let Him hold it.');
      callbacks.onTranscription(scrubbed, false);
      void speakResponse(scrubbed);
    } catch (err) {
      console.error('AI Prayer Companion failed, using static fallback bank', err);
      if (closed) return;
      const fallback = fallbackResponse(clean);
      callbacks.onTranscription(fallback, false);
      void speakResponse(fallback);
    }
  };

  callbacks.onTranscription(OPENING_PRAYER, false);
  void speakResponse(OPENING_PRAYER);

  if (RecognitionCtor) {
    recognition = new RecognitionCtor();
    activeRecognition = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = event => {
      if (isSpeaking) return;
      const latest = event.results?.[event.results.length - 1]?.[0]?.transcript || '';
      const clean = latest.trim();
      if (clean) {
        void sendText(clean);
      }
    };
    recognition.onerror = event => {
      const error = event?.error === 'not-allowed'
        ? 'Microphone access was blocked. You can still type your prayer below.'
        : 'Voice capture needs typed mode. You can continue below.';
      callbacks.onError(error);
    };
    recognition.onend = () => {
      if (!closed && !isSpeaking) {
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
      if (activeRecognition === recognition) {
        activeRecognition = null;
      }
      if (currentAudioElement) {
        currentAudioElement.pause();
        currentAudioElement = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      isSpeaking = false;
    },
  };
};
