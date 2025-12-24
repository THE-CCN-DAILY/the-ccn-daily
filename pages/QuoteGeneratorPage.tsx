
import React, { useState } from 'react';
import Card from '../components/Card';
import { AiIcon, SparklesIcon, SpinnerIcon, ShareIcon, DownloadIcon, CheckIcon } from '../components/icons';
import { generateQuoteImage } from '../services/geminiService';

const QuoteGeneratorPage: React.FC = () => {
  const [quoteText, setQuoteText] = useState("Commit your way to the LORD, trust also in Him, and He shall bring it to pass. - Psalm 37:5, NKJV");
  const [attribution, setAttribution] = useState("Psalm 37:5");
  const [style, setStyle] = useState('Spiritual');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle');

  const styles = ['Spiritual', 'Nature', 'Abstract', 'Modern', 'Vintage'];

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedImageUrl(null);
    try {
      const prompt = `A beautiful ${style} style background for a spiritual quote. Background only, no text. High quality, inspirational, ${style === 'Spiritual' ? 'ethereal lights and divine atmosphere' : style === 'Nature' ? 'serene mountain landscape at sunrise' : 'minimalist aesthetic'}.`;
      const imageUrl = await generateQuoteImage(prompt);
      setGeneratedImageUrl(imageUrl);
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("AI Image generation failed. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && generatedImageUrl) {
        try {
            await navigator.share({
                title: 'Daily Inspiration',
                text: quoteText,
                url: window.location.href
            });
            setShareStatus('shared');
            setTimeout(() => setShareStatus('idle'), 2000);
        } catch (e) { console.error(e); }
    } else {
        alert("Sharing not supported on this device. You can download the image.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Generative Quote Suite</h1>
      <p className="text-lg text-brand-text-secondary mb-8">
        Phase 2.3: Transform any scripture or reflection into a stunning shareable social graphic powered by Gemini AI.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold text-brand-text-primary mb-4 flex items-center">
                <AiIcon className="w-6 h-6 mr-2 text-brand-accent"/>
                Compose Your Quote
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-semibold text-brand-text-secondary block mb-1">Quote Text</label>
                    <textarea 
                        value={quoteText}
                        onChange={(e) => setQuoteText(e.target.value)}
                        className="w-full h-32 p-3 bg-brand-secondary border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
                        placeholder="Paste text from the reader or your journal..."
                    />
                </div>
                <div>
                    <label className="text-sm font-semibold text-brand-text-secondary block mb-1">Visual Style</label>
                    <div className="flex flex-wrap gap-2">
                        {styles.map(s => (
                            <button 
                                key={s} 
                                onClick={() => setStyle(s)}
                                className={`px-4 py-2 text-sm rounded-full transition-all ${style === s ? 'bg-brand-accent text-white shadow-md' : 'bg-brand-secondary text-brand-text-secondary hover:bg-brand-border'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <button 
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg bg-brand-accent text-white font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50"
                >
                    {isLoading ? <SpinnerIcon className="w-5 h-5"/> : <><SparklesIcon className="w-5 h-5"/> Generate Visual</>}
                </button>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="flex flex-col">
            <Card className="flex-1 flex flex-col items-center justify-center relative min-h-[400px] overflow-hidden group">
                {!generatedImageUrl && !isLoading && (
                    <div className="text-center p-8">
                        <SparklesIcon className="w-16 h-16 text-brand-text-secondary/20 mx-auto mb-4"/>
                        <p className="text-brand-text-secondary italic">Enter your text and click generate to see the AI creation.</p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center">
                        <SpinnerIcon className="w-12 h-12 text-brand-accent mx-auto mb-4"/>
                        <p className="text-brand-text-secondary animate-pulse">Gemini is painting your inspiration...</p>
                    </div>
                )}

                {generatedImageUrl && (
                    <div className="w-full h-full relative animate-fade-in-up">
                        <img src={generatedImageUrl} className="w-full h-full object-cover rounded-lg" alt="AI Generated Background" />
                        <div className="absolute inset-0 bg-black/40 rounded-lg flex flex-col items-center justify-center p-12 text-center">
                            <p className="text-2xl md:text-3xl font-serif text-white font-bold leading-relaxed shadow-sm drop-shadow-md">
                                "{quoteText}"
                            </p>
                            <p className="mt-4 text-brand-gold font-bold tracking-widest uppercase text-sm border-t border-brand-gold/50 pt-2">
                                THE CCN DAILY
                            </p>
                        </div>
                        
                        {/* Overlay Controls */}
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={handleShare} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                                {shareStatus === 'shared' ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ShareIcon className="w-5 h-5" />}
                            </button>
                            <a href={generatedImageUrl} download="CCN-Quote.png" className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20">
                                <DownloadIcon className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                )}
            </Card>
            <p className="text-xs text-brand-text-secondary text-center mt-4 italic">
                Note: This uses the gemini-2.5-flash-image model to create context-aware backgrounds for your selected scripture or notes.
            </p>
        </div>
      </div>
    </div>
  );
};

export default QuoteGeneratorPage;
