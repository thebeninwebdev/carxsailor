import "server-only";
import {Resend} from "resend";
let client: Resend | undefined;
// Lazy initialization lets builds and unrelated requests run without credentials.
export function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error("Set RESEND_API_KEY on the server. No email was sent.");
  client ??= new Resend(key);
  return client;
}
