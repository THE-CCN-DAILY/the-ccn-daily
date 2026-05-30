import React, { useCallback, useId, useRef, useState } from 'react';

// ─── Media kinds → accepted formats, limits, and helper copy ──────────────────

export type MediaKind = 'image' | 'document' | 'audio' | 'video';

interface KindConfig {
  accept: string;
  hint: string;
  maxBytes: number;
  maxLabel: string;
}

const KIND: Record<MediaKind, KindConfig> = {
  image: {
    accept: 'image/jpeg,image/png,image/webp',
    hint: 'JPG, PNG, or WEBP',
    maxBytes: 5 * 1024 * 1024,
    maxLabel: '5 MB',
  },
  document: {
    accept: '.epub,.pdf,application/epub+zip,application/pdf',
    hint: 'EPUB or PDF',
    maxBytes: 50 * 1024 * 1024,
    maxLabel: '50 MB',
  },
  audio: {
    accept: 'audio/mpeg,audio/mp4,audio/x-m4a,.mp3,.m4a',
    hint: 'MP3 or M4A',
    maxBytes: 100 * 1024 * 1024,
    maxLabel: '100 MB',
  },
  video: {
    accept: 'video/mp4,.mp4',
    hint: 'MP4',
    maxBytes: 500 * 1024 * 1024,
    maxLabel: '500 MB',
  },
};

const fileName = (url: string): string => {
  try {
    const clean = url.split('?')[0];
    return decodeURIComponent(clean.slice(clean.lastIndexOf('/') + 1)) || url;
  } catch {
    return url;
  }
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MediaUploadProps {
  label: string;
  kind: MediaKind;
  /** Current stored URL (uploaded or pasted). */
  value?: string;
  onChange: (url: string) => void;
  /** Uploads the file and resolves with the stored URL. Caller wires the backend. */
  upload: (file: File, onProgress?: (pct: number) => void) => Promise<string>;
  /** Show the "or paste a URL" fallback for externally-hosted assets. Default true. */
  allowUrl?: boolean;
  /** Optional alt text (images only) — accessibility + SEO. */
  alt?: string;
  onAltChange?: (alt: string) => void;
  required?: boolean;
}

/**
 * Premium, reusable media uploader. Drag/drop · click · paste, with preview,
 * progress, client-side format/size validation, an optional URL fallback, and
 * alt text for images. Styled on the brand tonal tokens (no pure black/white).
 */
const MediaUpload: React.FC<MediaUploadProps> = ({
  label,
  kind,
  value,
  onChange,
  upload,
  allowUrl = true,
  alt,
  onAltChange,
  required = false,
}) => {
  const cfg = KIND[kind];
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [showUrl, setShowUrl] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError('');
      const okType =
        cfg.accept.split(',').some((a) => {
          const t = a.trim();
          if (t.startsWith('.')) return file.name.toLowerCase().endsWith(t);
          if (t.endsWith('/*')) return file.type.startsWith(t.slice(0, -1));
          return file.type === t;
        });
      if (!okType) {
        setError(`Unsupported file. Use ${cfg.hint}.`);
        return;
      }
      if (file.size > cfg.maxBytes) {
        setError(`File is too large. Max ${cfg.maxLabel}.`);
        return;
      }
      try {
        setProgress(0);
        const url = await upload(file, (pct) => setProgress(Math.round(pct)));
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      } finally {
        setProgress(null);
      }
    },
    [cfg, onChange, upload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const file = e.clipboardData.files?.[0];
      if (file) {
        e.preventDefault();
        void handleFile(file);
      }
    },
    [handleFile],
  );

  const uploading = progress !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
          {label} {required && <span className="text-brand-accent">*</span>}
        </label>
        {allowUrl && (
          <button
            type="button"
            onClick={() => setShowUrl((s) => !s)}
            className="text-xs font-medium text-brand-accent hover:underline"
          >
            {showUrl ? 'Upload a file instead' : 'Or paste a URL'}
          </button>
        )}
      </div>

      {/* Existing value preview */}
      {value && !uploading && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-secondary/50 p-3">
          {kind === 'image' ? (
            <img src={value} alt={alt || ''} className="h-16 w-16 flex-shrink-0 rounded-md object-cover" />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-brand-dark text-xs font-semibold uppercase text-brand-accent">
              {kind === 'audio' ? 'Audio' : kind === 'video' ? 'Video' : 'File'}
            </div>
          )}
          <div className="min-w-0 flex-grow">
            <p className="truncate text-sm text-brand-text-primary">{fileName(value)}</p>
            {kind === 'audio' && <audio controls src={value} className="mt-1 h-8 w-full" />}
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="flex-shrink-0 text-xs font-medium text-brand-text-secondary hover:text-red-400"
          >
            Remove
          </button>
        </div>
      )}

      {/* URL fallback */}
      {showUrl ? (
        <input
          type="url"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-brand-text-primary outline-none transition-colors placeholder:text-brand-text-secondary/50 focus:border-brand-accent"
        />
      ) : (
        !value && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            onPaste={onPaste}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
              dragging ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border bg-brand-secondary/30 hover:border-brand-accent/50'
            }`}
          >
            {uploading ? (
              <div className="w-full max-w-xs">
                <div className="mb-2 text-sm text-brand-text-secondary">Uploading… {progress}%</div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-border">
                  <div className="h-full rounded-full bg-brand-accent transition-all" style={{ width: `${progress ?? 0}%` }} />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-brand-text-primary">
                  Drag &amp; drop, paste, or <span className="text-brand-accent">browse</span>
                </p>
                <p className="mt-1 text-xs text-brand-text-secondary">{cfg.hint} · up to {cfg.maxLabel}</p>
              </>
            )}
          </div>
        )
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={cfg.accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />

      {/* Alt text for images (accessibility + SEO) */}
      {kind === 'image' && value && onAltChange && (
        <input
          type="text"
          value={alt ?? ''}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Describe this image (alt text — for accessibility & SEO)"
          className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-xs text-brand-text-primary outline-none placeholder:text-brand-text-secondary/50 focus:border-brand-accent"
        />
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default MediaUpload;
