import {describe,expect,it} from "vitest";
import {formatCompactNaira,formatNaira,parseNairaAmount,parseNairaBudget} from "./money";
describe("Nigerian money utilities",()=>{
 it.each([["5",5_000_000],["7.5",7_500_000],["5m",5_000_000],["5.5M",5_500_000],["\u20A610m",10_000_000],["850k",850_000],["\u20A6850k",850_000],["5,000,000",5_000_000],["5000000",5_000_000]])("parses guided budget %s",(input,expected)=>expect(parseNairaBudget(input)).toBe(expected));
 it.each(["","hello","-5","0","\u20A6","5mm","1e6","Infinity"])("rejects invalid value %s",input=>expect(parseNairaBudget(input)).toBeNull());
 it("keeps generic full-naira parsing separate",()=>{expect(parseNairaAmount("5")).toBe(5);expect(parseNairaAmount("5m")).toBe(5_000_000)});
 it("formats values",()=>{expect(formatNaira(7_500_000)).toContain("7,500,000");expect(formatCompactNaira(7_500_000)).toBe("\u20A67.5m")});
});
