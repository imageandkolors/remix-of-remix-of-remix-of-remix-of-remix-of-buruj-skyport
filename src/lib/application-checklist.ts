export const DOCUMENT_TYPES = {
  birth_certificate: "Birth certificate",
  passport_photo: "Passport photograph",
  medical_report: "Medical report",
  school_report: "Latest school report",
  id_document: "Guardian ID",
  other: "Other",
} as const;

export type DocType = keyof typeof DOCUMENT_TYPES;

export function requiredDocs(programme: string): DocType[] {
  const base: DocType[] = ["birth_certificate", "passport_photo", "medical_report"];
  return /education|play & study/i.test(programme) ? [...base, "school_report"] : base;
}

export type ApplicationChecklistInput = {
  programme: string;
  player_name: string;
  date_of_birth: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  address: string | null;
  motivation: string | null;
  consent: boolean;
  uploadedDocumentTypes: readonly DocType[];
};

export type CompletenessReview = {
  summary: string;
  strengths: string[];
  missing: string[];
  questions: string[];
};

export function buildApplicationCompletenessReview(
  application: ApplicationChecklistInput,
): CompletenessReview {
  const received = new Set(application.uploadedDocumentTypes);
  const missing = requiredDocs(application.programme)
    .filter((type) => !received.has(type))
    .map((type) => `${DOCUMENT_TYPES[type]} is missing`);

  if (!application.date_of_birth) missing.push("Date of birth is missing");
  if (!application.guardian_phone?.trim()) missing.push("Guardian phone number is missing");
  if (!application.guardian_email?.trim()) missing.push("Guardian email address is missing");
  if (!application.address?.trim()) missing.push("Home address is missing");
  if (!application.motivation?.trim()) missing.push("Application motivation is missing");
  if (!application.consent) missing.push("Required consent is not recorded");

  const strengths: string[] = [];
  if (requiredDocs(application.programme).every((type) => received.has(type))) {
    strengths.push("All required document types have been uploaded");
  }
  if (application.date_of_birth) strengths.push("Date of birth is recorded");
  if (application.guardian_phone?.trim() && application.guardian_email?.trim()) {
    strengths.push("Both guardian phone and email are recorded");
  }
  if (application.consent) strengths.push("Required consent is recorded");

  return {
    summary: missing.length
      ? `${application.player_name}'s ${application.programme} application has ${missing.length} completeness item${missing.length === 1 ? "" : "s"} to verify.`
      : `${application.player_name}'s ${application.programme} application has no missing items in the automated completeness checklist.`,
    strengths,
    missing,
    questions: missing.length
      ? missing.slice(0, 5).map((item) => {
          const requirement = item.replace(/ is missing$| is not recorded$/, "").toLowerCase();
          return `Please confirm or provide: ${requirement}.`;
        })
      : ["Please verify the application details manually before making an admissions decision."],
  };
}
