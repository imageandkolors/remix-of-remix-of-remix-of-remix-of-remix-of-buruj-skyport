import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import crestSrc from "@/assets/buruj-crest.jpeg";
const crest = { url: crestSrc };

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "bsa-install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone || localStorage.getItem(KEY) || window.self !== window.top) return;
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setTimeout(() => setOpen(true), 4000); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIos) { setIos(true); t = setTimeout(() => setOpen(true), 4000); }
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); if (t) clearTimeout(t); };
  }, []);

  const close = () => { localStorage.setItem(KEY, "1"); setOpen(false); };
  const install = async () => { if (!evt) return; await evt.prompt(); await evt.userChoice; close(); };

  if (!open || (!evt && !ios)) return null;
  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl md:bottom-6">
      <button onClick={close} aria-label="Close" className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
      <div className="flex items-center gap-3">
        <img src={crest.url} alt="" className="h-12 w-12 rounded-xl object-contain" />
        <div>
          <p className="font-display text-lg font-bold uppercase">Install the Buruj app</p>
          <p className="text-sm text-muted-foreground">Quick access from your home screen.</p>
        </div>
      </div>
      {ios ? (
        <p className="mt-3 flex items-center gap-1 text-sm">Tap <Share className="h-4 w-4 text-sky" /> Share, then <b>Add to Home Screen</b>.</p>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={install}><Download className="mr-1 h-4 w-4" />Install</Button>
          <Button variant="outline" onClick={close}>Not now</Button>
        </div>
      )}
    </div>
  );
}
