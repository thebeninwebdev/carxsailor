import {describe,it,expect} from "vitest";
import {safeNext} from "./safe-next";
describe("authentication return paths",()=>{
  it("preserves the requested page, query and results anchor",()=>expect(safeNext("/car-adviser?resume=1#results")).toBe("/car-adviser?resume=1#results"));
  it.each(["https://evil.example","//evil.example","/\\evil.example","/\nevil.example",undefined])("rejects unsafe destination %s",value=>expect(safeNext(value)).toBe("/dashboard"));
});

import {postLoginDestination} from "./safe-next";
describe("role destinations",()=>{
 it("routes admins to admin",()=>expect(postLoginDestination("ADMIN",false)).toBe("/admin"));
 it("routes seller profiles to vendor even with a BUYER auth role",()=>expect(postLoginDestination("BUYER",true)).toBe("/vendor"));
 it("routes buyers to their garage",()=>expect(postLoginDestination("BUYER",false)).toBe("/dashboard"));
 it("keeps safe callbacks",()=>expect(postLoginDestination("BUYER",false,"/dashboard/favorites?sort=new")).toBe("/dashboard/favorites?sort=new"));
 it("rejects unauthorized admin callbacks",()=>expect(postLoginDestination("BUYER",false,"/admin/cars")).toBe("/dashboard"));
 it.each(["/login","/register?next=/login","/api/auth/sign-out","https://evil.test","//evil.test"])("rejects redirect loops or unsafe paths %s",path=>expect(postLoginDestination("ADMIN",false,path)).toBe("/admin"));
});
