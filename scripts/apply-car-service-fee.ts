import mongoose from "mongoose";
import {connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {calculateVehiclePrice} from "@/lib/pricing";
async function main(){await connectMongoose();const cars=await VehicleModel.find({sellerPrice:{$exists:false}}).select("_id price").lean();const operations=[];for(const car of cars){if(!Number.isFinite(car.price)||car.price<=0){console.error(`Skipping ${car._id}: invalid price`);continue}operations.push({updateOne:{filter:{_id:car._id,sellerPrice:{$exists:false}},update:{$set:calculateVehiclePrice(car.price)}}})}const result=operations.length?await VehicleModel.bulkWrite(operations,{ordered:false}):undefined;console.log(`Car service-fee migration: ${result?.modifiedCount??0} updated, ${cars.length-(result?.modifiedCount??0)} skipped.`);await mongoose.disconnect()}
main().catch(error=>{console.error("Car service-fee migration failed",error);mongoose.disconnect().finally(()=>process.exit(1))});
