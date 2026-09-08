import "server-only";
import {connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import type {Vehicle} from "@/types";
type Row=Record<string,unknown>&{_id:unknown;vendorId:unknown;createdAt?:Date};
function serialize(row:Row):Vehicle{return JSON.parse(JSON.stringify({...row,isDemo:!!row.seedTag,id:String(row._id),vendorId:String(row.vendorId),createdAt:row.createdAt?.toISOString()??new Date().toISOString()})) as Vehicle}
export async function listActiveVehicles(filter:Record<string,unknown>={},limit=100){await connectMongoose();const rows=await VehicleModel.find({status:"ACTIVE",...filter}).sort({isFeatured:-1,createdAt:-1}).limit(limit).lean();return rows.map(row=>serialize(row as unknown as Row))}
export async function findActiveVehicleBySlug(slug:string){await connectMongoose();const row=await VehicleModel.findOne({slug,status:"ACTIVE"}).lean();return row?serialize(row as unknown as Row):null}

export async function inventoryStats(){await connectMongoose();const [count,makes]=await Promise.all([VehicleModel.countDocuments({status:"ACTIVE"}),VehicleModel.distinct("make",{status:"ACTIVE"})]);return {count,makes:(makes as string[]).sort()}}
