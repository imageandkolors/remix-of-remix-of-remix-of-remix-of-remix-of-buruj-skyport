import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const DOCUMENT_TYPES = {
  birth_certificate: "Birth certificate",
  passport_photo: "Passport photograph",
  medical_report: "Medical report",
  school_report: "Latest school report",
  id_document: "Guardian ID",
  other: "Other",
} as const;
export type DocType = keyof typeof DOCUMENT_TYPES;
const docType = z.enum(Object.keys(DOCUMENT_TYPES) as [DocType, ...DocType[]]);

export function requiredDocs(programme: string): DocType[] {
  const base: DocType[] = ["birth_certificate", "passport_photo", "medical_report"];
  return /education|play & study/i.test(programme) ? [...base, "school_report"] : base;
}

const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

async function findApplication(applicationId: string, reference: string) {
  const db = await admin();
  const { data } = await db
    .from("applications")
    .select("id, reference_number")
    .eq("id", applicationId)
    .eq("reference_number", reference)
    .maybeSingle();
  if (!data) throw new Error("Application not found");
  return db;
}

/** Public: a family uploading documents right after submitting (reference + id act as the key). */
export const requestApplicationUpload = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        applicationId: z.string().uuid(),
        reference: z.string().min(8).max(40),
        filename: z.string().trim().min(1).max(180),
        mimeType: z.string().max(120),
        size: z.number().int().positive().max(20971520),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!ALLOWED.includes(data.mimeType)) throw new Error("Upload a PDF or photo (JPG, PNG, WEBP)");
    const db = await findApplication(data.applicationId, data.reference);
    const safe = data.filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .slice(-100);
    const path = `${data.applicationId}/${crypto.randomUUID()}-${safe}`;
    const { data: signed, error } = await db.storage
      .from("application-documents")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Could not prepare upload");
    return { path, token: signed.token };
  });

export const completeApplicationUpload = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        applicationId: z.string().uuid(),
        reference: z.string().min(8).max(40),
        path: z.string().max(400),
        documentType: docType,
        filename: z.string().max(180),
        mimeType: z.string().max(120),
        size: z.number().int().positive(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!data.path.startsWith(`${data.applicationId}/`)) throw new Error("Invalid upload");
    const db = await findApplication(data.applicationId, data.reference);
    const { error } = await db.from("application_documents").insert({
      application_id: data.applicationId,
      document_type: data.documentType,
      storage_path: data.path,
      original_filename: data.filename,
      mime_type: data.mimeType,
      size_bytes: data.size,
    });
    if (error) throw new Error("Could not save document");
    return { ok: true };
  });

/** Public: parent asks admissions for a sign-in link. Never reveals whether the reference matched. */
export const requestParentAccess = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        reference: z.string().trim().toUpperCase().min(8).max(40),
        name: z.string().trim().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { count } = await db
      .from("parent_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email)
      .eq("status", "pending");
    if ((count ?? 0) < 3)
      await db.from("parent_access_requests").insert({
        email: data.email,
        reference_number: data.reference,
        guardian_name: data.name ?? null,
      });
    return { ok: true };
  });

async function requireAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
  if (!data) throw new Error("Admin access required");
}

export const listAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data: reqs } = await context.supabase
      .from("parent_access_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const db = await admin();
    const refs = [...new Set((reqs ?? []).map((r) => r.reference_number))];
    const { data: apps } = refs.length
      ? await db
          .from("applications")
          .select("reference_number, guardian_email, player_name")
          .in("reference_number", refs)
      : { data: [] };
    return (reqs ?? []).map((r) => {
      const app = apps?.find((a) => a.reference_number === r.reference_number);
      return {
        ...r,
        player_name: app?.player_name ?? null,
        matches: Boolean(app && app.guardian_email?.toLowerCase() === r.email),
      };
    });
  });

