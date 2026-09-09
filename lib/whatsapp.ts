const fallbackWhatsAppNumber="2349155276978";
const configuredWhatsAppNumber=process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER;

type WhatsAppVehicle={year:number;make:string;model:string;price:string};
type WhatsAppInquiryOptions={vehicle:WhatsAppVehicle;listingUrl:string;inquiryReference?:string};

export function adminWhatsAppNumber(env:Record<string,string|undefined>={NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER:configuredWhatsAppNumber}){
  const number=(env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER?.trim()||fallbackWhatsAppNumber).replace(/\D/g,"");
  if(!/^\d{8,15}$/.test(number))throw new Error("NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER must contain 8 to 15 digits.");
  return number;
}

export function buildWhatsAppInquiryUrl({vehicle,listingUrl,inquiryReference}:WhatsAppInquiryOptions){
  const url=new URL(listingUrl);
  if(!["http:","https:"].includes(url.protocol))throw new Error("Listing URL must use HTTP(S).");
  const intro=inquiryReference?"I just submitted an inquiry about":"I'm interested in this vehicle";
  const closing=inquiryReference?"I'd like to fast-track my inquiry.":"I'd like to know more about it.";
  const lines=["Hello CarXSailor, "+intro+":","",`${vehicle.year} ${vehicle.make} ${vehicle.model}`,`Price: ${vehicle.price}`];
  if(inquiryReference)lines.push("",`Inquiry reference: ${inquiryReference}`);
  lines.push("","Listing:",url.toString(),"",closing);
  return `https://wa.me/${adminWhatsAppNumber()}?text=${encodeURIComponent(lines.join("\n"))}`;
}