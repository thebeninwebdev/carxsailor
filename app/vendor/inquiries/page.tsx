import {MessageCircle} from "lucide-react";
import {requireVendor} from "@/lib/auth";
import {appUrl} from "@/lib/email/config";
import {money} from "@/lib/utils";
import {buildSellerInquiryAdminWhatsAppUrl} from "@/lib/whatsapp";
import {VendorProfileModel} from "@/models/VendorProfile";
import {InquiryModel} from "@/models/Inquiry";
import {VehicleModel} from "@/models/Vehicle";

export default async function Page(){
  const user=await requireVendor();
  const vendor=await VendorProfileModel.findOne({userId:user.id,status:"APPROVED"}).lean();
  const inquiries=vendor?await InquiryModel.find({vendorId:String(vendor._id)}).sort({createdAt:-1}).lean():[];
  const ids=inquiries.map(row=>row.vehicleId).filter(id=>/^[a-f\d]{24}$/i.test(id));
  const cars=await VehicleModel.find({_id:{$in:ids}}).select("title slug year make model price").lean();
  const vehicles=new Map(cars.map(car=>[String(car._id),car]));

  return <div>
    <h2 className="text-xl font-bold">Buyer inquiries</h2>
    {inquiries.length?<div className="mt-6 grid gap-3">{inquiries.map(row=>{
      const vehicle=vehicles.get(row.vehicleId);
      const reference=String(row.reference||row._id);
      const whatsappUrl=vehicle&&row.status==="NEW"?buildSellerInquiryAdminWhatsAppUrl({
        vehicle:{year:vehicle.year,make:vehicle.make,model:vehicle.model,price:money(vehicle.price)},
        listingUrl:appUrl("/cars/"+encodeURIComponent(vehicle.slug)),
        inquiryReference:reference,
      }):null;
      return <article key={String(row._id)} className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold">{vehicle?.title||"Vehicle inquiry"}</h3>
            <p className="mt-2 text-sm">{reference} · {row.kind.replaceAll("_"," ")} · {row.status}</p>
          </div>
          {row.status==="NEW"&&<span className="pill bg-green-50 text-green-800">New inquiry</span>}
        </div>
        <p className="mt-4">{row.message}</p>
        {whatsappUrl&&<div className="mt-5 border-t border-[#e4e9e5] pt-5">
          <p className="text-sm text-[#68756f]">Need help responding to this inquiry?</p>
          <a className="btn btn-light mt-3" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`Contact CarXSailor admin on WhatsApp about inquiry ${reference}`}>
            <MessageCircle size={17}/>
            Contact admin on WhatsApp
          </a>
        </div>}
      </article>;
    })}</div>:<p className="card mt-6 p-8">No buyer inquiries yet.</p>}
  </div>;
}