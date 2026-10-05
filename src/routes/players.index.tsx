import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { playersQuery } from "@/lib/queries";
import { Reveal } from "@/components/site/Reveal";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import teamAsset from "@/assets/buruj-team.jpeg.asset.json";
const teamPhoto = teamAsset.url;

export const Route = createFileRoute("/players/")({
  head: () => ({
    meta: [
      { title: "Squad & Player Profiles — Buruj Sports Academy" },
      { name: "description", content: "Meet the Buruj Sports Academy squad: goalkeepers, defenders, midfielders and forwards developing in Ikorodu, Lagos." },
      { property: "og:title", content: "The Buruj Squad" },
      { property: "og:description", content: "Browse player profiles by position and programme." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(playersQuery),
  errorComponent: () => <p className="p-16 text-center text-muted-foreground">Could not load the squad. Please refresh.</p>,
  notFoundComponent: () => <p className="p-16 text-center">Not found.</p>,
  component: Players,
});

const POSITIONS = [
  { k: "ALL", l: "All players" },
  { k: "GK", l: "Goalkeepers" },
  { k: "DEF", l: "Defenders" },
  { k: "MID", l: "Midfielders" },
  { k: "FWD", l: "Forwards" },
] as const;
const PROGRAMMES = ["All", "Football & Education", "Football Development", "Football Camping"] as const;
const POS_LABEL: Record<string, string> = { GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward" };

function age(dob: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}
function Players() {
  const { data } = useSuspenseQuery(playersQuery);
  const [pos, setPos] = useState<string>("ALL");
  const [prog, setProg] = useState<string>("All");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter((p) =>
      (pos === "ALL" || p.position === pos) &&
      (prog === "All" || p.programme === prog) &&
      (!s || p.full_name.toLowerCase().includes(s) || String(p.jersey_number ?? "") === s),
    );
  }, [data, pos, prog, q]);

  return (
    <>
      <section className="relative min-h-[430px] overflow-hidden bg-navy text-navy-foreground">
        <img src={teamPhoto} alt="Buruj Sports Academy players and coaching team" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto flex min-h-[430px] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6">
          <p className="animate-rise font-display uppercase tracking-[0.3em] text-gold">The squad</p>
          <h1 className="animate-rise mt-3 max-w-3xl text-6xl font-extrabold uppercase leading-[0.9] sm:text-7xl">Meet our players</h1>
          <p className="animate-rise mt-5 max-w-xl text-lg text-navy-foreground/80">Academy talent developed through certified coaching, match exposure and international trial pathways.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((p) => (
              <button key={p.k} onClick={() => setPos(p.k)} className={cn("rounded-full px-4 py-2 font-display font-bold uppercase tracking-wide transition-colors", pos === p.k ? "bg-navy text-navy-foreground" : "bg-secondary text-navy hover:text-primary")}>
                {p.l}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={prog} onChange={(e) => setProg(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="Programme">
              {PROGRAMMES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or shirt number" className="pl-9 sm:w-64" />
            </div>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground">No players match these filters.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => (
              <Reveal key={p.slug} delay={(i % 3) * 80}>
                <Link to="/players/$slug" params={{ slug: p.slug }} className="block"><article className="glow-hover group overflow-hidden rounded-xl border bg-card">
                    <div className="relative flex h-72 items-end justify-between bg-navy p-5 text-navy-foreground">
                    {p.avatar_url ? (
                       <img src={p.avatar_url} alt={`${p.full_name}, Buruj Sports Academy player`} className="absolute inset-0 h-full w-full object-cover object-top" loading="lazy" />
                    ) : (
                       <div className="absolute inset-0 grid place-items-center bg-secondary px-8 text-center text-navy"><p className="font-display text-xl font-bold uppercase">Player photo awaiting upload</p></div>
                    )}
                     <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy to-transparent" />
                    <span className="relative font-display text-6xl font-extrabold text-gold">{p.jersey_number ?? "–"}</span>
                    <span className="relative rounded-full bg-gold px-3 py-1 font-display text-sm font-bold uppercase text-gold-foreground">{p.position}</span>
                  </div>
                  <div className="p-5">
                    <h2 className="text-2xl font-extrabold uppercase text-navy">{p.full_name}</h2>
                    <p className="text-sm text-muted-foreground">{POS_LABEL[p.position] ?? p.position}{p.secondary_position ? ` · also ${p.secondary_position}` : ""}</p>
                    <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                      <div><dt className="text-xs uppercase text-muted-foreground">Age</dt><dd className="font-display text-xl font-bold text-navy">{p.age ?? "–"}</dd></div>
                      <div><dt className="text-xs uppercase text-muted-foreground">Foot</dt><dd className="font-display text-xl font-bold text-navy">{p.preferred_foot ?? "–"}</dd></div>
                      <div><dt className="text-xs uppercase text-muted-foreground">Prog.</dt><dd className="font-display text-sm font-bold leading-7 text-navy">{p.programme === "Play & Study" ? "P&S" : p.programme ? "Camp" : "–"}</dd></div>
                    </dl>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">View full profile →</p>
                  </div>
                </article></Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
