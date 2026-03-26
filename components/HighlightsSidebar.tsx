import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Highlight } from '../types';
import { NoteIcon, MicrophoneIcon, StopIcon, SpeakerWaveIcon, SpinnerIcon } from './icons';
import { generateTagsForNote } from '../services/geminiService';
import { useNotifications } from '../contexts/NotificationContext';

// FIX: Add types for the browser's SpeechRecognition API to resolve TypeScript errors.
// This API is not yet part of the standard TypeScript DOM library.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}


interface HighlightsSidebarProps {
  highlights: Highlight[];
  editingHighlight: Highlight | null;
  onEditNote: (highlight: Highlight | null) => void;
  onSaveNote: (highlightId: string, noteText: string, voiceNoteUrl?: string, tags?: string[]) => void;
}

const colorClasses = {
    yellow: 'border-yellow-400',
    blue: 'border-sky-400',
    green: 'border-green-400',
    pink: 'border-pink-400',
};

const Tag: React.FC<{ label: string; isActive?: boolean; onClick?: () => void; }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-2 py-1 text-xs rounded-full transition-colors ${
            isActive 
            ? 'bg-brand-accent text-white' 
            : 'bg-brand-secondary hover:bg-brand-accent/20 text-brand-text-secondary hover:text-brand-text-primary'
        }`}
    >
        {label}
    </button>
);

const HighlightsSidebar: React.FC<HighlightsSidebarProps> = ({ highlights, editingHighlight, onEditNote, onSaveNote }) => {
  const { notify } = useNotifications();
  const [noteText, setNoteText] = useState('');
  const [isTagging, setIsTagging] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | undefined>(undefined);
  
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const cleanupMedia = () => {
    speechRecognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    speechRecognitionRef.current = null;
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    setIsListening(false);
  };

  useEffect(() => {
    if (editingHighlight) {
      setNoteText(editingHighlight.note || '');
      setRecordedAudioUrl(editingHighlight.voiceNoteUrl);
    } else {
      cleanupMedia();
    }
    // Make sure to clean up when the component unmounts or editing highlight changes.
    return cleanupMedia;
  }, [editingHighlight]);
  
  const handleVoiceTyping = async () => {
    if (isListening) {
      cleanupMedia();
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !navigator.mediaDevices?.getUserMedia) {
        notify("Sorry, your browser doesn't support the required voice note APIs.", "error");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // --- Setup Speech Recognition (Transcription) ---
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        speechRecognitionRef.current = recognition;
        
        // --- Setup Media Recorder (Audio Recording) ---
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = []; // Reset chunks

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
                setRecordedAudioUrl(reader.result as string);
            };
            reader.readAsDataURL(audioBlob);
        };

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => cleanupMedia();
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            cleanupMedia();
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript.length > 0) {
                setNoteText(prev => (prev.trim() ? prev + ' ' : '') + finalTranscript);
            }
        };
        
        recognition.start();
        recorder.start();

    } catch (err) {
        console.error("Error accessing microphone:", err);
        notify("Could not access the microphone. Please check your browser permissions.", "error");
    }
  };
  
  const handleSave = async () => {
    if (editingHighlight) {
      setIsTagging(true);
      
      let generatedTags: string[] = [];
      try {
        if (noteText.trim()) {
            generatedTags = await generateTagsForNote(noteText);
        }
      } catch (e) {
          console.error("Failed to generate AI tags:", e);
          generatedTags.push("Untagged"); // Fallback tag
      }
      
      onSaveNote(editingHighlight.id, noteText, recordedAudioUrl, generatedTags);
      setIsTagging(false);
      setRecordedAudioUrl(undefined);
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    highlights.forEach(h => h.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [highlights]);

  const filteredHighlights = useMemo(() => {
    if (!activeTag) return highlights;
    return highlights.filter(h => h.tags?.includes(activeTag));
  }, [highlights, activeTag]);


  if (editingHighlight) {
    const borderColorClass = colorClasses[editingHighlight.color];
    const isSpeechApiSupported = !!(typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window));

    return (
        <div>
            <h3 className="text-lg font-bold text-brand-text-primary mb-2">Add Note</h3>
            <p className={`text-sm text-brand-text-secondary border-l-4 ${borderColorClass} pl-2 mb-4 italic`} dangerouslySetInnerHTML={{ __html: `&quot;${editingHighlight.text}&quot;` }}/>
            <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full h-32 p-2 bg-brand-secondary border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="Type or use the microphone to dictate your reflections..."
            />
             <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleVoiceTyping}
                        disabled={!isSpeechApiSupported}
                        title={isSpeechApiSupported ? "Start/Stop Voice Typing" : "Speech recognition not supported in this browser"}
                        className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed'}`}
                    >
                        {isListening ? <StopIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                    </button>
                    {isListening && <span className="text-sm text-red-400">Listening...</span>}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={() => onEditNote(null)} className="px-4 py-2 text-sm rounded-lg hover:bg-brand-secondary">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isTagging}
                        className="px-4 py-2 text-sm rounded-lg bg-brand-accent text-white hover:bg-brand-accent-dark flex items-center justify-center w-24"
                    >
                        {isTagging ? <SpinnerIcon className="w-5 h-5"/> : 'Save Note'}
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div>
      {allTags.length > 0 && (
        <div className="mb-4 p-3 bg-brand-secondary/50 rounded-lg">
            <h4 className="text-sm font-semibold text-brand-text-secondary mb-2">Filter by Tag</h4>
            <div className="flex flex-wrap gap-2">
                <Tag label="All" isActive={!activeTag} onClick={() => setActiveTag(null)} />
                {allTags.map(tag => (
                    <Tag key={tag} label={tag} isActive={tag === activeTag} onClick={() => setActiveTag(tag)} />
                ))}
            </div>
        </div>
      )}

      {highlights.length === 0 ? (
        <p className="text-sm text-brand-text-secondary text-center py-8">Select text in the reader to create your first highlight.</p>
      ) : (
        <ul className="space-y-4">
          {filteredHighlights.map(h => {
             const borderColorClass = colorClasses[h.color];
             const playAudio = () => {
                if (h.voiceNoteUrl) {
                    const audio = new Audio(h.voiceNoteUrl);
                    audio.play().catch(e => console.error("Audio playback failed:", e));
                }
             }
             return (
                <li key={h.id} className={`p-3 bg-brand-secondary/50 rounded-lg border-l-4 ${borderColorClass}`}>
                    <p className="italic text-brand-text-primary cursor-pointer" onClick={() => onEditNote(h)} dangerouslySetInnerHTML={{ __html: `&quot;${h.text}&quot;` }}/>
                    
                    {h.tags && h.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {h.tags.map((tag, index) => <Tag key={`${h.id}-${tag}-${index}`} label={tag} />)}
                        </div>
                    )}
                    
                    {h.note && (
                        <div className="mt-2 p-2 bg-brand-dark/50 rounded text-sm text-brand-text-secondary">
                            <p>{h.note}</p>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                        {!h.note && (
                            <button onClick={() => onEditNote(h)} className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
                                <NoteIcon className="w-4 h-4" />
                                Add Note
                            </button>
                        )}
                        {h.voiceNoteUrl && (
                             <button onClick={playAudio} className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
                                <SpeakerWaveIcon className="w-4 h-4" />
                                Play Recording
                            </button>
                        )}
                    </div>
                </li>
             )
          })}
        </ul>
      )}
    </div>
  );
};

export default HighlightsSidebar;
