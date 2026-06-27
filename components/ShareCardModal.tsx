import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Copy, Share2, MessageSquare, Send, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sendCommunityMessage } from '../services/communityService';
import { toast } from 'sonner';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;       // e.g. "Daily Sanctuary Complete" or "Scripture Study"
  text: string;        // The quote or completion message
  author?: string;     // e.g. "John 3:16" or "Eryeza Kalalu"
  type: 'scripture' | 'devotional' | 'completion';
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  title,
  text,
  author,
  type,
}) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posted, setPosted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const wrapText = (ctx: CanvasRenderingContext2D, textStr: string, maxWidth: number): string[] => {
    const words = textStr.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  };

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset styles
    ctx.letterSpacing = '0px';

    // 1. Draw rich ambient gradient background
    const grad = ctx.createRadialGradient(600, 600, 100, 600, 600, 800);
    grad.addColorStop(0, '#2d1a16'); // Warm burgundy-charcoal center
    grad.addColorStop(1, '#0e0b09'); // Dark charcoal edges
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1200);

    // 2. Draw dual fine gold/amber borders
    ctx.strokeStyle = '#D4A840';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1120, 1120);

    ctx.strokeStyle = 'rgba(212, 168, 64, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(56, 56, 1088, 1088);

    // 3. Draw Watermark brand flame logo at center
    const img = new Image();
    img.src = '/flame-transparent.png';
    img.onload = () => {
      ctx.save();
      ctx.globalAlpha = 0.055; // Subtle watermark opacity
      ctx.drawImage(img, 600 - 250, 600 - 250, 500, 500);
      ctx.restore();
      renderContentText(ctx);
    };
    img.onerror = () => {
      renderContentText(ctx);
    };
  };

  const renderContentText = (ctx: CanvasRenderingContext2D) => {
    // 4. Draw card title
    ctx.fillStyle = '#E8645A'; // Brand Crimson
    ctx.font = 'bold 24px "Inter Tight", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.letterSpacing = '6px';
    ctx.fillText(title.toUpperCase(), 600, 130);

    // Reset letter spacing for text wrapping
    ctx.letterSpacing = '0px';

    // 5. Draw opening quote mark
    ctx.fillStyle = 'rgba(212, 168, 64, 0.16)';
    ctx.font = 'italic 180px "EB Garamond", Garamond, Georgia, serif';
    ctx.fillText('“', 600, 270);

    // 6. Wrap and draw central quote body
    ctx.fillStyle = '#F0E8D8'; // Warm ivory text
    ctx.font = 'italic 46px "EB Garamond", Garamond, Georgia, serif';
    ctx.textBaseline = 'middle';

    const maxWidth = 840;
    const lineHeight = 68;
    const lines = wrapText(ctx, text, maxWidth);
    
    const totalHeight = lines.length * lineHeight;
    const startY = 600 - (totalHeight / 2) + 20;

    lines.forEach((line, index) => {
      ctx.fillText(line, 600, startY + (index * lineHeight));
    });

    // 7. Draw closing quote mark
    ctx.fillStyle = 'rgba(212, 168, 64, 0.16)';
    ctx.font = 'italic 180px "EB Garamond", Garamond, Georgia, serif';
    ctx.fillText('”', 600, startY + totalHeight + 50);

    // 8. Draw author/reference label
    if (author) {
      ctx.fillStyle = '#D4A840'; // Gold accent
      ctx.font = 'bold 22px "Inter Tight", -apple-system, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText(`— ${author.toUpperCase()} —`, 600, 980);
    }

    // 9. Draw Brand Stamp at bottom
    ctx.fillStyle = 'rgba(240, 232, 216, 0.28)';
    ctx.font = '500 18px "Inter Tight", -apple-system, sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('THECCNDAILY.COM', 600, 1070);

    // Save image URL state for web rendering in DOM
    const canvas = canvasRef.current;
    if (canvas) {
      setImageUrl(canvas.toDataURL('image/png'));
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setPosted(false);
      // Give a tiny timeout for canvas element to mount
      setTimeout(drawCard, 50);
    }
  }, [isOpen, text, title, author]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${type}-share-card-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Share card downloaded successfully.');
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        toast.success('Quote card copied to clipboard. Paste directly into WhatsApp or Telegram!');
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      toast.error('Failed to copy card image to clipboard.');
    }
  };

  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSharing(true);
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'share-card.png', { type: 'image/png' });
        const shareData = {
          files: [file],
          title: title,
          text: `"${text}" — ${author || 'CCN Daily'}`,
          url: 'https://theccndaily.com'
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.success('Shared successfully.');
        } else {
          // Fallback to web links
          const shareText = encodeURIComponent(`"${text}" — ${author || 'CCN Daily'}\n\nRead more at theccndaily.com`);
          window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
        }
      });
    } catch {
      // Fallback
      const shareText = encodeURIComponent(`"${text}" — ${author || 'CCN Daily'}\n\nRead more at theccndaily.com`);
      window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
    } finally {
      setSharing(false);
    }
  };

  const handlePostInCommunity = async () => {
    if (!user) {
      toast.error('You must be signed in to post in the community.');
      return;
    }
    setSharing(true);
    try {
      const shareMsg = `Shared from my Daily Sanctuary:\n\n"${text}" — ${author || 'CCN Daily'}\n\ntheccndaily.com`;
      await sendCommunityMessage({
        text: shareMsg,
        user: user.displayName || 'A member of the community',
        userId: user.uid,
      });
      setPosted(true);
      toast.success('Successfully posted card to the Sanctuary Community feed!');
      setTimeout(() => setPosted(false), 3000);
    } catch (err) {
      toast.error('Failed to post in the community.');
    } finally {
      setSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/85 backdrop-blur-md">
        <motion.div
          className="bg-brand-secondary border border-brand-border rounded-2xl p-6 w-full max-w-5xl shadow-2xl relative grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-accent p-1 rounded-full hover:bg-brand-primary transition-all z-10"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left: Interactive/Visual Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[300px]">
            {/* Real Canvas rendered hidden/off-screen to support exact high-res export */}
            <canvas
              ref={canvasRef}
              width={1200}
              height={1200}
              className="hidden"
            />
            {/* Display Element scaling the high-res card into CSS layout */}
            {imageUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[400px] aspect-square rounded-xl overflow-hidden shadow-2xl border border-brand-border/40 select-none bg-brand-dark"
              >
                <img
                  src={imageUrl}
                  alt="CCN Share Card Preview"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ) : (
              <div className="w-full max-w-[400px] aspect-square rounded-xl bg-brand-dark animate-pulse flex items-center justify-center text-brand-text-secondary">
                Generating card...
              </div>
            )}
          </div>

          {/* Right: Actions and Sharing Details */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <h2
                style={{ fontFamily: 'var(--serif-display, Cormorant Garamond, Georgia, serif)' }}
                className="text-2xl font-bold text-brand-text-primary mb-2 mt-4"
              >
                Share Your Encounter
              </h2>
              <p className="text-sm text-brand-text-secondary mb-6 leading-relaxed">
                Generate an elegant, on-brand quote image of your reading or completion to encourage others.
              </p>

              {/* Text Preview Box */}
              <div className="rounded-xl border border-brand-border bg-brand-dark/40 p-4 mb-8 max-h-40 overflow-y-auto custom-scrollbar">
                <p className="text-xs font-semibold text-brand-accent uppercase tracking-wider mb-2">Quote Content</p>
                <p className="text-xs text-brand-text-primary italic leading-relaxed">
                  &ldquo;{text}&rdquo;
                </p>
                {author && (
                  <p className="text-[10px] font-bold text-brand-text-secondary mt-2 text-right tracking-wider">
                    — {author.toUpperCase()}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="space-y-3">
              <button
                onClick={handleNativeShare}
                disabled={sharing}
                className="w-full flex items-center justify-center gap-2 bg-brand-accent text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share to Apps (WhatsApp/Telegram)
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 border border-brand-border bg-brand-dark text-brand-text-primary py-3 rounded-xl font-bold text-sm hover:bg-brand-primary active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-brand-text-secondary" />}
                  {copied ? 'Copied!' : 'Copy Image'}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 border border-brand-border bg-brand-dark text-brand-text-primary py-3 rounded-xl font-bold text-sm hover:bg-brand-primary active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4 text-brand-text-secondary" />
                  Save PNG
                </button>
              </div>

              <button
                onClick={handlePostInCommunity}
                disabled={sharing || posted}
                className="w-full flex items-center justify-center gap-2 border border-brand-accent/30 bg-brand-accent/5 hover:bg-brand-accent/10 text-brand-accent py-3 rounded-xl font-bold text-sm active:scale-95 disabled:opacity-60 transition-all"
              >
                {posted ? <Check className="w-4 h-4 text-green-500" /> : <MessageSquare className="w-4 h-4" />}
                {posted ? 'Posted successfully!' : 'Share in Sanctuary Community'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareCardModal;
