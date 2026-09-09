import "server-only";
import {APIError} from "better-auth/api";
import {renderEmail} from "./templates";
import {sendTransactionalEmail} from "./send-email";
export const authLinkExpiresIn = 3600;
type AuthEmail = {user: {email: string; name?: string}; url: string};
export async function sendAuthEmail(kind: "verification" | "password-reset", {user, url}: AuthEmail) {
  // Better Auth owns and validates the token and callback URL. Preserve its URL.
  const result = await sendTransactionalEmail({
    to:user.email, template:kind,
    ...renderEmail({kind, name:user.name, url, expiresInMinutes:authLinkExpiresIn / 60}),
  });
  if (!result.success) throw new APIError("SERVICE_UNAVAILABLE", {
    message:"We could not send the email. Please try again later or contact the site administrator.",
    code:"EMAIL_DELIVERY_FAILED",
  });
}
