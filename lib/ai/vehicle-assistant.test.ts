import {describe,expect,it} from "vitest";
import {buildVehicleAssistantContext,vehicleAssistantRequestSchema} from "./vehicle-assistant";

describe("vehicle assistant safety",()=>{
  const context=buildVehicleAssistantContext({year:2021,make:"Toyota",model:"Camry",price:18_270_000,mileage:86_000,transmission:"AUTOMATIC",fuelType:"PETROL",bodyType:"SEDAN",location:{city:"Benin City",state:"Edo State"},inspectionStatus:"VENDOR_REPORTED",condition:{engine:88},features:["Reverse camera"],rental:{enabled:true,pricePerDay:65_000}});
  it("uses public listing data while excluding private fields",()=>{expect(context).toContain("2021 Toyota Camry");expect(context).toContain("₦18,270,000");expect(context).toContain("₦68,250/day");expect(context).toContain("Approved CarXSailor Verified Seller");expect(context).not.toMatch(/VIN:|phone number|NIN:|userId/i)});
  it("validates question limits and caps follow-up history",()=>{expect(vehicleAssistantRequestSchema.safeParse({vehicleId:"a".repeat(24),question:"ok"}).success).toBe(false);expect(vehicleAssistantRequestSchema.safeParse({vehicleId:"a".repeat(24),question:"Good buy?",history:Array.from({length:7},()=>({role:"user",content:"Hello"}))}).success).toBe(false);expect(vehicleAssistantRequestSchema.safeParse({vehicleId:"a".repeat(24),question:"Good buy?",history:Array.from({length:6},()=>({role:"assistant",content:"Reply"}))}).success).toBe(true)});
});
