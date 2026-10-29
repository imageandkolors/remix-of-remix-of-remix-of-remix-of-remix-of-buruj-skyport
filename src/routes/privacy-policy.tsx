import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Buruj Sports Academy" },
      {
        name: "description",
        content:
          "How Buruj Sports Academy collects, protects and uses player, parent and visitor information.",
      },
      { property: "og:title", content: "Privacy Policy — Buruj Sports Academy" },
      {
        property: "og:description",
        content: "How we protect player, parent and visitor information.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "Who we are",
    p: [
      'Buruj Sports Academy ("BSA", "we") operates from 8 Adeniran Oshodi Street, Ogolonto, Ikorodu, Lagos. We are responsible for personal data collected through this website and app, in line with the Nigeria Data Protection Act 2023 (NDPA) and, where applicable, the EU/UK GDPR.',
    ],
  },
  {
    h: "What we collect",
    p: [
      "Application details: player name, date of birth, programme, school class, health and medical notes, guardian name and contact details.",
      "Documents you upload, such as birth certificates, passports and medical clearances.",
      "Enquiries, trial registrations and scout/club CV requests (name, organisation, email, purpose).",
      "Basic technical data such as device type and pages visited, and cookies described below.",
    ],
  },
  {
    h: "How we use it",
    p: [
      "To process admissions and trials, look after players' welfare, keep families updated through the parent portal, respond to enquiries, and meet legal and football-association (NFF/LSFA/FIFA) registration requirements. We use an AI assistant only to help staff review applications; final decisions are always made by people.",
    ],
  },
  {
    h: "Protecting children",
    p: [
      "Most of our players are under 18. Public player profiles show only age and birth year — never full dates of birth, addresses or contact details. Player CVs are shared with scouts and clubs only after a request is reviewed by academy staff and with guardian consent.",
    ],
  },
  {
    h: "Storage & security",
    p: [
      "Files and records are kept in private, access-controlled storage. Only authorised staff can view documents; parents sign in by secure one-time magic links sent by the academy.",
    ],
  },
  {
    h: "Cookies",
    p: [
      'Essential cookies and device storage keep you signed in, remember your cookie choice and save application drafts. Optional cookies help us understand site use. You can choose "Essential only" in the cookie notice at any time by clearing your browser storage.',
    ],
  },
  {
    h: "Sharing",
    p: [
      "We do not sell personal data. We share it only with football associations, partner clubs or trial organisers (with consent), service providers who host our systems, or where the law requires.",
    ],
  },
  {
    h: "How long we keep it",
    p: [
      "Application records are kept for the duration of enrolment plus up to six years, unless a longer period is required by law or football regulations. Unsuccessful applications are deleted after 24 months.",
    ],
  },
  {
    h: "Your rights",
    p: [
      "You may request access to, correction of, or deletion of your or your child's data, withdraw consent, or object to processing. Contact us through the Contact page; you may also complain to the Nigeria Data Protection Commission.",
    ],
  },
];

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-sm font-semibold uppercase tracking-widest text-gold">Legal</p>
      <h1 className="mt-2 font-display text-5xl font-bold uppercase">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>
      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-2xl font-bold uppercase">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="mt-2 leading-relaxed text-muted-foreground">
                {t}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
