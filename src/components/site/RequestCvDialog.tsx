import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestPlayerCv } from "@/lib/cv.functions";

const PURPOSES = [
  "Trial invitation",
  "Scouting",
  "Transfer enquiry",
  "Scholarship",
  "Other",
] as const;

export function RequestCvDialog({
  open,
  onOpenChange,
  slug,
  playerName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  slug: string;
  playerName: string;
}) {
  const [f, setF] = useState({
    requester_name: "",
    organisation: "",
    role: "",
    email: "",
    country: "",
    purpose: "Scouting" as (typeof PURPOSES)[number],
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await requestPlayerCv({ data: { slug, ...f } });
      toast.success("Request sent — the academy will reply by email");
      onOpenChange(false);
    } catch {
      toast.error("Please check your details and try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold uppercase text-navy">
            Request {playerName}'s CV
          </DialogTitle>
          <DialogDescription>
            To protect our young players, verified CVs are shared by the academy office with clubs
            and scouts only.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cv-requester-name">Your name *</Label>
            <Input
              id="cv-requester-name"
              required
              maxLength={120}
              value={f.requester_name}
              onChange={set("requester_name")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cv-organisation">Club / organisation *</Label>
            <Input
              id="cv-organisation"
              required
              maxLength={150}
              value={f.organisation}
              onChange={set("organisation")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cv-role">Your role</Label>
            <Input
              id="cv-role"
              maxLength={80}
              placeholder="Scout, coach, agent…"
              value={f.role}
              onChange={set("role")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cv-country">Country</Label>
            <Input id="cv-country" maxLength={80} value={f.country} onChange={set("country")} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cv-email">Work email *</Label>
            <Input
              id="cv-email"
              required
              type="email"
              maxLength={255}
              value={f.email}
              onChange={set("email")}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cv-purpose">Purpose *</Label>
            <select
              id="cv-purpose"
              value={f.purpose}
              onChange={set("purpose")}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {PURPOSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="cv-message">Message</Label>
            <Textarea
              id="cv-message"
              rows={3}
              maxLength={1500}
              value={f.message}
              onChange={set("message")}
            />
          </div>
          <Button disabled={busy} className="font-display font-bold uppercase sm:col-span-2">
            {busy ? "Sending…" : "Send request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
