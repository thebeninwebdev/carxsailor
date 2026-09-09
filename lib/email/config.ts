import "server-only";
import {z} from "zod";
type Environment = Record<string, string | undefined>;
const developmentSender = "CarXSailor <onboarding@resend.dev>";
export function emailConfig(env: Environment = process.env) {
  const configured = env.EMAIL_FROM?.trim() || developmentSender;
  if (/[\r\n]/.test(configured)) throw new Error("EMAIL_FROM must be a single sender address.");
  const match = configured.match(/^(.*?)\s*<?([^\s<>]+@[^\s<>]+)>?$/);
  if (!match || !z.email().safeParse(match[2]).success) throw new Error("EMAIL_FROM is invalid.");
  const address = match[2], name = match[1].trim();
  if (/[<>]/.test(name)) throw new Error("EMAIL_FROM is invalid.");
  const from = name ? `${name} <${address}>` : address;
  // Vercel preview builds use NODE_ENV=production. The development sender
  // remains restricted even on a production deployment until it is replaced.
  const testMode = env.NODE_ENV !== "production"
    || (Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== "production")
    || address.toLowerCase().endsWith("@resend.dev");
  return {from, testMode};
}
export function getEmailRecipient(to: string, env: Environment = process.env) {
  if (!z.email().safeParse(to).success) throw new Error("Intended email recipient is invalid.");
  if (!emailConfig(env).testMode) return to;
  const testEmail = env.RESEND_TEST_EMAIL?.trim();
  if (!testEmail || !z.email().safeParse(testEmail).success)
    throw new Error("Set RESEND_TEST_EMAIL to a valid Resend-approved test recipient. No email was sent.");
  return testEmail;
}
export function adminNotificationEmail(env: Environment = process.env) {
  const email=env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if(!email||!z.email().safeParse(email).success)throw new Error("Set ADMIN_NOTIFICATION_EMAIL to a valid admin address. The inquiry remains saved, but no admin notification was sent.");
  return email;
}
export function appUrl(path = "/", env: Environment = process.env) {
  const configured = env.NEXT_PUBLIC_APP_URL || env.BETTER_AUTH_URL;
  if (!configured && env.NODE_ENV === "production") throw new Error("Set NEXT_PUBLIC_APP_URL for application email links.");
  const base = new URL(configured || "http://localhost:3000");
  if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== "/")
    throw new Error("The application URL must be a valid HTTP(S) origin.");
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    throw new Error("Email application links must use local paths.");
  const url = new URL(path, base);
  if (url.origin !== base.origin) throw new Error("External email redirect is not allowed.");
  return url.toString();
}
