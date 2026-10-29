import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { completePlayerUpload, removePlayerFile, requestPlayerUpload } from "@/lib/squad.functions";

type Purpose = "avatar" | "video" | "media";

export function PlayerFilePicker({
  playerId,
  purpose,
  label,
  hasFile,
  accept,
  caption,
  replaceId,
  onDone,
}: {
  playerId: string;
  purpose: Purpose;
  label: string;
  hasFile?: boolean;
  accept: string;
  caption?: string;
  replaceId?: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    try {
      const mimeType = file.type || "application/octet-stream";
      const r = await requestPlayerUpload({
        data: { playerId, purpose, filename: file.name, mimeType, size: file.size },
      });
      const { error } = await supabase.storage
        .from(r.bucket)
        .uploadToSignedUrl(r.path, r.token, file, { contentType: mimeType });
      if (error) throw error;
      await completePlayerUpload({
        data: {
          playerId,
          purpose,
          path: r.path,
          mimeType,
          size: file.size,
          originalFilename: file.name,
          caption: caption || null,
          replaceId,
        },
      });
      toast.success("Uploaded");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await removePlayerFile({ data: { playerId, type: purpose } });
      toast.success("Removed");
      onDone();
    } catch {
      toast.error("Could not remove");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="outline" disabled={busy}>
        <label className="cursor-pointer">
          <Upload className="h-4 w-4" />
          {busy ? "Uploading…" : hasFile ? `Replace ${label}` : label}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }}
          />
        </label>
      </Button>
      {hasFile && (purpose === "avatar" || purpose === "video") && (
        <Button
          size="icon"
          variant="ghost"
          onClick={remove}
          disabled={busy}
          aria-label={`Remove ${label}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
