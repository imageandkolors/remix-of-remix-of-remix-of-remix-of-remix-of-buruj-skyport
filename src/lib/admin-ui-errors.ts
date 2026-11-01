const SERVICE_ROLE_CONFIGURATION_MESSAGE =
  "Admin data is unavailable because the server-side SUPABASE_SERVICE_ROLE_KEY is missing. Set it in this deployment's server environment (Vercel: Project Settings → Environment Variables; cPanel: Setup Node.js App → Environment variables), use a key for the same project as SUPABASE_URL, then redeploy or restart. Never expose this key in browser code or a VITE_ variable.";

const HTML_ERROR_PATTERN = /<!doctype\s+html|<html[\s>]|<body[\s>]/i;

export function safeAdminErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message.trim() : "";
  if (!message || HTML_ERROR_PATTERN.test(message)) return fallback;
  const missingServiceRoleKey =
    /missing supabase environment variable(?:\(s\))?:[^.]*\bSUPABASE_SERVICE_ROLE_KEY\b/i.test(
      message,
    ) ||
    /\bSUPABASE_SERVICE_ROLE_KEY\b.{0,100}\b(?:missing|not set|not configured)\b/i.test(message);
  if (missingServiceRoleKey) return SERVICE_ROLE_CONFIGURATION_MESSAGE;
  return message;
}

export function adminLoadErrorMessage(error: unknown, resource: string): string {
  return safeAdminErrorMessage(
    error,
    `Could not load ${resource}. Check the deployment's server-side Supabase configuration and required database migrations, then retry.`,
  );
}
