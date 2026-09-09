import {describe,it,expect} from "vitest";
import {preferenceSchema,defaultPreference} from "./preferences";
import {scoreCarForPreferences} from "./engine";
import {demoVehicles} from "@/lib/demo-data";
describe("guided preference validation",()=>{
 it("rejects invalid budgets and unknown keys, then caps legacy priorities",()=>{expect(preferenceSchema.safeParse({...defaultPreference,budget:{min:20,max:10}}).success).toBe(false);expect(preferenceSchema.safeParse({...defaultPreference,unknownQuery:{$where:"bad"}}).success).toBe(false);const legacy=preferenceSchema.parse({...defaultPreference,priorities:{...defaultPreference.priorities,reliability:1,comfort:1,performance:1,practicality:1}});expect(Object.values(legacy.priorities).filter(Boolean)).toHaveLength(3)});
 it("accepts budget-only decisions",()=>expect(preferenceSchema.safeParse({...defaultPreference,budget:{max:10_000_000}}).success).toBe(true));
 it("does not call a weak rating a strength",()=>{const result=scoreCarForPreferences({...demoVehicles[0],reliabilityRating:20},{...defaultPreference,priorities:{...defaultPreference.priorities,reliability:1}});expect(result.reasons.some(x=>x.startsWith("Reliability"))).toBe(false);expect(result.tradeOffs.some(x=>x.includes("Reliability rating: 20/100"))).toBe(true)});
});
