import "server-only";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {emailConfig,getEmailRecipient} from "./config";
import {getResendClient} from "./resend";
import type {RenderedEmail,EmailTemplate} from "./templates";
export type SendEmailOptions=RenderedEmail&{to:string;template:EmailTemplate["kind"];replyTo?:string;idempotencyKey?:string};
export type SendEmailResult={success:true;id:string}|{success:false;error:string};
export async function sendTransactionalEmail(options:SendEmailOptions):Promise<SendEmailResult>{
  let phase:"configuration"|"provider"="configuration";
  try{
    const {from}=emailConfig();
    const to=getEmailRecipient(options.to);
    if(options.replyTo&&!z.email().safeParse(options.replyTo).success)throw new Error("Invalid reply-to email.");
    const client=getResendClient();phase="provider";
    const {data,error}=await client.emails.send({from,to,subject:options.subject,html:options.html,text:options.text,...(options.replyTo?{replyTo:options.replyTo}:{})},{idempotencyKey:options.idempotencyKey||randomUUID()});
    if(error||!data?.id){console.error("[Email] Provider rejected email",{template:options.template,code:error?.name||"missing_id"});return {success:false,error:"Email could not be sent. Please try again later."};}
    console.info("[Email]",{template:options.template,resendId:data.id});
    return {success:true,id:data.id};
  }catch(error){console.error("[Email] Send failed",{template:options.template,phase,...(phase==="configuration"&&error instanceof Error?{message:error.message}:{})});return {success:false,error:"Email could not be sent. Please try again later."};}
}