import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoAssetSrc from "@/assets/buruj-crest.jpeg";
const logoAsset = { url: logoAssetSrc };
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search["redirect"] === "string" &&
      search["redirect"].startsWith("/") &&
      !search["redirect"].startsWith("//")
        ? search["redirect"]
        : "/dashboard",
    mode: search["mode"] === "invite" ? "invite" : "sign-in",
  }),
  head: () => ({
    meta: [
      { title: "Staff Sign In — Buruj Sports Academy" },
      { name: "description", content: "Secure staff and coach access for Buruj Sports Academy." },
      { property: "og:title", content: "Staff Sign In — Buruj Sports Academy" },
      { property: "og:description", content: "Secure staff and coach access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect, mode } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [validInviteSession, setValidInviteSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setValidInviteSession(Boolean(data.session?.user.invited_at));
      setSessionReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mode === "invite") setValidInviteSession(Boolean(session?.user.invited_at));
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [mode]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Email or password is incorrect");
      return;
    }
    await navigate({ to: redirect });
  }

  async function setInitialPassword(event: React.FormEvent) {
    event.preventDefault();
    if (password !== passwordConfirm) {
      toast.error("The passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Could not set your password");
      return;
    }
    toast.success("Your account is ready");
    await navigate({ to: redirect });
  }

  const inviteMode = mode === "invite";
  const showPasswordSetup = inviteMode && sessionReady && validInviteSession;

  return (
    <section className="min-h-[calc(100vh-8rem)] bg-secondary px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-md rounded-lg border bg-card p-7 shadow-lg sm:p-9">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="Buruj Sports Academy"
            className="h-16 w-auto rounded bg-white px-2 py-1"
          />
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Staff portal
            </p>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {showPasswordSetup ? "Set your password" : "Sign in"}
            </h1>
          </div>
        </div>

        {showPasswordSetup ? (
          <>
            <p className="mt-5 text-muted-foreground">
              Choose a password for your invited account. Use at least eight characters.
            </p>
            <form onSubmit={setInitialPassword} className="mt-7 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-display font-bold uppercase"
              >
                <LockKeyhole />
                {loading ? "Saving…" : "Set password"}
              </Button>
            </form>
          </>
        ) : inviteMode ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              {sessionReady
                ? "This invitation link is invalid or has expired. Ask an administrator to send a new invitation."
                : "Checking your invitation…"}
            </p>
            {sessionReady ? (
              <Button asChild variant="outline" className="w-full">
                <a href="/auth">Return to staff sign-in</a>
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mt-5 text-muted-foreground">
              Sign in with your approved staff or coach account.
            </p>
            <form onSubmit={signIn} className="mt-7 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-display font-bold uppercase"
              >
                <LockKeyhole />
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
