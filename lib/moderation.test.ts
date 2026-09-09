import {describe,expect,it} from "vitest";
import {listingTransition} from "./moderation";
import type {VehicleStatus} from "@/types";
describe("listing moderation transitions",()=>{
  it("publishes pending listings with the canonical ACTIVE status",()=>expect(listingTransition("PENDING_REVIEW","APPROVE_LISTING")).toEqual({status:"ACTIVE",isFeatured:false}));
  it("rejects pending listings without publishing them",()=>expect(listingTransition("PENDING_REVIEW","REJECT_LISTING")).toEqual({status:"REJECTED",isFeatured:false}));
  it.each<VehicleStatus>(["DRAFT","ACTIVE","REJECTED","SUSPENDED","SOLD","ARCHIVED"])("does not approve %s listings",status=>expect(()=>listingTransition(status,"APPROVE_LISTING")).toThrow());
  it("removes featured state when suspending",()=>expect(listingTransition("ACTIVE","SUSPEND_LISTING",true)).toEqual({status:"SUSPENDED",isFeatured:false}));
  it("does not feature unavailable inventory",()=>expect(()=>listingTransition("REJECTED","FEATURE_LISTING")).toThrow());
  it("rejects duplicate feature operations",()=>expect(()=>listingTransition("ACTIVE","FEATURE_LISTING",true)).toThrow());
});
