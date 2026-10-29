import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, BadgeCheck, FileText, MessageCircle, PlayCircle } from "lucide-react";
import { RequestCvDialog } from "@/components/site/RequestCvDialog";
import { playerQuery } from "@/lib/queries";
import { useSiteSettings, waLinkFor } from "@/lib/use-site-settings";
import { Reveal, SectionHeading } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/players/$slug")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(playerQuery(params.slug));
    if (!d) throw notFound();
    return { name: d.player.full_name, position: d.player.position };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [
          { title: "Player not found — Buruj Sports Academy" },
          { name: "robots", content: "noindex" },
        ],
      };
    const t = `${loaderData.name} — Player Profile | Buruj Sports Academy`;
    const d = `Scouting profile of ${loaderData.name}: ratings, season statistics, development timeline and video CV.`;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: () => (
    <p className="p-16 text-center text-muted-foreground">
      Could not load this profile. Please refresh.
    </p>
  ),
  notFoundComponent: PlayerNotFound,
  component: PlayerProfile,
});

function PlayerNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl font-extrabold uppercase text-navy">Player not found</h1>
      <p className="mt-2 text-muted-foreground">This profile doesn't exist or isn't public yet.</p>
      <Button asChild className="mt-6">
        <Link to="/players">Back to squad</Link>
      </Button>
    </div>
  );
}

const POS_LABEL: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};
const PHASES = [
  { k: "before", l: "Before", s: "Induction & baseline" },
  { k: "now", l: "Now", s: "Current form" },
  { k: "future", l: "Future", s: "Pathway & targets" },
] as const;

function age(dob: string | null) {
  if (!dob) return null;
  const d = new Date(dob),
    n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}
function embed(url: string | null) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}
const isDirectVideo = (url: string | null) =>
  Boolean(url && (/\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("player-profile-media")));
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "";

