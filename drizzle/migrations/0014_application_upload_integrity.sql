-- Bind each signed upload to a server-created, short-lived ticket. The public
-- client may upload to the signed path, but only the service role can inspect or
-- complete a ticket and register the document.
CREATE TABLE IF NOT EXISTS public.application_upload_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'birth_certificate', 'passport_photo', 'medical_report',
    'school_report', 'id_document', 'other'
  )),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  expected_mime_type text NOT NULL CHECK (expected_mime_type IN (
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'
  )),
  expected_size bigint NOT NULL CHECK (expected_size BETWEEN 1 AND 20971520),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS application_upload_tickets_expiry_idx
  ON public.application_upload_tickets (expires_at)
  WHERE status = 'pending';

-- Make completion retries idempotent and prevent one object being registered
-- as multiple documents. The staging audit confirmed no duplicate paths exist.
CREATE UNIQUE INDEX IF NOT EXISTS application_documents_storage_path_uidx
  ON public.application_documents (storage_path);

ALTER TABLE public.application_upload_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.application_upload_tickets FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.application_upload_tickets TO service_role;

-- Match the server validator at the Storage boundary as well. Keep this bucket
-- private; signed URLs remain necessary for document access.
UPDATE storage.buckets
   SET file_size_limit = 20971520,
       allowed_mime_types = ARRAY[
         'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'
       ]
 WHERE id = 'application-documents';
