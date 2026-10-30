-- The applicants view exposes application PII. Invoker mode makes the caller's
-- grants and applications RLS policies apply to the underlying query instead
-- of the view owner's privileges.
ALTER VIEW public.applicants SET (security_invoker = true);
