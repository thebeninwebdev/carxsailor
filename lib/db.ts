import "server-only";import mongoose from "mongoose";import {MongoClient} from "mongodb";
const uri=process.env.MONGODB_URI||"mongodb://127.0.0.1:27017/carxsailor";
const globalDb=globalThis as typeof globalThis&{mongoosePromise?:Promise<typeof mongoose>;mongoClient?:MongoClient};
export function connectMongoose(){if(!globalDb.mongoosePromise)globalDb.mongoosePromise=mongoose.connect(uri,{bufferCommands:false});return globalDb.mongoosePromise}
export const mongoClient=globalDb.mongoClient??new MongoClient(uri);if(process.env.NODE_ENV!=="production")globalDb.mongoClient=mongoClient;
export const authDatabase=mongoClient.db();
