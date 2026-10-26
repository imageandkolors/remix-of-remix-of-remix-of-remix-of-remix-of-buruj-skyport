import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HeroSlider } from "@/components/site/HeroSlider";
import { StatsBar } from "@/components/site/StatsBar";
import { Programmes } from "@/components/site/Programmes";
import { PathwayFinder } from "@/components/site/PathwayFinder";
import { NewsList } from "@/components/site/NewsList";
import { SectionHeading } from "@/components/site/Reveal";
import { Button } from "@/components/ui/button";
import { newsQuery, programmesQuery, splashSlidesQuery } from "@/lib/queries";
import { useTrialSheet } from "@/components/site/TrialForm";
import { SocialFeeds } from "@/components/site/SocialFeeds";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buruj Sports Academy — Elite Football & Play & Study, Lagos" },
      {
        name: "description",
        content:
          "Residential football academy in Ikorodu, Lagos since 2013. Play & Study (JSS 1 – SS 3), Football Camping and international trials in the UK, Spain and Italy.",
      },
      { property: "og:title", content: "Buruj Sports Academy — Elite Football & Play & Study" },
      {
        property: "og:description",
        content:
          "Residential football development and schooling in Ikorodu, Lagos, with international trial pathways.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(programmesQuery),
      context.queryClient.ensureQueryData(newsQuery),
      context.queryClient.ensureQueryData(splashSlidesQuery),
    ]),
  errorComponent: () => (
    <p className="p-10 text-center">We couldn't load this page. Please refresh.</p>
  ),
  notFoundComponent: () => <p className="p-10 text-center">Not found.</p>,
  component: Index,
});

function Index() {
  const { data: programmes } = useSuspenseQuery(programmesQuery);
  const { data: news } = useSuspenseQuery(newsQuery);
  const { data: slides } = useSuspenseQuery(splashSlidesQuery);
  const { open: openTrial } = useTrialSheet();
  return (
    <>
      <HeroSlider slides={slides} />
      <StatsBar />
      <Programmes programmes={programmes} />
      <PathwayFinder />
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Latest" title="Academy news" />
          <Button asChild variant="outline" className="font-display font-bold uppercase">
            <Link to="/gallery">Media & matchday</Link>
          </Button>
        </div>
        <NewsList news={news.slice(0, 3)} />
      </section>
      <SocialFeeds />
      <section className="bg-gold">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
          <h2 className="text-4xl font-extrabold uppercase text-gold-foreground sm:text-5xl">
            Ready to step onto the pitch?
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={openTrial}
              className="bg-navy font-display text-base font-bold uppercase text-navy-foreground hover:bg-navy/90"
            >
              Register for a trial match
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-navy bg-transparent font-display text-base font-bold uppercase text-navy hover:bg-navy hover:text-navy-foreground"
            >
              <Link to="/apply">Apply online</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
