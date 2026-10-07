import { useEffect, useState } from "react";
import crest from "@/assets/buruj-crest.jpeg.asset.json";

/** Branded launch screen, shown once per browser session. */
export function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "show" | "fade">("hidden");

  useEffect(() => {
    if (sessionStorage.getItem("bsa-splash")) return;
    sessionStorage.setItem("bsa-splash", "1");
    setPhase("show");
    const t1 = setTimeout(() => setPhase("fade"), 1400);
    const t2 = setTimeout(() => setPhase("hidden"), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "hidden") return null;
  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-navy text-navy-foreground transition-opacity duration-500 ${phase === "fade" ? "opacity-0" : "opacity-100"}`}
    >
      <div className="relative">
        <div className="absolute inset-0 -m-6 animate-ping rounded-full bg-gold/20" />
        <img src={crest.url} alt="" className="relative h-32 w-32 rounded-3xl object-contain shadow-2xl" />
      </div>
      <p className="mt-8 font-display text-2xl font-bold uppercase tracking-widest">Buruj Sports Academy</p>
      <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gold">Make your dreams come true</p>
    </div>
  );
}
