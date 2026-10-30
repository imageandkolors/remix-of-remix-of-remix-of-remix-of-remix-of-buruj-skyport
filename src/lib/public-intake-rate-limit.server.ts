type PublicIntakeOperation = "application" | "cv" | "parent_access" | "application_upload";

/**
 * Atomically limits repeated public submissions by a pseudonymous identifier.
 * Configure trusted IP throttling separately at the production edge/CDN/WAF.
 */
export async function enforcePublicIntakeRateLimit(
  operation: PublicIntakeOperation,
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
) {
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!serviceKey) throw new Error("Server configuration error");

  const { createHmac } = await import("node:crypto");
  const identifierHash = createHmac("sha256", serviceKey)
    .update(identifier.trim().toLowerCase())
    .digest("hex");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("consume_public_intake_rate_limit", {
    p_operation: operation,
    p_identifier_hash: identifierHash,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[public-intake] rate-limit check failed", error);
    throw new Error("Could not process this request. Please try again shortly.");
  }
  if (data) return;

  const rateLimitError = new Error("Too many requests. Please wait and try again.") as Error & {
    statusCode: number;
  };
  rateLimitError.statusCode = 429;
  throw rateLimitError;
}
