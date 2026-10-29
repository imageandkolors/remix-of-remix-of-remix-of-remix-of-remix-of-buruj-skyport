import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { GalleryMedia } from "@/lib/content.functions";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type LightboxItem = Pick<
  GalleryMedia,
  "id" | "title" | "caption" | "kind" | "media_url" | "external_url"
> & { media_url: string | null; thumbnail_url?: string | null };

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
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
}) {
  useEffect(() => {
    if (!item) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onPrevious?.();
      if (event.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [item, onPrevious, onNext]);
  const embed = item?.kind === "youtube" ? youtubeEmbed(item.external_url || item.media_url) : null;
  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[95vh] max-w-6xl border-0 bg-black/95 p-4 text-white sm:rounded-xl">
        <DialogTitle className="sr-only">{item?.title ?? "Media viewer"}</DialogTitle>
        <DialogDescription className="sr-only">
          Use the previous and next controls to browse media. Escape closes this viewer.
        </DialogDescription>
        {item && (
          <>
            {onPrevious && (
              <button
                className="absolute left-3 top-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={onPrevious}
                aria-label="Previous media"
              >
                <ChevronLeft />
              </button>
            )}
            {onNext && (
              <button
                className="absolute right-3 top-1/2 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={onNext}
                aria-label="Next media"
              >
                <ChevronRight />
              </button>
            )}
            <div className="max-h-[85vh] max-w-full overflow-auto pr-8">
              {item.kind === "image" && item.media_url && (
                <img
                  src={item.media_url}
                  alt={item.title}
                  className="mx-auto max-h-[75vh] max-w-full rounded-lg object-contain"
                />
              )}
              {item.kind === "video" && item.media_url && (
                <video
                  src={item.media_url}
                  controls
                  autoPlay
                  className="mx-auto max-h-[75vh] max-w-full rounded-lg"
                />
              )}
              {item.kind === "youtube" && embed && (
                <iframe
                  src={embed}
                  title={item.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-[min(85vw,1000px)] rounded-lg"
                />
              )}
              <div className="mt-4 text-center">
                <h2 className="font-display text-xl font-bold uppercase">{item.title}</h2>
                {item.caption && <p className="mt-1 text-sm text-white/70">{item.caption}</p>}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
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
        <div className="relative h-full w-full bg-navy">
          {item.thumbnail_url && (
            <img
              src={item.thumbnail_url}
              alt=""
              className="h-full w-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 grid place-items-center">
            <Play className="h-14 w-14 rounded-full bg-gold p-4 text-gold-foreground" />
          </div>
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
