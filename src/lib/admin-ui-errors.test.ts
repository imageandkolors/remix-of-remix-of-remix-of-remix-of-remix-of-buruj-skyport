import assert from "node:assert/strict";
import test from "node:test";
import { adminLoadErrorMessage, safeAdminErrorMessage } from "./admin-ui-errors";

test("maps a missing service-role key to deployment-neutral configuration guidance", () => {
  const message = safeAdminErrorMessage(
    new Error(
      "Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY. Set them in the cPanel runtime.",
    ),
    "fallback",
  );

  assert.match(message, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(message, /Vercel/);
  assert.match(message, /cPanel/);
  assert.match(message, /same project as SUPABASE_URL/);
  assert.match(message, /Never expose/);
  assert.doesNotMatch(message, /cPanel runtime\./);
});

test("does not misidentify a missing Supabase URL as a missing service-role key", () => {
  const original =
    "Missing Supabase environment variable(s): SUPABASE_URL. Never expose SUPABASE_SERVICE_ROLE_KEY to browser code.";

  assert.equal(safeAdminErrorMessage(new Error(original), "fallback"), original);
});

test("does not pass raw HTML error documents into the interface", () => {
  const message = safeAdminErrorMessage(
    new Error("<!doctype html><html><body>This page didn't load</body></html>"),
    "Could not load user accounts.",
  );

  assert.equal(message, "Could not load user accounts.");
  assert.doesNotMatch(message, /<html|doctype/i);
});

test("uses a safe resource-specific fallback when an error is not available", () => {
  assert.match(
    adminLoadErrorMessage(null, "public submissions"),
    /Could not load public submissions/,
  );
});

test("keeps ordinary actionable server messages intact", () => {
  assert.equal(
    safeAdminErrorMessage(
      new Error("The confirmation email does not match this account."),
      "fallback",
    ),
    "The confirmation email does not match this account.",
  );
});
