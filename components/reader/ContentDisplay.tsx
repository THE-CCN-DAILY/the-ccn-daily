import React, { useState, useRef, useEffect } from 'react';
import Card from '../Card';
import TextSelectionPopover from '../TextSelectionPopover';
import ReaderSidebar from './ReaderSidebar';
import ReaderSettingsModal from '../ReaderSettingsModal';
import ContentsModal from '../TableOfContentsModal';
import ReaderToolbar from './ReaderToolbar';
import ReaderEngine from './ReaderEngine';
import ReaderFooter from '../ReaderFooter';
import type { Highlight, ReaderSettings } from '../../types';
import useMediaQuery from '../../hooks/useMediaQuery';
import HighlightActionPopover from './HighlightActionPopover';
import { getPremiumTtsAudio } from '../../services/ttsService';
import VoiceSelectionPopover from './VoiceSelectionPopover';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getHighlightsForContent, saveHighlight, deleteHighlight, updateHighlight } from '../../services/firestoreService';
import { useGamification } from '../../contexts/GamificationContext';

interface ContentDisplayProps {
  contentId: string;
  initialContent: string;
  title: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ contentId, initialContent, title }) => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const { dispatchGamificationEvent } = useGamification();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(true);

  const [settings, setSettings] = useState<ReaderSettings>({
      fontFamily: 'font-serif',
      fontSize: 1,
      lineSpacing: 'normal',
      theme: 'dark',
      margins: 'normal',
      narratorVoice: 'Zephyr',
  });
  
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  
  const [highlightPopover, setHighlightPopover] = useState<{ top: number; left: number; id: string } | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContentsOpen, setIsContentsOpen] = useState(false);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const isMobileScreen = useMediaQuery('(max-width: 768px)');

  const readerCardRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLDivElement>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (user) {
      setIsLoadingHighlights(true);
      getHighlightsForContent(user.uid, contentId)
        .then(setHighlights)
        .catch(console.error)
        .finally(() => setIsLoadingHighlights(false));
    } else {
      // If user logs out, clear highlights
      setHighlights([]);
      setIsLoadingHighlights(false);
    }
  }, [user, contentId]);

  useEffect(() => {
    return () => {
      const audio = ttsAudioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
        ttsAudioRef.current = null;
      }
      setIsReadingAloud(false);
    };
  }, [contentId]);

  const handleSettingsChange = (newSettings: Partial<ReaderSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
      if (newSettings.narratorVoice && isReadingAloud) {
          const audio = ttsAudioRef.current;
          if (audio) {
            audio.pause();
            audio.src = '';
          }
      }
  };
  
  const handleToggleReadAloud = async () => {
    if (!articleRef.current) return;
    const audio = ttsAudioRef.current;

    if (audio && !audio.paused) {
      audio.pause();
      return;
    }

    if (audio) {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(err => console.error("Audio resume/replay failed:", err.message));
      return;
    }

    try {
      const textToSpeak = articleRef.current.innerText;
      const audioUrl = await getPremiumTtsAudio(textToSpeak, settings.narratorVoice);
      const newAudio = new Audio();
      
      const handleCanPlay = () => {
        newAudio.play().catch(err => {
          if (err.name !== 'AbortError') {
            console.error("Audio playback failed:", err.message);
            notify("Sorry, an audio playback error occurred.", "error");
          }
        });
      };

      newAudio.addEventListener('canplay', handleCanPlay, { once: true });
      newAudio.onplay = () => setIsReadingAloud(true);
      newAudio.onpause = () => setIsReadingAloud(false);
      newAudio.onended = () => setIsReadingAloud(false);
      newAudio.onerror = () => {
        notify("Sorry, an audio playback error occurred.", "error");
        setIsReadingAloud(false);
        ttsAudioRef.current = null;
      };

      newAudio.src = audioUrl;
      ttsAudioRef.current = newAudio;
    } catch (error) {
      notify("Sorry, the premium audio narration could not be played.", "error");
      setIsReadingAloud(false);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    setTimeout(() => {
        if (target.tagName === 'MARK' && target.dataset.highlightId) {
            if (readerCardRef.current) {
                const rect = target.getBoundingClientRect();
                const cardRect = readerCardRef.current.getBoundingClientRect();
                setHighlightPopover({
                    id: target.dataset.highlightId,
                    top: rect.top - cardRect.top - 50,
                    left: rect.left - cardRect.left + rect.width / 2,
                });
                window.getSelection()?.removeAllRanges();
                setSelection(null);
                setSelectedText(null);
            }
            return; 
        }

        if (isSettingsOpen || isContentsOpen || isVoiceSelectorOpen) {
            setSelection(null);
            setSelectedText(null);
            return;
        }

        const currentSelection = window.getSelection();
        if (currentSelection && !currentSelection.isCollapsed) {
          const range = currentSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (readerCardRef.current && readerCardRef.current.contains(range.commonAncestorContainer)) {
            setSelection(currentSelection);
            setSelectedText(currentSelection.toString());
            const cardRect = readerCardRef.current.getBoundingClientRect();
            setPopoverPosition({ top: rect.top - cardRect.top - 50, left: rect.left - cardRect.left + rect.width / 2 });
            setHighlightPopover(null);
          } else {
            setSelection(null);
            setSelectedText(null);
          }
        } else {
          setSelection(null);
          setSelectedText(null);
          setHighlightPopover(null);
        }
    }, 10);
  };
  
  const clearSelection = () => {
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      setSelectedText(null);
  };

  const addHighlight = (color: Highlight['color']) => {
    if (selectedText && user) {
      const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const newHighlight: Highlight = {
        id: highlightId,
        contentId,
        text: selectedText,
        color: color,
        createdAt: new Date().toISOString(),
      };
      setHighlights(prev => [...prev, newHighlight]); // Optimistic update
      saveHighlight(user.uid, newHighlight).catch(err => {
        console.error("Failed to save highlight:", err);
        setHighlights(prev => prev.filter(h => h.id !== newHighlight.id)); // Revert on error
      });
      dispatchGamificationEvent('e4');
      clearSelection();
    }
  };

  const removeHighlight = (id: string) => {
    if (user) {
      const originalHighlights = [...highlights];
      setHighlights(prev => prev.filter(h => h.id !== id)); // Optimistic update
      deleteHighlight(user.uid, id).catch(err => {
        console.error("Failed to delete highlight:", err);
        setHighlights(originalHighlights); // Revert on error
      });
      setHighlightPopover(null);
    }
  };

  const addNoteToSelection = () => {
     if (selectedText && user) {
      const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const newHighlight: Highlight = {
        id: highlightId,
        contentId,
        text: selectedText,
        note: '',
        color: 'yellow',
        createdAt: new Date().toISOString(),
      };
      
      setHighlights(prev => [...prev, newHighlight]);
      saveHighlight(user.uid, newHighlight).catch(err => {
        console.error("Failed to save highlight:", err);
        setHighlights(prev => prev.filter(h => h.id !== newHighlight.id));
      });
      
      setEditingHighlight(newHighlight);
      dispatchGamificationEvent('e4');
      clearSelection();
    }
  }

  const handleCopy = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(`"${selectedText}"\n\n- From THE CCN DAILY App`);
      } catch (err) {
        notify("Could not copy text.", "error");
      } finally {
        clearSelection();
      }
    }
  };
  
  const handleShare = () => {
    if (selectedText) {
      const textToShare = `"${selectedText}"\n\n- From THE CCN DAILY App`;
      if (isMobileScreen && navigator.share) {
        navigator.share({ title: "Selection from THE CCN DAILY", text: textToShare, url: window.location.href })
          .finally(clearSelection);
      } else {
        handleCopy();
      }
    }
  };

  const updateNote = (highlightId: string, noteText: string, voiceNoteUrl?: string, tags?: string[]) => {
    if (user) {
      const originalHighlights = [...highlights];
      const updatedHighlight = highlights.find(h => h.id === highlightId);
      if (!updatedHighlight) return;

      const changes = { ...updatedHighlight, note: noteText, voiceNoteUrl, tags };
      setHighlights(prev => prev.map(h => h.id === highlightId ? changes : h));
      
      updateHighlight(user.uid, highlightId, { note: noteText, voiceNoteUrl, tags }).catch(err => {
        console.error("Failed to update note:", err);
        setHighlights(originalHighlights);
      });
      setEditingHighlight(null);
    }
  }
  
  const readerContainerClasses = `lg:col-span-2 flex flex-col min-h-0 reader-container theme-${settings.theme}`;

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className={readerContainerClasses}>
            <Card ref={readerCardRef} className="flex-1 flex flex-col overflow-hidden relative" onMouseUp={handleMouseUp}>
                <ReaderToolbar 
                  title={title}
                  isReadAloud={isReadingAloud}
                  narratorVoice={settings.narratorVoice}
                  onToggleReadAloud={handleToggleReadAloud}
                  onContentsClick={() => setIsContentsOpen(true)}
                  onSettingsClick={() => setIsSettingsOpen(true)}
                  onVoiceSelectorClick={() => setIsVoiceSelectorOpen(prev => !prev)}
                />
                
                {selection && (
                    <TextSelectionPopover 
                        top={popoverPosition.top}
                        left={popoverPosition.left}
                        onHighlight={addHighlight}
                        onAddNote={addNoteToSelection}
                        onCopy={handleCopy}
                        onShare={handleShare}
                    />
                )}

                {highlightPopover && (
                  <HighlightActionPopover
                    top={highlightPopover.top}
                    left={highlightPopover.left}
                    onRemove={() => removeHighlight(highlightPopover.id)}
                    onClose={() => setHighlightPopover(null)}
                  />
                )}

                {isVoiceSelectorOpen && (
                    <VoiceSelectionPopover 
                        currentVoice={settings.narratorVoice}
                        onChange={(voice) => handleSettingsChange({ narratorVoice: voice })}
                        onClose={() => setIsVoiceSelectorOpen(false)}
                    />
                )}

                <ReaderEngine 
                  articleRef={articleRef}
                  initialContent={initialContent}
                  highlights={highlights}
                  settings={settings}
                />
               
                <ReaderFooter />
            </Card>
        </div>
        <div className="lg:col-span-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col overflow-hidden">
              <ReaderSidebar
                  highlights={highlights}
                  editingHighlight={editingHighlight}
                  onEditNote={setEditingHighlight}
                  onSaveNote={updateNote}
              />
          </Card>
        </div>
      
      {isSettingsOpen && <ReaderSettingsModal settings={settings} onChange={handleSettingsChange} onClose={() => setIsSettingsOpen(false)} />}
      {isContentsOpen && <ContentsModal onClose={() => setIsContentsOpen(false)} />}
    </div>
  );
};

export default ContentDisplay;
