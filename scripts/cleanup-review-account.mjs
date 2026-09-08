import {readFile,unlink} from "node:fs/promises";
import nextEnv from "@next/env";
import {MongoClient} from "mongodb";
nextEnv.loadEnvConfig(process.cwd());
const {email}=JSON.parse(await readFile("artifacts/review-account.json","utf8"));
if(!/^carxsailor-review-\d+@example\.invalid$/.test(email))throw new Error("Not an isolated review account");
const client=new MongoClient(process.env.MONGODB_URI);
try{await client.connect();const db=client.db();const user=await db.collection("user").findOne({email});if(user){const ids=[user._id,String(user._id)];for(const name of ["session","account","favorites","advisersessions"])await db.collection(name).deleteMany({userId:{$in:ids}});await db.collection("user").deleteOne({_id:user._id,email});console.log("Removed isolated review user and its sessions, credentials, saved cars and decisions.")}else console.log("No isolated review user remains.");await unlink("artifacts/review-account.json")}finally{await client.close()}
