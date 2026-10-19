import {describe,expect,it} from "vitest";
import {CAR_SERVICE_FEE_RATE,calculateVehiclePrice} from "./pricing";
describe("vehicle pricing",()=>{it("adds the standard fee once",()=>expect(calculateVehiclePrice(10_000_000)).toEqual({sellerPrice:10_000_000,serviceFeeRate:CAR_SERVICE_FEE_RATE,serviceFeeAmount:150_000,price:10_150_000}));it("uses integer Naira",()=>expect(calculateVehiclePrice(5_000_000)).toMatchObject({serviceFeeAmount:75_000,price:5_075_000}));});
