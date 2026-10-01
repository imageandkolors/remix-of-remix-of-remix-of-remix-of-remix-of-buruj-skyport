import { createContext, useContext, useState, type ReactNode } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const schema = z.object({
  player_name: z.string().trim().min(2, "Enter the player's name").max(120),
  date_of_birth: z.string().optional(),
  position: z.string().trim().max(60).optional(),
  guardian_name: z.string().trim().min(2, "Enter guardian's name").max(120),
  guardian_phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  guardian_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  programme: z.string().optional(),
});

export function TrialForm({ onDone }: { onDone?: () => void }) {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check the form"); return; }
    setLoading(true);
    const d = parsed.data;
    const { error } = await supabase.from("trial_registrations").insert({
      player_name: d.player_name,
      guardian_name: d.guardian_name,
      guardian_phone: d.guardian_phone,
      position: d.position || null,
      programme: d.programme || null,
      date_of_birth: d.date_of_birth || null,
      guardian_email: d.guardian_email || null,
    });
    setLoading(false);
    if (error) { toast.error("Could not submit. Please try again."); return; }
    toast.success("Trial registration received! Our team will contact you.");
    form.reset();
    onDone?.();
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field name="player_name" label="Player's full name" required />
      <Field name="date_of_birth" label="Date of birth" type="date" />
      <Field name="position" label="Playing position" />
      <div className="space-y-1.5">
        <Label htmlFor="programme">Programme</Label>
        <select id="programme" name="programme" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option>Play & Study</option>
          <option>Football Camping</option>
          <option>Not sure yet</option>
        </select>
      </div>
      <Field name="guardian_name" label="Parent / guardian name" required />
      <Field name="guardian_phone" label="Guardian phone" type="tel" required />
      <div className="sm:col-span-2"><Field name="guardian_email" label="Guardian email" type="email" /></div>
      <Button type="submit" disabled={loading} size="lg" className="w-full font-display text-base font-bold uppercase sm:col-span-2">
        {loading ? "Submitting…" : "Register for trial"}
      </Button>
    </form>
  );
}

export function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}{required && " *"}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useTrialSheet = () => useContext(Ctx);

export function TrialSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto border-l-4 border-gold sm:max-w-lg">
          <SheetHeader className="px-0">
            <SheetTitle className="font-display text-3xl font-extrabold uppercase text-navy">Trial match registration</SheetTitle>
            <SheetDescription>No account needed. We'll confirm your trial date by phone or WhatsApp.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 px-1 pb-6"><TrialForm onDone={() => setOpen(false)} /></div>
        </SheetContent>
      </Sheet>
    </Ctx.Provider>
  );
}
