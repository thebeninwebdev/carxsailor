import "server-only";
import {z} from "zod";
type Environment=Record<string,string|undefined>;
const fallbackSender="CarXSailor <onboarding@resend.dev>";
export function emailConfig(env:Environment=process.env){
  const splitAddress=env.EMAIL_FROM_ADDRESS?.trim();
  const splitName=env.EMAIL_FROM_NAME?.trim()||"CarXSailor";
  const configured=env.EMAIL_FROM?.trim()||(splitAddress?`${splitName} <${splitAddress}>`:fallbackSender);
  if(/[\r\n]/.test(configured))throw new Error("Email sender configuration must be a single address.");
  const match=configured.match(/^(.*?)\s*<?([^\s<>]+@[^\s<>]+)>?$/);
  if(!match||!z.email().safeParse(match[2]).success)throw new Error("Email sender configuration is invalid.");
  const address=match[2],name=match[1].trim();
  if(/[<>]/.test(name))throw new Error("Email sender configuration is invalid.");
  return {from:name?`${name} <${address}>`:address};
}
export function getEmailRecipient(to:string){
  if(!z.email().safeParse(to).success)throw new Error("Email recipient is invalid.");
  return to;
}
export function adminNotificationEmail(env:Environment=process.env){
  const email=env.ADMIN_NOTIFICATION_EMAIL?.trim()||env.EMAIL_FROM_ADDRESS?.trim();
  if(!email||!z.email().safeParse(email).success)throw new Error("Set ADMIN_NOTIFICATION_EMAIL or EMAIL_FROM_ADDRESS to a valid admin address. The inquiry remains saved, but no admin notification was sent.");
  return email;
}
export function appUrl(path="/",env:Environment=process.env){
  const configured=env.NEXT_PUBLIC_APP_URL||env.BETTER_AUTH_URL;
  if(!configured&&env.NODE_ENV==="production")throw new Error("Set NEXT_PUBLIC_APP_URL for application email links.");
  const base=new URL(configured||"http://localhost:3000");
  if(!["https:","http:"].includes(base.protocol)||base.username||base.password||base.search||base.hash||base.pathname!=="/")throw new Error("The application URL must be a valid HTTP(S) origin.");
  if(!path.startsWith("/")||path.startsWith("//")||path.includes("\\"))throw new Error("Email application links must use local paths.");
  const url=new URL(path,base);
  if(url.origin!==base.origin)throw new Error("External email redirect is not allowed.");
  return url.toString();
}