export const decideAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), action: z.enum(["send", "decline"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: req } = await context.supabase
      .from("parent_access_requests")
      .select("*")
      .eq("id", data.id)
      .single();
    if (!req) throw new Error("Request not found");
    if (data.action === "decline") {
      await context.supabase
        .from("parent_access_requests")
        .update({ status: "declined" })
        .eq("id", data.id);
      return { ok: true };
    }
    const db = await admin();
    const { data: app } = await db
      .from("applications")
      .select("guardian_email")
      .eq("reference_number", req.reference_number)
      .maybeSingle();
    if (!app || app.guardian_email?.toLowerCase() !== req.email)
      throw new Error("This email does not match the guardian email on that application");
    const origin = getRequestHeader("origin") ?? "";
    const { error } = await db.auth.signInWithOtp({
      email: req.email,
      options: { shouldCreateUser: true, emailRedirectTo: `${origin}/portal` },
    });
    if (error) throw new Error("Could not send the sign-in link. Try again in a minute.");
    await context.supabase
      .from("parent_access_requests")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

const PROGRESS = ["submitted", "under_review", "shortlisted", "accepted"] as const;

/** Parent portal: only emails an admin has approved (status "sent") can see their applications. */
export const getMyPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    if (!email) throw new Error("No email on account");
    const db = await admin();
    const { data: approved } = await db
      .from("parent_access_requests")
      .select("reference_number")
      .eq("email", email)
      .eq("status", "sent");
    const refs = (approved ?? []).map((r) => r.reference_number);
    if (refs.length === 0) return { approved: false, email, applications: [] };
    const { data: apps } = await db
      .from("applications")
      .select(
        "id, reference_number, programme, player_name, status, status_changed_at, created_at, guardian_name, guardian_phone, guardian_email, address, date_of_birth, medical_notes, consent",
      )
      .in("reference_number", refs)
      .ilike("guardian_email", email);
    const ids = (apps ?? []).map((a) => a.id);
    const { data: docs } = ids.length
      ? await db
          .from("application_documents")
          .select("id, application_id, document_type, original_filename, created_at")
          .in("application_id", ids)
      : { data: [] };
    return {
      approved: true,
      email,
      applications: (apps ?? []).map((a) => {
        const mine = (docs ?? []).filter((d) => d.application_id === a.id);
        const have = new Set(mine.map((d) => d.document_type));
        const outstanding: string[] = requiredDocs(a.programme)
          .filter((t) => !have.has(t))
          .map((t) => DOCUMENT_TYPES[t]);
        if (!a.date_of_birth) outstanding.push("Player's date of birth");
        if (!a.address) outstanding.push("Home address");
        return {
          ...a,
          documents: mine,
          outstanding,
          step: Math.max(0, PROGRESS.indexOf(a.status as never)),
        };
      }),
    };
  });

export const updateMyContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        applicationId: z.string().uuid(),
        guardian_phone: z.string().trim().min(7).max(30),
        address: z.string().trim().max(300),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    const db = await admin();
    const { data: app } = await db
      .from("applications")
      .select("id, reference_number, guardian_email")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!app || app.guardian_email?.toLowerCase() !== email)
      throw new Error("Not your application");
    const { count } = await db
      .from("parent_access_requests")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .eq("reference_number", app.reference_number)
      .eq("status", "sent");
    if (!count) throw new Error("Access not approved");
    const { error } = await db
      .from("applications")
      .update({ guardian_phone: data.guardian_phone, address: data.address || null })
      .eq("id", data.applicationId);
    if (error) throw new Error("Could not update details");
    return { ok: true };
  });

/** Staff: signed links to an applicant's uploaded files. */
export const getApplicationDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ applicationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isStaff, error: roleError } = await context.supabase.rpc("is_staff", {
      _user_id: context.userId,
    });
    if (roleError || !isStaff) throw new Error("Staff access required");
    const { data: docs, error } = await context.supabase
      .from("application_documents")
      .select("*")
      .eq("application_id", data.applicationId)
      .order("created_at");
    if (error) throw new Error("Could not load documents");
    return Promise.all(
      (docs ?? []).map(async (d) => {
        const { data: s } = await context.supabase.storage
          .from("application-documents")
          .createSignedUrl(d.storage_path, 600);
        return {
          id: d.id,
          type: d.document_type,
          label: DOCUMENT_TYPES[d.document_type as DocType] ?? d.document_type,
          filename: d.original_filename,
          size: d.size_bytes,
          created_at: d.created_at,
          url: s?.signedUrl ?? null,
        };
      }),
    );
  });

