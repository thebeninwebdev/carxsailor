import {pageMetadata} from "@/lib/seo";
export const metadata = pageMetadata("Contact CarXSailor", "Contact CarXSailor for help with car discovery, decision support, your account or selling a vehicle on our Nigerian marketplace.", "/contact");
import {ContactForm} from "@/components/forms/contact-form";
export default function Page(){return <div className="container max-w-2xl py-20"><p className="eyebrow">Contact</p><h1 className="display mt-4 text-5xl">How can we help?</h1><ContactForm/></div>;}
