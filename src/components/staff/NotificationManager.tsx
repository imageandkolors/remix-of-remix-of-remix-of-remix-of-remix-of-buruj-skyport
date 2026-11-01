import { useState } from "react";
import { Bell, Send } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listAdminNotifications, sendNotification } from "@/lib/notifications.functions";
import { toast } from "sonner";
import { adminLoadErrorMessage, safeAdminErrorMessage } from "@/lib/admin-ui-errors";

export function NotificationManager() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [audience, setAudience] = useState<"public" | "admin">("public");
  const [sending, setSending] = useState(false);
  const notifications = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => listAdminNotifications(),
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    try {
      const result = await sendNotification({ data: { title, body, url, audience } });
      toast.success(
        result.pushConfigured
          ? `Notification sent to ${result.delivered} subscribed device(s)`
          : "Notification saved; add VAPID keys to deliver push alerts",
      );
      setTitle("");
      setBody("");
      setUrl("/");
      await queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (error) {
      toast.error(safeAdminErrorMessage(error, "Could not send notification."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      {notifications.isError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between xl:col-span-2"
        >
          <p className="min-w-0 break-words">
            {adminLoadErrorMessage(notifications.error, "admin notifications")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => void notifications.refetch()}
            disabled={notifications.isFetching}
          >
            {notifications.isFetching ? "Retrying…" : "Retry"}
          </Button>
        </div>
      ) : null}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-sky/10 p-2 text-sky">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Push notifications</p>
            <h2 className="text-lg font-semibold">Send an academy update</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscribers receive this even when the PWA is closed.
            </p>
          </div>
        </div>
        <form className="mt-5 space-y-3" onSubmit={submit}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            maxLength={80}
            required
          />
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Message"
            maxLength={240}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Link, e.g. /news"
              pattern="/.*"
              required
            />
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value as "public" | "admin")}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="public">All subscribers</option>
              <option value="admin">Admin devices only</option>
            </select>
          </div>
          <Button type="submit" disabled={sending || notifications.isError}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Sending…" : "Send notification"}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <p className="text-sm font-medium text-muted-foreground">Admin alerts</p>
        <h2 className="text-lg font-semibold">Recent notifications</h2>
        <div className="mt-4 space-y-3">
          {notifications.isLoading && !notifications.data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : notifications.isError && !notifications.data ? (
            <p className="text-sm text-muted-foreground">
              Notification history is unavailable. Resolve the error above and retry.
            </p>
          ) : notifications.data?.length ? (
            notifications.data.slice(0, 6).map((notification) => (
              <div
                key={notification.id}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <p className="font-medium">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : !notifications.isLoading ? (
            <p className="text-sm text-muted-foreground">No admin notifications yet.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