type Assessment = { summary: string; strengths: string[]; missing: string[]; questions: string[] };

export const analyzeApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ applicationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<Assessment & { assessed_at: string }> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Staff access required");
    const { data: app } = await context.supabase
      .from("applications")
      .select("*")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!app) throw new Error("Application not found or not assigned to you");
    const { data: docs } = await context.supabase
      .from("application_documents")
      .select("document_type, original_filename, mime_type")
      .eq("application_id", app.id);
    const required = requiredDocs(app.programme).map((t) => DOCUMENT_TYPES[t]);
    const payload = {
      programme: app.programme,
      player_name: app.player_name,
      date_of_birth: app.date_of_birth,
      gender: app.gender,
      position: app.position,
      current_school: app.current_school,
      current_class: app.current_class,
      guardian_relationship: app.guardian_relationship,
      guardian_phone_provided: Boolean(app.guardian_phone),
      guardian_email_provided: Boolean(app.guardian_email),
      address_provided: Boolean(app.address),
      medical_notes: app.medical_notes,
      motivation: app.motivation,
      consent: app.consent,
      uploaded_documents: (docs ?? []).map((d) => ({
        type: DOCUMENT_TYPES[d.document_type as DocType] ?? d.document_type,
        file: d.original_filename,
      })),
      required_documents: required,
      today: new Date().toISOString().slice(0, 10),
    };
    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["summary", "strengths", "missing", "questions"],
      properties: {
        summary: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        missing: { type: "array", items: { type: "string" } },
        questions: { type: "array", items: { type: "string" } },
      },
    };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": process.env["LOVABLE_API_KEY"]!,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "You are an admissions assistant for Buruj Sports Academy, a Nigerian football academy (ages 9-22). Review the application JSON. Write a 2-3 sentence summary, up to 5 strengths, every missing or weak requirement (missing required documents, missing date of birth, age outside the programme range, vague motivation, missing consent, unexplained medical notes), and 3-5 specific follow-up questions for the family. Be factual; never invent details. Keep each item under 25 words.",
        input: JSON.stringify(payload),
        text: { format: { type: "json_schema", name: "assessment", strict: true, schema } },
      }),
    });
    if (res.status === 429) throw new Error("AI is busy right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are used up for this workspace.");
    if (!res.ok || !res.body) throw new Error("AI review failed");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "",
      text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const ev = JSON.parse(raw);
          if (ev.type === "response.output_text.delta") text += ev.delta;
        } catch {
          /* partial */
        }
      }
    }
    let result: Assessment;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("AI returned an unreadable answer");
    }
    const assessed_at = new Date().toISOString();
    const db = await admin();
    await db
      .from("applications")
      .update({ ai_assessment: result, ai_assessed_at: assessed_at })
      .eq("id", app.id);
    return { ...result, assessed_at };
  });

/** Public: submit an application; returns id + reference so the family can upload documents next. */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        programme: z.string().trim().min(2).max(120),
        player_name: z.string().trim().min(2).max(120),
        date_of_birth: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable(),
        gender: z.string().max(20).nullable(),
        position: z.string().max(60).nullable(),
        current_school: z.string().max(150).nullable(),
        current_class: z.string().max(40).nullable(),
        guardian_name: z.string().trim().min(2).max(120),
        guardian_relationship: z.string().max(40).nullable(),
        guardian_phone: z.string().trim().min(7).max(30),
        guardian_email: z.string().trim().toLowerCase().email().max(255).nullable(),
        address: z.string().max(300).nullable(),
        medical_notes: z.string().max(1000).nullable(),
        motivation: z.string().max(1500).nullable(),
        consent: z.literal(true),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: prog } = await db
      .from("programmes")
      .select("name")
      .eq("name", data.programme)
      .eq("is_published", true)
      .maybeSingle();
    if (!prog) throw new Error("Choose a valid programme");
    const { data: row, error } = await db
      .from("applications")
      .insert({ ...data, status: "submitted" })
      .select("id, reference_number")
      .single();
    if (error || !row) throw new Error("Could not submit application");
    return row;
  });
