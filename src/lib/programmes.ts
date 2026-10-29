export type ProgrammeSection = { title: string; body: string; items: string[] };

export type Programme = {
  id?: string;
  slug: string;
  name: string;
  tagline: string | null;
  age_range: string | null;
  session_label: string | null;
  fee_amount: number | null;
  fee_period: string | null;
  fee_confirmed: boolean;
  non_refundable: boolean;
  inclusions: string[];
  intro: string | null;
  sections: ProgrammeSection[];
  trial_countries: string[];
  note: string | null;
  cta_title: string | null;
  cta_body: string | null;
  cta_label: string | null;
  is_published?: boolean;
  display_order?: number;
};

export const PROGRAMME_COLUMNS =
  "id, slug, name, tagline, age_range, session_label, fee_amount, fee_period, fee_confirmed, non_refundable, inclusions, intro, sections, trial_countries, note, cta_title, cta_body, cta_label, is_published, display_order";

export function normaliseSections(value: unknown): ProgrammeSection[] {
  if (!Array.isArray(value)) return [];
  return value.map((s) => ({
    title: String((s as ProgrammeSection)?.title ?? ""),
    body: String((s as ProgrammeSection)?.body ?? ""),
    items: Array.isArray((s as ProgrammeSection)?.items)
      ? (s as ProgrammeSection).items.map(String)
      : [],
  }));
}

export function formatNaira(amount: number) {
  if (amount >= 1_000_000)
    return `₦${(amount / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  return `₦${amount.toLocaleString()}`;
}

export function formatFee(p: Pick<Programme, "fee_amount" | "fee_period" | "fee_confirmed">) {
  if (!p.fee_confirmed || p.fee_amount == null) return "Fee to be confirmed";
  return `${formatNaira(Number(p.fee_amount))}${p.fee_period ? ` / ${p.fee_period}` : ""}`;
}
