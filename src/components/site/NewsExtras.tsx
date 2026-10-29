import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Facebook, Link2, Linkedin, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const SITE_URL =
  (import.meta.env["VITE_SITE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export function readingMinutes(body: string | null) {
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8.1-9.3L1 2h6.9l4.8 6.3L18.9 2Zm-1.2 18h1.9L6.4 3.9H4.4L17.7 20Z" />
    </svg>
  );
}

export function ShareBar({
  url,
  title,
  excerpt,
  className,
  vertical,
}: {
  url: string;
  title: string;
  excerpt?: string | null;
  className?: string;
  vertical?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const shareText = [title, excerpt, url].filter(Boolean).join("\n\n");
  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      icon: MessageCircle,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${t}&url=${u}&hashtags=BurujSportsAcademy`,
      icon: XIcon,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      icon: Facebook,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      icon: Linkedin,
    },
  ];
  async function copy() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("Story title, excerpt and link copied");
    setTimeout(() => setCopied(false), 2000);
  }
  async function native() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: excerpt || title, url });
      } catch {
        /* cancelled */
      }
    } else copy();
  }
  const btn =
    "grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-card text-navy transition-colors hover:bg-navy hover:text-navy-foreground";
  return (
    <div className={cn("flex items-center gap-2", vertical && "flex-col", className)}>
      {!vertical && (
        <span className="mr-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Share
        </span>
      )}
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${l.label}`}
          className={btn}
        >
          <l.icon className="h-4 w-4" />
        </a>
      ))}
      <button onClick={copy} aria-label="Copy link" className={btn}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
      <button onClick={native} aria-label="More sharing options" className={cn(btn, "md:hidden")}>
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}

const ADS_CLIENT = import.meta.env["VITE_ADSENSE_CLIENT"] as string | undefined;
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Google AdSense slot. Shows an academy promo until an AdSense publisher ID is configured. */
export function AdSlot({
  format = "leaderboard",
  slot,
  className,
}: {
  format?: "leaderboard" | "rectangle" | "inline";
  slot?: string | undefined;
  className?: string;
}) {
  const ref = useRef<HTMLModElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ADS_CLIENT || !slot) return;
    if (!document.querySelector("script[data-adsense]")) {
      const s = document.createElement("script");
      s.async = true;
      s.setAttribute("data-adsense", "1");
      s.crossOrigin = "anonymous";
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`;
      document.head.appendChild(s);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setReady(true);
    } catch {
      /* blocked */
    }
  }, [slot]);
  const size =
    format === "leaderboard"
      ? "min-h-[90px]"
      : format === "rectangle"
        ? "min-h-[250px]"
        : "min-h-[120px]";
  return (
    <div className={cn("w-full", className)}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        Advertisement
      </p>
      {ADS_CLIENT && slot ? (
        <ins
          ref={ref}
          className={cn("adsbygoogle block", size, !ready && "bg-muted")}
          data-ad-client={ADS_CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <Link
          to="/admissions"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded border border-dashed bg-secondary px-4 py-4 text-center",
            size,
          )}
        >
          <span className="font-display text-lg font-extrabold uppercase text-navy">
            Trials & admissions open
          </span>
          <span className="text-sm text-muted-foreground">
            Join Buruj Sports Academy — apply today
          </span>
        </Link>
      )}
    </div>
  );
}
