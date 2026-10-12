import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoAssetSrc from "@/assets/buruj-crest.jpeg";
const logoAsset = { url: logoAssetSrc };
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" && search["redirect"].startsWith("/") ? search["redirect"] : "/dashboard",
  }),
  head: () => ({ meta: [
    { title: "Staff Sign In — Buruj Sports Academy" },
    { name: "description", content: "Secure staff and coach access for Buruj Sports Academy." },
    { property: "og:title", content: "Staff Sign In — Buruj Sports Academy" },
    { property: "og:description", content: "Secure staff and coach access." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error("Email or password is incorrect"); return; }
    navigate({ to: redirect });
  }

  async function signInGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) toast.error("Google sign-in could not be started");
  }

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-secondary px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-7 shadow-lg sm:p-9">
        <div className="flex items-center gap-3"><img src={logoAsset.url} alt="Buruj Sports Academy" className="h-16 w-auto rounded bg-white px-2 py-1" /><div><p className="font-display text-sm font-bold uppercase text-primary">Staff portal</p><h1 className="text-4xl font-extrabold uppercase text-navy">Welcome back</h1></div></div>
        <p className="mt-5 text-muted-foreground">Sign in with your approved staff or coach account.</p>
        <form onSubmit={signIn} className="mt-7 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="w-full font-display font-bold uppercase"><LockKeyhole />{loading ? "Signing in…" : "Sign in"}</Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <Button type="button" variant="outline" onClick={signInGoogle} className="w-full font-display font-bold uppercase">Continue with Google</Button>
      </div>
    </section>
  );
}