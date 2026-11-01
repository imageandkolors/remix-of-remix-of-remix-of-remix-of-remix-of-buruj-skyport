import assert from "node:assert/strict";
import test from "node:test";
import {
  buildApplicationCompletenessReview,
  type ApplicationChecklistInput,
} from "./application-checklist";

const completeApplication: ApplicationChecklistInput = {
  programme: "Play & Study",
  player_name: "Example Player",
  date_of_birth: "2012-03-12",
  guardian_phone: "+2348000000000",
  guardian_email: "guardian@example.com",
  address: "Ikorodu, Lagos",
  motivation: "A private free-text response that must not be copied into the review.",
  consent: true,
  uploadedDocumentTypes: ["birth_certificate", "passport_photo", "medical_report", "school_report"],
};

test("marks a complete Play & Study application without making an admissions decision", () => {
  const review = buildApplicationCompletenessReview(completeApplication);

  assert.equal(review.missing.length, 0);
  assert.ok(review.strengths.includes("All required document types have been uploaded"));
  assert.match(review.summary, /no missing items/);
  assert.match(review.questions[0] ?? "", /verify the application details manually/);
});

test("identifies missing programme documents and required fields", () => {
  const review = buildApplicationCompletenessReview({
    ...completeApplication,
    date_of_birth: null,
    guardian_email: null,
    consent: false,
    uploadedDocumentTypes: ["birth_certificate", "passport_photo"],
  });

  assert.ok(review.missing.includes("Medical report is missing"));
  assert.ok(review.missing.includes("Latest school report is missing"));
  assert.ok(review.missing.includes("Date of birth is missing"));
  assert.ok(review.missing.includes("Guardian email address is missing"));
  assert.ok(review.missing.includes("Required consent is not recorded"));
  assert.equal(review.questions.length, 5);
});

test("does not copy private free-text motivation into checklist output", () => {
  const review = buildApplicationCompletenessReview(completeApplication);
  const output = JSON.stringify(review);

  assert.equal(output.includes(completeApplication.motivation!), false);
});