function Hexagon({ attrs }: { attrs: { l: string; v: number }[] }) {
  const c = 120,
    r = 90;
  const pt = (i: number, f: number) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${c + Math.cos(a) * r * f},${c + Math.sin(a) * r * f}`;
  };
  return (
    <svg viewBox="0 0 240 240" className="h-64 w-64" role="img" aria-label="Attribute chart">
      {[1, 0.66, 0.33].map((f) => (
        <polygon
          key={f}
          points={attrs.map((_, i) => pt(i, f)).join(" ")}
          className="fill-none stroke-navy-foreground/20"
        />
      ))}
      <polygon
        points={attrs.map((a, i) => pt(i, a.v / 100)).join(" ")}
        className="fill-gold/40 stroke-gold"
        strokeWidth={2}
      />
      {attrs.map((a, i) => {
        const [x, y] = pt(i, 1.22).split(",").map(Number);
        return (
          <text
            key={a.l}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-navy-foreground font-display text-[11px] font-bold uppercase"
          >
            {a.l} {a.v}
          </text>
        );
      })}
    </svg>
  );
}

function PlayerProfile() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(playerQuery(slug));
  const [phase, setPhase] = useState<"before" | "now" | "future">("now");
  const settings = useSiteSettings();
  const [cvOpen, setCvOpen] = useState(false);
  if (!data) return <PlayerNotFound />;
  const { player: p, stats, milestones, media } = data;

  const attrs = [
    { l: "PAC", v: p.pace ?? 0 },
    { l: "TEC", v: p.technical ?? 0 },
    { l: "PAS", v: p.passing ?? 0 },
    { l: p.position === "GK" ? "GK" : "FIN", v: p.finishing ?? 0 },
    { l: "PHY", v: p.physical ?? 0 },
    { l: "TAC", v: p.tactical ?? 0 },
  ];
  const total = stats.reduce(
    (a, s) => ({
      apps: a.apps + s.appearances,
      min: a.min + s.minutes,
      g: a.g + s.goals,
      as: a.as + s.assists,
      cs: a.cs + s.clean_sheets,
      motm: a.motm + s.motm,
    }),
    { apps: 0, min: 0, g: 0, as: 0, cs: 0, motm: 0 },
  );
  const video = embed(p.video_cv_url);
  const photos = media.filter((m) => m.kind === "photo");
  const videos = media.filter((m) => m.kind === "video");
  const initials = p.full_name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
  const vitals = [
    ["Age", p.age != null ? `${p.age}${p.birth_year ? ` · ${p.birth_year}` : ""}` : "–"],
    ["Nationality", p.nationality ?? "–"],
    ["Foot", p.preferred_foot ?? "–"],
    ["Height", p.height_cm ? `${p.height_cm} cm` : "–"],
    ["Weight", p.weight_kg ? `${p.weight_kg} kg` : "–"],
    ["Programme", p.programme ?? "–"],
    ["Joined", fmtDate(p.joined_on) || "–"],
    ["Alt. position", p.secondary_position ?? "–"],
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Link
            to="/players"
            className="inline-flex items-center gap-1 text-sm text-navy-foreground/70 hover:text-gold print:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Back to squad
          </Link>
          <div className="mt-6 grid items-center gap-10 lg:grid-cols-[auto_1fr_auto]">
            <div className="relative mx-auto h-72 w-56 overflow-hidden rounded-xl border-4 border-gold bg-gradient-to-br from-primary to-navy">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.full_name} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center font-display text-8xl font-extrabold text-navy-foreground/25">
                  {initials}
                </span>
              )}
              <div className="absolute left-3 top-3 text-center">
                <p className="font-display text-5xl font-extrabold leading-none text-gold">
                  {p.overall_rating ?? "–"}
                </p>
                <p className="font-display text-sm font-bold uppercase">{p.position}</p>
              </div>
            </div>
            <div className="animate-rise">
              <p className="font-display uppercase tracking-[0.3em] text-gold">
                #{p.jersey_number ?? "–"} · {POS_LABEL[p.position] ?? p.position}
              </p>
              <h1 className="mt-2 text-5xl font-extrabold uppercase leading-[0.9] sm:text-7xl">
                {p.full_name}
              </h1>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                <BadgeCheck className="h-4 w-4" /> Buruj Technical Staff Verified —{" "}
                {fmtDate(p.updated_at)}
              </p>
              {p.bio && <p className="mt-4 max-w-xl text-lg text-navy-foreground/80">{p.bio}</p>}
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                {vitals.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wider text-navy-foreground/60">
                      {k}
                    </dt>
                    <dd className="font-display text-lg font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-3 print:hidden">
                <Button
                  onClick={() => setCvOpen(true)}
                  className="bg-gold font-display font-bold uppercase text-gold-foreground hover:bg-gold/90"
                >
                  <FileText className="mr-1 h-4 w-4" /> Request CV
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-navy-foreground/30 bg-transparent font-display font-bold uppercase text-navy-foreground hover:bg-navy-foreground/10"
                >
                  <a
                    href={waLinkFor(
                      settings.whatsapp,
                      `Hello Buruj Sports Academy, I'm enquiring about player ${p.full_name} (#${p.jersey_number ?? ""}).`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-1 h-4 w-4" /> Enquire via academy
                  </a>
                </Button>
              </div>
            </div>
            <div className="mx-auto">
              <Hexagon attrs={attrs} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="Verified by coaching staff" title="Career statistics" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Appearances", total.apps],
            ["Minutes", total.min.toLocaleString()],
            ["Goals", total.g],
            ["Assists", total.as],
            ["Clean sheets", total.cs],
            ["Player of match", total.motm],
          ].map(([l, v]) => (
            <div key={l} className="glow-hover rounded-xl border bg-card p-5 text-center">
              <p className="font-display text-4xl font-extrabold text-primary">{v}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        {stats.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-secondary font-display uppercase text-navy">
                <tr>
                  {[
                    "Season",
                    "Apps",
                    "Min",
                    "Goals",
                    "Assists",
                    "Clean sheets",
                    "YC",
                    "RC",
                    "MOTM",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.season} className="border-t">
                    <td className="px-4 py-3 font-semibold">{s.season}</td>
                    {[
                      s.appearances,
                      s.minutes,
                      s.goals,
                      s.assists,
                      s.clean_sheets,
                      s.yellow_cards,
                      s.red_cards,
                      s.motm,
                    ].map((v, i) => (
                      <td key={i} className="px-4 py-3">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Development pathway"
            title="Before · Now · Future"
            intro="How this player has progressed under the Buruj coaching model — and where they're heading next."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-3 print:hidden">
            {PHASES.map((ph) => (
              <button
                key={ph.k}
                onClick={() => setPhase(ph.k)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-all",
                  phase === ph.k
                    ? "border-gold bg-navy text-navy-foreground shadow-lg"
                    : "border-transparent bg-card text-navy hover:border-primary",
                )}
              >
                <p className="font-display text-3xl font-extrabold uppercase">{ph.l}</p>
                <p className="text-sm opacity-75">{ph.s}</p>
              </button>
            ))}
          </div>
          {PHASES.map((ph) => {
            const items = milestones.filter((m) => m.phase === ph.k);
            return (
              <ol
                key={ph.k}
                className={cn(
                  "mt-8 space-y-4 border-l-2 border-gold pl-6",
                  phase !== ph.k && "hidden print:block",
                )}
              >
                <p className="hidden font-display text-xl font-bold uppercase print:block">
                  {ph.l}
                </p>
                {items.length === 0 && (
                  <p className="text-muted-foreground">No milestones recorded yet.</p>
                )}
                {items.map((m, i) => (
                  <Reveal key={m.id} delay={i * 80}>
                    <li className="rounded-lg bg-card p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                        {fmtDate(m.event_date)}
                      </p>
                      <h3 className="text-xl font-bold uppercase text-navy">{m.title}</h3>
                      {m.description && (
                        <p className="mt-1 text-muted-foreground">{m.description}</p>
                      )}
                    </li>
                  </Reveal>
                ))}
              </ol>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 print:hidden">
        <SectionHeading eyebrow="Video CV" title="Highlights & gallery" />
        {isDirectVideo(p.video_cv_url) ? (
          <video
            src={p.video_cv_url ?? undefined}
            controls
            preload="metadata"
            className="mt-8 aspect-video w-full rounded-xl border bg-navy"
            aria-label={`${p.full_name} highlight reel`}
          />
        ) : video ? (
          <div className="mt-8 aspect-video overflow-hidden rounded-xl border bg-navy">
            <iframe
              src={video}
              title={`${p.full_name} highlight reel`}
              className="h-full w-full"
              allow="accelerometer; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : (
          <div className="mt-8 grid aspect-video place-items-center rounded-xl border bg-secondary text-muted-foreground">
            <PlayCircle className="h-12 w-12" />
            <p>Highlight reel coming soon</p>
          </div>
        )}
        {videos.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media
              .filter((m) => m.kind === "video")
              .map((v) => (
                <figure key={v.id}>
                  <div className="aspect-video overflow-hidden rounded-lg bg-navy">
                    {embed(v.url) ? (
                      <iframe
                        src={embed(v.url) ?? undefined}
                        title={v.caption ?? "Clip"}
                        className="h-full w-full"
                        allowFullScreen
                        loading="lazy"
                      />
                    ) : (
                      <video src={v.url} controls preload="metadata" className="h-full w-full" />
                    )}
                  </div>
                  {v.caption && (
                    <figcaption className="mt-1 text-sm text-muted-foreground">
                      {v.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
          </div>
        )}
        {photos.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {photos.map((ph) => (
              <img
                key={ph.id}
                src={ph.url}
                alt={ph.caption ?? p.full_name}
                className="aspect-square w-full rounded-lg object-cover"
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Match and training photos will be added by academy staff.
          </p>
        )}
      </section>

      {p.cv_summary && (
        <section className="bg-navy py-16 text-navy-foreground">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <SectionHeading light eyebrow="Player CV" title="Scouting summary" />
            <p className="mt-6 whitespace-pre-line text-lg text-navy-foreground/85">
              {p.cv_summary}
            </p>
            <p className="mt-6 text-sm text-navy-foreground/60">
              Guardian contact details are private. All scout and club enquiries are handled by the
              academy office.
            </p>
          </div>
        </section>
      )}
      <RequestCvDialog
        open={cvOpen}
        onOpenChange={setCvOpen}
        slug={slug}
        playerName={p.full_name}
      />
    </>
  );
}
