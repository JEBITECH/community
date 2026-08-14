import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

export function isVideoUrl(src: string) {
  return VIDEO_EXT.test(src);
}

interface ImageLightboxProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

const ImageLightbox = ({ open, onClose, images, initialIndex = 0 }: ImageLightboxProps) => {
  const [idx, setIdx] = useState(initialIndex);

  // Reset index whenever lightbox opens to the requested image
  useEffect(() => {
    if (open) setIdx(initialIndex);
  }, [open, initialIndex]);

  const total = images.length;
  const src = images[idx] ?? '';
  const isVideo = isVideoUrl(src);

  const prev = useCallback(() => setIdx(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx(i => (i + 1) % total), [total]);

  // Keyboard: Escape / arrow keys
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (total > 1) {
        if (e.key === 'ArrowLeft')  prev();
        if (e.key === 'ArrowRight') next();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, total, prev, next, onClose]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Prev arrow */}
      {total > 1 && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Next arrow */}
      {total > 1 && (
        <button
          type="button"
          aria-label="Next image"
          onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Media container */}
      <div
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4 text-slate-700" />
        </button>

        {isVideo ? (
          <video
            key={src}
            src={src}
            controls
            autoPlay
            className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <img
            key={src}
            src={src}
            alt={`Image ${idx + 1} of ${total}`}
            className="w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        )}
      </div>

      {/* Counter */}
      {total > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm tabular-nums pointer-events-none select-none">
          {idx + 1} / {total}
        </p>
      )}
    </div>
  );
};

export default ImageLightbox;
