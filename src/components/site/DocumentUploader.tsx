import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPES, type DocType, completeApplicationUpload, requestApplicationUpload } from "@/lib/applications.functions";

export function DocumentUploader({ applicationId, reference, onUploaded, initialType = "birth_certificate" }: { applicationId: string; reference: string; onUploaded?: () => void; initialType?: DocType }) {
  const [type, setType] = useState<DocType>(initialType);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const mimeType = file.type || "application/octet-stream";
      const { path, token } = await requestApplicationUpload({ data: { applicationId, reference, filename: file.name, mimeType, size: file.size } });
      const { error } = await supabase.storage.from("application-documents").uploadToSignedUrl(path, token, file, { contentType: mimeType });
      if (error) throw error;
      await completeApplicationUpload({ data: { applicationId, reference, path, documentType: type, filename: file.name, mimeType, size: file.size } });
      toast.success(`${DOCUMENT_TYPES[type]} uploaded`);
      onUploaded?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <select value={type} onChange={(e) => setType(e.target.value as DocType)} className="h-10 rounded-md border bg-background px-3 text-sm">
        {Object.entries(DOCUMENT_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <Button asChild variant="outline" disabled={busy}>
        <label className="cursor-pointer">
          <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Choose file from device"}
          <input type="file" accept="application/pdf,image/*" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
        </label>
      </Button>
      <span className="text-xs text-muted-foreground">PDF or photo, max 20 MB</span>
    </div>
  );
}
