import mongoose from "mongoose";
import {connectMongoose} from "@/lib/db";
import {calculateVehiclePrice} from "@/lib/pricing";
import {VehicleModel} from "@/models/Vehicle";

async function main(){await connectMongoose();const cars=await VehicleModel.find({sellerPrice:{$gt:0}}).select("_id sellerPrice").lean();const operations=cars.map(car=>({updateOne:{filter:{_id:car._id},update:{$set:calculateVehiclePrice(car.sellerPrice)}}}));const result=operations.length?await VehicleModel.bulkWrite(operations,{ordered:false}):undefined;console.log(`Car service-fee rate update: ${result?.modifiedCount??0} listings updated.`);await mongoose.disconnect()}
main().catch(error=>{console.error("Car service-fee rate update failed",error);mongoose.disconnect().finally(()=>process.exit(1))});
