import {loadEnvConfig} from "@next/env";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";

async function main() {
  loadEnvConfig(process.cwd(), true);
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("The email test script is development-only.");
  }
  const args=process.argv.slice(2);
  if(args.some(arg=>arg.startsWith("--")&&arg!=="--send")) throw new Error("Only --send is supported.");
  const selected=args.find(arg=>!arg.startsWith("--")) || "all";
  const {renderEmail}=await import("../lib/email/templates");
  const {appUrl,emailConfig}=await import("../lib/email/config");
  const {sendTransactionalEmail}=await import("../lib/email/send-email");
  if(!emailConfig().testMode) throw new Error("Test recipient routing must be active.");
  // These preview links deliberately contain invalid tokens, not real credentials.
  const samples:import("../lib/email/templates").EmailTemplate[]=[
    {kind:"welcome",name:"Alex Seller",url:appUrl("/cars")},
    {kind:"verification",name:"Alex Seller",url:appUrl("/api/auth/verify-email?token=invalid-preview-token&callbackURL=%2Fverify-email"),expiresInMinutes:60},
    {kind:"password-reset",name:"Alex Seller",url:appUrl("/api/auth/reset-password/invalid-preview-token?callbackURL=%2Freset-password"),expiresInMinutes:60},
    ...(["car-submitted","car-approved","car-rejected","car-resubmitted"] as const).map(kind=>({
      kind,name:"Alex Seller",title:"2020 Toyota Camry",reference:"DEVELOPMENT-PREVIEW",
      url:appUrl("/vendor/cars"),...(kind==="car-rejected"?{reason:"Sample reason: please provide clear vehicle photos."}:{}),
    })),
    {kind:"inquiry",name:"Alex Seller",title:"2020 Toyota Camry",reference:"DEVELOPMENT-PREVIEW",url:appUrl("/vendor/inquiries")},
  ];
  const chosen=samples.filter(sample=>selected==="all"||sample.kind===selected);
  if(!chosen.length) throw new Error("Choose all, welcome, verification, password-reset, car-submitted, car-approved, car-rejected, car-resubmitted, or inquiry.");
  if(args.includes("--send")) {
    // Validate before any sends; never silently fall back to the intended address.
    const {getEmailRecipient}=await import("../lib/email/config");
    getEmailRecipient("seller@example.com");
    if(!process.env.RESEND_API_KEY?.trim()) throw new Error("Set RESEND_API_KEY on the server.");
  }
  const directory=path.join(process.cwd(),".email-previews");
  await mkdir(directory,{recursive:true});
  for(const sample of chosen) {
    const rendered=renderEmail(sample);
    await writeFile(path.join(directory,sample.kind+".html"),rendered.html);
    console.info("Preview written:",sample.kind);
    if(args.includes("--send")) {
      const result=await sendTransactionalEmail({to:"seller@example.com",template:sample.kind,...rendered});
      if(!result.success) throw new Error(result.error);
      // Resend's default limit is low; keep a batch of samples sequential.
      await new Promise(resolve=>setTimeout(resolve,600));
    }
  }
  if(!args.includes("--send")) console.info("Preview only. Add --send to email the selected templates to RESEND_TEST_EMAIL. Preview auth links are not valid tokens.");
}
main().catch(error=>{
  console.error(error instanceof Error?error.message:"Email test failed.");
  process.exitCode=1;
});
