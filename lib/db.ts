import "server-only";import mongoose from "mongoose";import {MongoClient} from "mongodb";
const uri=process.env.MONGODB_URI||"mongodb://127.0.0.1:27017/carxsailor";
const globalDb=globalThis as typeof globalThis&{mongoosePromise?:Promise<typeof mongoose>;mongoClient?:MongoClient};
export function connectMongoose(){if(!globalDb.mongoosePromise)globalDb.mongoosePromise=mongoose.connect(uri,{bufferCommands:false}).catch(error=>{globalDb.mongoosePromise=undefined;throw error});return globalDb.mongoosePromise}
export const mongoClient=globalDb.mongoClient??new MongoClient(uri);if(process.env.NODE_ENV!=="production")globalDb.mongoClient=mongoClient;
export const authDatabase=mongoClient.db();

export async function connectMongoClient(){
  // The driver shares concurrent attempts and reconnects a closed topology.
  // Do not cache a settled promise: later requests must be able to reconnect.
  await mongoClient.connect();
  return mongoClient;
}
