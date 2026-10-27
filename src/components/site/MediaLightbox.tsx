import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { GalleryMedia } from "@/lib/content.functions";

export type LightboxItem = Pick<
  GalleryMedia,
  "id" | "title" | "caption" | "kind" | "media_url" | "external_url"
> & { media_url: string | null };

function youtubeEmbed(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const id = parsed.hostname.includes("youtu.be")
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : null;
  } catch {
    return null;
  }
}

export function MediaLightbox({
  item,
  onClose,
  onPrevious,
  onNext,
}: {
  item: LightboxItem | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrevious?.();
      if (event.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [item, onClose, onPrevious, onNext]);
  if (!item) return null;
  const embed = item.kind === "youtube" ? youtubeEmbed(item.external_url || item.media_url) : null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
    >
      <button
        className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close media viewer"
      >
        <X />
      </button>
      {onPrevious && (
        <button
          className="absolute left-3 top-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          aria-label="Previous media"
        >
          <ChevronLeft />
        </button>
      )}
      {onNext && (
        <button
          className="absolute right-3 top-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next media"
        >
          <ChevronRight />
        </button>
      )}
      <div className="max-h-[90vh] max-w-6xl" onClick={(e) => e.stopPropagation()}>
        {item.kind === "image" && item.media_url && (
          <img
            src={item.media_url}
            alt={item.title}
            className="max-h-[78vh] max-w-full rounded-lg object-contain"
          />
        )}
        {item.kind === "video" && item.media_url && (
          <video
            src={item.media_url}
            controls
            autoPlay
            className="max-h-[78vh] max-w-full rounded-lg"
          />
        )}
        {item.kind === "youtube" && embed && (
          <iframe
            src={embed}
            title={item.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="aspect-video w-[min(90vw,1000px)] rounded-lg"
          />
        )}
        <div className="mt-4 text-center text-white">
          <h2 className="font-display text-xl font-bold uppercase">{item.title}</h2>
          {item.caption && <p className="mt-1 text-sm text-white/70">{item.caption}</p>}
        </div>
      </div>
    </div>
  );
}

export function MediaThumb({ item, onClick }: { item: LightboxItem; onClick: () => void }) {
  const embed = item.kind === "youtube" ? youtubeEmbed(item.external_url || item.media_url) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block h-full w-full overflow-hidden rounded-xl text-left"
      aria-label={`Open ${item.title}`}
    >
      {item.kind === "image" && item.media_url && (
        <img
          src={item.media_url}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      {item.kind === "video" && item.media_url && (
        <video
          src={item.media_url}
          muted
          preload="metadata"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      {item.kind === "youtube" && embed && (
        <div className="flex h-full w-full items-center justify-center bg-navy">
          <Play className="h-14 w-14 rounded-full bg-gold p-4 text-gold-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/10 to-transparent" />
      <div className="absolute bottom-0 p-5 text-white">
        <p className="font-display text-lg font-bold uppercase">{item.title}</p>
        {item.caption && <p className="mt-1 line-clamp-2 text-sm text-white/80">{item.caption}</p>}
      </div>
    </button>
  );
}
