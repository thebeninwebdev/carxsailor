import {expect,it} from "vitest";
import {adminWhatsAppNumber,buildWhatsAppInquiryUrl} from "./whatsapp";
const vehicle={year:2018,make:"Toyota",model:"Camry",price:"₦15,500,000"};
it("builds an encoded contextual WhatsApp URL before submission",()=>{
  const result=new URL(buildWhatsAppInquiryUrl({vehicle,listingUrl:"https://carxsailor.example/cars/toyota-camry"}));
  expect(result.origin+result.pathname).toBe("https://wa.me/2349155276978");
  expect(result.searchParams.get("text")).toContain("2018 Toyota Camry\nPrice: ₦15,500,000");
  expect(result.searchParams.get("text")).toContain("https://carxsailor.example/cars/toyota-camry");
  expect(result.searchParams.get("text")).not.toContain("Inquiry reference:");
});
it("includes the saved reference in the fast-track message",()=>{
  const result=new URL(buildWhatsAppInquiryUrl({vehicle,listingUrl:"https://carxsailor.example/cars/toyota-camry",inquiryReference:"CX-INQ-A83F2"}));
  expect(result.searchParams.get("text")).toContain("Inquiry reference: CX-INQ-A83F2");
  expect(result.searchParams.get("text")).toContain("fast-track my inquiry");
});
it("normalizes a configured public number",()=>{
  expect(adminWhatsAppNumber({NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER:"+234 915 527 6978"})).toBe("2349155276978");
});