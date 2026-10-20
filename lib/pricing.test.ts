import {describe,expect,it} from "vitest";
import {CAR_SERVICE_FEE_RATE,RENTAL_SERVICE_FEE_RATE,calculateRentalPrice,calculateVehiclePrice} from "./pricing";
describe("vehicle pricing",()=>{it("adds the 2% standard fee once",()=>expect(calculateVehiclePrice(10_000_000)).toEqual({sellerPrice:10_000_000,serviceFeeRate:CAR_SERVICE_FEE_RATE,serviceFeeAmount:200_000,price:10_200_000}));it("uses integer Naira",()=>expect(calculateVehiclePrice(5_000_000)).toMatchObject({serviceFeeAmount:100_000,price:5_100_000}));});
describe("rental pricing",()=>{it("adds the 5% rental fee once",()=>expect(calculateRentalPrice(100_000)).toEqual({pricePerDay:100_000,serviceFeeRate:RENTAL_SERVICE_FEE_RATE,serviceFeeAmount:5_000,price:105_000}));});
