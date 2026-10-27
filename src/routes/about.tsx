import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { getAboutSections, type AboutSection } from "@/lib/about.functions";
import campus from "@/assets/hero-campus.jpg";
import training from "@/assets/hero-training.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Buruj Sports Academy — Our Story Since 2013" },
      {
        name: "description",
        content:
          "The story, people, values and complete development environment of Buruj Sports Academy.",
      },
      { property: "og:title", content: "About Buruj Sports Academy" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["about-sections"],
      queryFn: () => getAboutSections(),
    }),
  errorComponent: () => (
    <p className="p-10 text-center">We couldn&apos;t load About Us. Please refresh.</p>
  ),
  component: About,
});

function fallbackImage(section: AboutSection) {
  return section.section_key === "hero"
    ? campus
    : section.section_key === "story"
      ? training
      : null;
}
function About() {
  const { data } = useSuspenseQuery({
    queryKey: ["about-sections"],
    queryFn: () => getAboutSections(),
  });
  return (
    <div>
      {data.map((section) => (
        <AboutSectionView key={section.id} section={section} />
      ))}
    </div>
  );
}
function AboutSectionView({ section }: { section: AboutSection }) {
  const image = section.image_url || fallbackImage(section);
  const textClass = section.layout === "hero" || section.layout === "cta" ? "text-white" : "";
  const inner = (
    <div
      className={`prose prose-lg max-w-none ${textClass} prose-headings:font-display prose-headings:uppercase prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit`}
      dangerouslySetInnerHTML={{ __html: section.body_html }}
    />
  );
  if (section.layout === "hero")
    return (
      <section
        className="relative overflow-hidden py-28"
        style={{ backgroundColor: section.bg_color, color: section.text_color }}
      >
        <>
          {image && (
            <img
              src={image}
              alt={section.image_alt || ""}
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )}
        </>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <p
            className="font-display uppercase tracking-[0.3em]"
            style={{ color: section.accent_color }}
          >
            {section.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-6xl font-extrabold uppercase leading-[0.9] sm:text-7xl">
            {section.title}
          </h1>
          <div className="mt-6 max-w-2xl">{inner}</div>
        </div>
      </section>
    );
  if (section.layout === "cta")
    return (
      <section
        className="py-20"
        style={{ backgroundColor: section.bg_color, color: section.text_color }}
      >
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p
            className="font-display uppercase tracking-[0.3em]"
            style={{ color: section.accent_color }}
          >
            {section.eyebrow}
          </p>
          <h2 className="mt-3 text-4xl font-extrabold uppercase">{section.title}</h2>
          <div className="mx-auto mt-4 max-w-2xl">{inner}</div>
          <Button
            asChild
            size="lg"
            className="mt-7 font-display font-bold uppercase"
            style={{ backgroundColor: section.accent_color, color: section.text_color }}
          >
            <Link to="/admissions">Explore our programmes</Link>
          </Button>
        </div>
      </section>
    );
  if (section.layout === "split")
    return (
      <section
        className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2"
        style={{ color: section.text_color }}
      >
        <div>
          <p
            className="font-display uppercase tracking-[0.3em]"
            style={{ color: section.accent_color }}
          >
            {section.eyebrow}
          </p>
          <h2 className="mt-2 text-4xl font-extrabold uppercase">{section.title}</h2>
          <div className="mt-8">{inner}</div>
        </div>
        {image && (
          <Reveal>
            <img
              src={image}
              alt={section.image_alt || section.title}
              className="h-full max-h-[600px] w-full rounded-xl object-cover"
              loading="lazy"
            />
          </Reveal>
        )}
      </section>
    );
  return (
    <section
      className="py-24"
      style={{ backgroundColor: section.bg_color, color: section.text_color }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p
          className="font-display uppercase tracking-[0.3em]"
          style={{ color: section.accent_color }}
        >
          {section.eyebrow}
        </p>
        <h2 className="mt-2 text-4xl font-extrabold uppercase">{section.title}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">{inner}</div>
        {image && (
          <img
            src={image}
            alt={section.image_alt || section.title}
            className="mt-8 max-h-[460px] w-full rounded-xl object-cover"
            loading="lazy"
          />
        )}
      </div>
    </section>
  );
}
