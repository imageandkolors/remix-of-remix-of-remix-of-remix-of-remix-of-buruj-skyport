import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { isPushSupported, subscribeToPush } from "@/lib/push-client";
import { getPushConfig } from "@/lib/notifications.functions";
import { toast } from "sonner";

const DISMISSED_KEY = "bsa-push-prompt-dismissed";

export function PushPrompt() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const isAdmin =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/squad") ||
    pathname.startsWith("/content") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/page-settings") ||
    pathname.startsWith("/manage-programmes");

  useEffect(() => {
    let cancelled = false;
    if (!isPushSupported() || Notification.permission === "denied") return;
    getPushConfig()
      .then(({ publicKey }) => {
        if (!cancelled && publicKey && !localStorage.getItem(DISMISSED_KEY)) {
          window.setTimeout(() => setVisible(true), 3500);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      await subscribeToPush(isAdmin ? "admin" : "public");
      toast.success(isAdmin ? "Admin notifications enabled" : "Buruj updates enabled");
      dismiss();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enable notifications");
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl md:bottom-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notifications prompt"
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-5">
        <div className="rounded-xl bg-sky/10 p-2 text-sky">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-bold uppercase">
            {isAdmin ? "Enable admin alerts" : "Stay up to date"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Get instant alerts when a new enquiry, trial or application arrives."
              : "Get Buruj announcements and important academy updates, even when the app is closed."}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={enable} disabled={busy}>
          <Bell className="mr-1 h-4 w-4" />
          {busy ? "Enabling…" : "Enable notifications"}
        </Button>
        <Button variant="outline" onClick={dismiss} disabled={busy}>
          Not now
        </Button>
      </div>
    </div>
  );
}
