import {MongoClient} from "mongodb";
import {migrateBetterAuthUsers} from "../lib/auth-migration";

const dryRun=process.argv.includes("--dry-run");
const uri=process.env.MONGODB_URI||"mongodb://127.0.0.1:27017/carxsailor";
const client=new MongoClient(uri);
try{
  await client.connect();
  const report=await migrateBetterAuthUsers(client.db(),{dryRun});
  console.log(JSON.stringify({mode:dryRun?"dry-run":"migrate",...report},null,2));
}finally{await client.close();}
