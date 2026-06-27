import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, List, Settings } from 'lucide-react';
import ReaderSettingsModal from './ReaderSettingsModal';
import type { ReaderSettings } from '../../types';
import ShareCardModal from '../ShareCardModal';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface EpubReaderProps {
  url: string;
  title: string;
  author?: string;
  onClose: () => void;
}

const EpubReader: React.FC<EpubReaderProps> = ({ url, title, author, onClose }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<any[]>([]);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);

  const [settings, setSettings] = useState<ReaderSettings>({
    fontFamily: 'font-serif',
    fontSize: 2, // middle size: 18px
    lineSpacing: 'normal',
    theme: 'dark',
    margins: 'normal',
    narratorVoice: 'Zephyr'
  });
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [shareCardOpen, setShareCardOpen] = useState(false);

  // Dynamically load JSZip and EpubJS
  useEffect(() => {
    let active = true;
    const loadScripts = async () => {
      try {
        if (!(window as any).JSZip) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        if (!(window as any).ePub) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/epub.js/0.3.93/epub.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        if (active) setLoaded(true);
      } catch (err) {
        if (active) setError('Failed to load the ebook reader engine. Please try again.');
      }
    };
    loadScripts();
    return () => { active = false; };
  }, []);

  // Initialize Epub rendition
  useEffect(() => {
    if (!loaded || !viewerRef.current || !url) return;

    let active = true;
    // epubjs constructor requires window.ePub
    const book = (window as any).ePub(url);
    bookRef.current = book;

    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      flow: 'paginated',
      spread: 'none',
    });
    renditionRef.current = rendition;

    rendition.display().then(() => {
      book.navigation.ready.then((nav: any) => {
        if (active) setToc(nav.toc || []);
      });
    });

    applyStyles(rendition, settings);

    rendition.on('relocated', (location: any) => {
      if (!active) return;
      if (location?.start?.percentage) {
        setProgress(Math.round(location.start.percentage * 100));
      }
    });

    rendition.on('selected', (cfiRange: string, contents: any) => {
      const selection = contents.window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      if (text) {
        if (text.length > 1500) {
          toast.warning("For copyright compliance, book sharing is limited to 1,500 characters.");
          setSelectedText(text.slice(0, 1500) + '...');
        } else {
          setSelectedText(text);
        }
      }
    });

    rendition.on('click', () => {
      setSelectedText(null);
    });

    return () => {
      active = false;
      book.destroy();
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [loaded, url]);

  const applyStyles = (rendition: any, currentSettings: ReaderSettings) => {
    if (!rendition) return;

    const themeColors = {
      light: { bg: '#FBF6EA', fg: '#2A1C15' },
      sepia: { bg: '#EDE0C4', fg: '#2A1C15' },
      dark: { bg: '#221915', fg: '#F0E8D8' },
    };
    const c = themeColors[currentSettings.theme as 'light' | 'sepia' | 'dark'] || themeColors.dark;

    rendition.themes.register('custom', {
      body: {
        background: `${c.bg} !important`,
        color: `${c.fg} !important`,
        'font-family': currentSettings.fontFamily === 'font-sans' ? 'sans-serif !important' : currentSettings.fontFamily === 'font-readable' ? 'Atkinson Hyperlegible, sans-serif !important' : 'Georgia, serif !important',
        'line-height': currentSettings.lineSpacing === 'loose' ? '2 !important' : currentSettings.lineSpacing === 'relaxed' ? '1.75 !important' : '1.5 !important',
      },
      p: { color: `${c.fg} !important` },
      h1: { color: `${c.fg} !important` },
      h2: { color: `${c.fg} !important` },
      h3: { color: `${c.fg} !important` },
    });
    rendition.themes.select('custom');

    const sizes = ['14px', '16px', '18px', '20px', '24px'];
    rendition.themes.fontSize(sizes[currentSettings.fontSize] || '18px');
  };

  const handleSettingsChange = (newSettings: Partial<ReaderSettings>) => {
    const next = { ...settings, ...newSettings };
    setSettings(next);
    applyStyles(renditionRef.current, next);
  };

  const handlePrev = () => renditionRef.current?.prev();
  const handleNext = () => renditionRef.current?.next();
  const handleTocSelect = (href: string) => {
    renditionRef.current?.display(href);
    setIsTocOpen(false);
  };

  const bgClass = settings.theme === 'light' ? 'bg-[#FBF6EA] text-[#2A1C15]' : settings.theme === 'sepia' ? 'bg-[#EDE0C4] text-[#2A1C15]' : 'bg-[#221915] text-[#F0E8D8]';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${bgClass}`}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-brand-border/20 px-4 py-3 bg-black/10">
        <button onClick={onClose} className="flex items-center gap-1 text-sm font-semibold hover:text-brand-accent text-brand-text-primary">
          <ChevronLeft className="w-5 h-5" /> Close
        </button>
        <div className="text-center min-w-0">
          <h3 className="font-bold text-sm truncate max-w-[200px] sm:max-w-md text-brand-text-primary">{title}</h3>
          {author && <p className="text-xs text-brand-text-secondary">by {author}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsTocOpen(!isTocOpen)} className="p-2 rounded-full hover:bg-black/10 text-brand-text-secondary hover:text-brand-text-primary animate-hover" title="Table of Contents">
            <List className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-black/10 text-brand-text-secondary hover:text-brand-text-primary animate-hover" title="Display Settings">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main viewer area */}
      <div className="flex-1 relative flex items-center justify-center">
        {error && <p className="text-center text-sm text-brand-text-secondary">{error}</p>}
        {!loaded && !error && <p className="text-center text-sm text-brand-text-secondary animate-pulse">Loading reader engine...</p>}
        <div ref={viewerRef} className="w-full h-full max-w-2xl px-6" />

        {/* Paging overlays for desktop click areas */}
        <button onClick={handlePrev} className="absolute left-0 top-1/2 -translate-y-1/2 h-full w-12 flex items-center justify-center bg-black/0 hover:bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={handleNext} className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-12 flex items-center justify-center bg-black/0 hover:bg-black/5 opacity-0 hover:opacity-100 transition-opacity">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Footer / progress bar */}
      <footer className="px-4 py-2 border-t border-brand-border/20 text-center text-xs opacity-75 bg-black/10 flex justify-between items-center text-brand-text-secondary">
        <span>Progress: {progress}%</span>
        <div className="flex gap-4">
          <button onClick={handlePrev} className="px-3 py-1 bg-black/20 rounded hover:bg-black/40 text-brand-text-primary">Prev</button>
          <button onClick={handleNext} className="px-3 py-1 bg-black/20 rounded hover:bg-black/40 text-brand-text-primary">Next</button>
        </div>
      </footer>

      {/* Table of Contents Drawer */}
      {isTocOpen && (
        <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] z-50 bg-brand-dark/95 backdrop-blur border-l border-brand-border p-6 shadow-2xl overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-brand-text-primary">Table of Contents</h3>
            <button onClick={() => setIsTocOpen(false)} className="p-1 hover:text-brand-accent text-brand-text-secondary">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-3 text-sm">
            {toc.map((item, i) => (
              <li key={i}>
                <button onClick={() => handleTocSelect(item.href)} className="text-left w-full py-2 border-b border-brand-border/30 text-brand-text-secondary hover:text-brand-accent truncate block">
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <ReaderSettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Selection floating bar */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-brand-dark border border-brand-border rounded-full px-5 py-2.5 shadow-xl"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => setShareCardOpen(true)}
              className="text-xs text-brand-accent font-bold uppercase tracking-wider hover:opacity-85 transition-opacity"
            >
              ✦ Share Quote Card
            </button>
            <span className="text-brand-border select-none">|</span>
            <button
              onClick={() => setSelectedText(null)}
              className="text-xs text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareCardModal
        isOpen={shareCardOpen}
        onClose={() => { setShareCardOpen(false); setSelectedText(null); }}
        title={title || "Book Quote"}
        text={selectedText ?? ''}
        author={author || "CCN Daily Books"}
        type="scripture"
      />
    </div>
  );
};

export default EpubReader;