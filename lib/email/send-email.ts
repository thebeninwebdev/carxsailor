import "server-only";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {emailConfig, getEmailRecipient} from "./config";
import {getResendClient} from "./resend";
import {escapeHtml, type RenderedEmail, type EmailTemplate} from "./templates";
export type SendEmailOptions = RenderedEmail & {
  to: string; template: EmailTemplate["kind"]; replyTo?: string; idempotencyKey?: string;
};
export type SendEmailResult = {success: true; id: string} | {success: false; error: string};
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  let phase: "configuration" | "provider" = "configuration";
  try {
    const {from, testMode} = emailConfig();
    const to = getEmailRecipient(options.to);
    if (options.replyTo && !z.email().safeParse(options.replyTo).success) throw new Error("Invalid reply-to email.");
    const client = getResendClient();
    const notice = "CarXSailor development email. Intended recipient: " + options.to;
    const html = testMode ? options.html.replace(/(<body[^>]*>)/i, `$1<div style="padding:12px;background:#fff3cd;color:#493d13;font:13px Arial,sans-serif">${escapeHtml(notice)}</div>`) : options.html;
    phase = "provider";
    const {data, error} = await client.emails.send({
      from, to, subject: (testMode ? "[TEST] " : "") + options.subject,
      html, text: testMode ? notice + "\n\n" + options.text : options.text,
      ...(options.replyTo && !testMode ? {replyTo:options.replyTo} : {}),
    }, {idempotencyKey: options.idempotencyKey || randomUUID()});
    if (error || !data?.id) {
      console.error("[Email] Provider rejected email", {template:options.template, code:error?.name || "missing_id"});
      return {success:false, error:"Email could not be sent. Please try again later."};
    }
    console.info("[Email]", {template:options.template, ...(testMode ? {intendedRecipient:options.to, actualRecipient:to} : {}), resendId:data.id});
    return {success:true, id:data.id};
  } catch (error) {
    console.error("[Email] Send failed", {template:options.template, phase,
      ...(phase === "configuration" && error instanceof Error ? {message:error.message} : {})});
    return {success:false, error:"Email could not be sent. Please try again later."};
  }
}
