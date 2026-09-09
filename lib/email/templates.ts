import "server-only";
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]!));
}
export type ListingEmailKind = "car-submitted" | "car-approved" | "car-rejected" | "car-resubmitted";
export type EmailTemplate =
  | {kind: "welcome"; name?: string; url: string}
  | {kind: "verification" | "password-reset"; name?: string; url: string; expiresInMinutes: number}
  | {kind: ListingEmailKind; name?: string; title: string; reference: string; url?: string; reason?: string}
  | {kind: "inquiry"; name?: string; title: string; reference: string; url: string}
  | {kind: "admin-inquiry"; customerName?: string; customerEmail: string; title: string; price: string; message: string; reference: string; listingReference: string; submittedAt: string; adminUrl: string; listingUrl: string};
export type RenderedEmail = {subject: string; html: string; text: string};
function layout(subject: string, paragraphs: string[], cta?: {label: string; url: string}, secondaryCta?: {label: string; url: string}): RenderedEmail {
  for(const link of [cta,secondaryCta])if(link&&!["https:", "http:"].includes(new URL(link.url).protocol))throw new Error("Invalid email CTA.");
  const footer = "CarXSailor account and listing notifications. If you need help, return to your account.";
  const button = cta ? `<p style="margin:28px 0"><a href="${escapeHtml(cta.url)}" style="background:#d7f25c;color:#163f31;text-decoration:none;padding:14px 22px;border-radius:6px;display:inline-block;font-weight:bold">${escapeHtml(cta.label)}</a>${secondaryCta?` <a href="${escapeHtml(secondaryCta.url)}" style="color:#245c47;text-decoration:underline;padding:14px 10px;display:inline-block;font-weight:bold">${escapeHtml(secondaryCta.label)}</a>`:""}</p><p style="font-size:12px;color:#58655f;word-break:break-all">Or open this link:<br><a href="${escapeHtml(cta.url)}" style="color:#245c47">${escapeHtml(cta.url)}</a></p>` : "";
  return {
    subject,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f1f5f2;font-family:Arial,Helvetica,sans-serif;color:#20352b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:10px"><tr><td style="padding:26px 28px;background:#163f31;color:#d7f25c;font-size:24px;font-weight:bold">CarXSailor</td></tr><tr><td style="padding:28px"><h1 style="font-size:24px;line-height:1.3;margin:0 0 24px">${escapeHtml(subject)}</h1>${paragraphs.map(p=>`<p style="font-size:16px;line-height:1.65;white-space:pre-line">${escapeHtml(p)}</p>`).join("")}${button}</td></tr><tr><td style="padding:22px 28px;border-top:1px solid #e3e9e5;font-size:12px;line-height:1.6;color:#68756f">${footer}<br>&copy; ${new Date().getFullYear()} CarXSailor</td></tr></table></td></tr></table></body></html>`,
    text: [subject, ...paragraphs, ...(cta ? [cta.label + ": " + cta.url] : []), ...(secondaryCta ? [secondaryCta.label + ": " + secondaryCta.url] : []), footer, `Copyright ${new Date().getFullYear()} CarXSailor`].join("\n\n"),
  };
}
export function renderEmail(props: EmailTemplate): RenderedEmail {
  const name="name" in props?props.name:undefined;
  const greeting=name?.trim()?"Hi "+name.trim().split(/\s+/)[0]+",":"Hello,";
  switch (props.kind) {
    case "welcome":
      return layout("Welcome to CarXSailor", [greeting, "Your account is now ready.", "Discover cars, compare your options, and save the vehicles that interest you. We're building a better way to find the right car based on what matters to you."], {label:"Explore CarXSailor", url:props.url});
    case "verification":
      return layout("Verify your CarXSailor email", [greeting, "Please verify your email address to confirm that it belongs to you.", `This verification link expires in ${props.expiresInMinutes} minutes. If you did not create this account, you can ignore this email.`], {label:"Verify Email", url:props.url});
    case "password-reset":
      return layout("Reset your CarXSailor password", [greeting, "We received a request to reset your CarXSailor password.", `This reset link expires in ${props.expiresInMinutes} minutes. If you didn't request this, you can ignore this email. Your password will stay the same.`], {label:"Reset Password", url:props.url});
    case "car-submitted":
    case "car-resubmitted":
      return layout(props.kind === "car-submitted" ? "Your CarXSailor listing has been submitted" : "Your CarXSailor listing has been resubmitted", [greeting, `Your listing for ${props.title} has been submitted successfully and is awaiting review.`, "Listing reference: " + props.reference, "You can check its status in your seller workspace."], props.url ? {label:"View Listing", url:props.url} : undefined);
    case "car-approved":
      return layout("Your CarXSailor listing has been approved", [greeting, `Good news - your ${props.title} listing has been approved and is now active on CarXSailor.`, "Listing reference: " + props.reference], props.url ? {label:"View Your Listing", url:props.url} : undefined);
    case "car-rejected":
      return layout("Update regarding your CarXSailor listing", [greeting, `Your listing for ${props.title} was not approved and needs changes before it can be published.`, "Listing reference: " + props.reference, ...(props.reason ? ["Reason: " + props.reason] : []), "Review and edit the listing in your seller workspace. Saving your changes will submit it for review again."], props.url ? {label:"Review Listing", url:props.url} : undefined);
    case "inquiry":
      return layout("New inquiry about your CarXSailor listing", [greeting, `You have a new inquiry about ${props.title}.`, "Listing reference: " + props.reference, "Sign in to your seller workspace to read the inquiry."], {label:"View Inquiry", url:props.url});
    case "admin-inquiry":
      return layout(`New Car Inquiry - ${props.title}`, ["New inquiry received",`A customer is interested in ${props.title}.`,`Price: ${props.price}`,`Inquiry reference: ${props.reference}`,`Customer: ${props.customerName?.trim()||"Name not provided"}`,`Email: ${props.customerEmail}`,`Message:\n${props.message}`,`Listing reference: ${props.listingReference}`,`Submitted: ${props.submittedAt}`], {label:"View Inquiry",url:props.adminUrl}, {label:"View car listing",url:props.listingUrl});
  }
}
