import {expect,it} from "vitest";
import {VendorProfileModel} from "@/models/VendorProfile";
it("excludes NIN and contact details from default queries",()=>{expect(VendorProfileModel.schema.path("nin").options.select).toBe(false);expect(VendorProfileModel.schema.path("phoneNumber").options.select).toBe(false);});
