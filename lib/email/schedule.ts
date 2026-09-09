import "server-only";
import {after} from "next/server";
// Call only after the database commit and cache invalidation. Next keeps work
// alive on Vercel after the response; bare unawaited promises do not.
export function scheduleNotification(template: string, task: () => Promise<unknown>): void {
  try {
    after(async () => {
      try { await task(); }
      catch { console.error("[Email] Notification failed", {template}); }
    });
  } catch {
    console.error("[Email] Could not schedule notification", {template});
  }
}
