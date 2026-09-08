import {describe,it,expect} from "vitest";
import {safeNext} from "./safe-next";
describe("authentication return paths",()=>{
  it("preserves the requested page, query and results anchor",()=>expect(safeNext("/car-adviser?resume=1#results")).toBe("/car-adviser?resume=1#results"));
  it.each(["https://evil.example","//evil.example","/\\evil.example","/\nevil.example",undefined])("rejects unsafe destination %s",value=>expect(safeNext(value)).toBe("/dashboard"));
});
