import { z } from "zod";
export {criteria,defaultPreference} from "./criteria";

const weight = z.number().min(0).max(1);
export const preferenceSchema = z.object({
  budget:z.object({min:z.number().nonnegative().optional(),max:z.number().positive().optional()}).refine(b=>b.min===undefined||b.max===undefined||b.min<=b.max,"Minimum exceeds maximum").optional(),
  transmission:z.enum(["AUTOMATIC","MANUAL","NO_PREFERENCE"]).optional(),
  preferredBodyTypes:z.array(z.string().max(30)).max(10).optional(),
  preferredMakes:z.array(z.string().max(60)).max(10).optional(),
  excludedMakes:z.array(z.string().max(60)).max(10).optional(),
  year:z.object({min:z.number().int().min(1950).optional(),max:z.number().int().optional()}).optional(),
  mileage:z.object({maximum:z.number().nonnegative()}).optional(),
  engineHealth:z.object({minimum:z.number().min(0).max(100)}).optional(),
  seatingCapacity:z.object({minimum:z.number().int().min(1).max(50)}).optional(),
  priorities:z.object({fuelEconomy:weight,reliability:weight,maintenance:weight,comfort:weight,performance:weight,practicality:weight,appearance:weight}),
  usages:z.array(z.string().max(50)).max(10).default([]),
  interpretedSummary:z.string().max(500).default("Your selected budget, requirements and priorities."),
});
