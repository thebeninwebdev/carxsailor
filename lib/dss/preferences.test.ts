import {describe,it,expect} from "vitest";
import {preferenceSchema,defaultPreference} from "./preferences";
import {rankVehicles} from "./engine";
import {demoVehicles} from "@/lib/demo-data";
describe("guided decision validation and evidence",()=>{
  it("rejects invalid budgets and out-of-range priorities",()=>{
    expect(preferenceSchema.safeParse({...defaultPreference,budget:{min:20,max:10}}).success).toBe(false);
    expect(preferenceSchema.safeParse({...defaultPreference,priorities:{...defaultPreference.priorities,reliability:2}}).success).toBe(false);
  });
  it("does not call a weak, heavily weighted rating a strength",()=>{
    const vehicle={...demoVehicles[0],reliabilityRating:20};
    const result=rankVehicles([vehicle],defaultPreference).ranked[0];
    expect(result.reasons.some(x=>x.startsWith("Reliability"))).toBe(false);
    expect(result.tradeOffs.some(x=>x.includes("Reliability: 20/100"))).toBe(true);
  });
  it("flags missing evidence and discloses unverified condition",()=>{
    const vehicle={...demoVehicles[0],reliabilityRating:undefined,inspectionStatus:"VENDOR_REPORTED" as const};
    const result=rankVehicles([vehicle],defaultPreference).ranked[0];
    expect(result.tradeOffs).toContain("Reliability: no rating supplied");
    expect(result.tradeOffs).toContain("Condition has not been independently verified");
  });
});
