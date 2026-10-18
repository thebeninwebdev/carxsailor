import {describe,expect,it} from "vitest";
import {ObjectId} from "mongodb";
import {migrateBetterAuthUsers} from "./auth-migration";

type Row=Record<string,unknown>;
const same=(a:unknown,b:unknown)=>a instanceof ObjectId&&b instanceof ObjectId?a.equals(b):a===b;
const matches=(row:Row,query:Row)=>Object.entries(query).every(([key,want])=>{
  const got=row[key]; if(want&&typeof want==="object"&&! (want instanceof ObjectId)&&!(want instanceof Date)){
    const condition=want as Row;
    if("$in" in condition)return (condition.$in as unknown[]).some(value=>same(got,value));
    if("$ne" in condition)return !same(got,condition.$ne);
    if("$regex" in condition)return new RegExp(String(condition.$regex),String(condition.$options??"")).test(String(got));
  } return same(got,want);
});
function memory(seed:Record<string,Row[]>) {
  const data=Object.fromEntries(Object.entries(seed).map(([name,rows])=>[name,rows.map(row=>({...row}))])) as Record<string,Row[]>;
  const collection=(name:string)=>({
    find:(query:Row)=>({toArray:async()=>data[name].filter(row=>matches(row,query))}),
    findOne:async(query:Row)=>data[name].find(row=>matches(row,query))??null,
    countDocuments:async(query:Row)=>data[name].filter(row=>matches(row,query)).length,
    updateOne:async(query:Row,update:{$set:Row},{upsert}:{upsert?:boolean}={})=>{let row=data[name].find(value=>matches(value,query));if(!row&&upsert){row={...query};data[name].push(row);}if(row)Object.assign(row,update.$set);},
    updateMany:async(query:Row,update:{$set:Row})=>data[name].filter(row=>matches(row,query)).forEach(row=>Object.assign(row,update.$set)),
    deleteOne:async(query:Row)=>{const index=data[name].findIndex(row=>matches(row,query));if(index>=0)data[name].splice(index,1);},
    deleteMany:async(query:Row)=>{data[name]=data[name].filter(row=>!matches(row,query));},
  });
  return {db:{collection} as never,data};
}

describe("Better Auth migration",()=>{
  it("keeps the legacy ID, repairs Google and application relationships, and keeps an approved vendor",async()=>{
    const old=new ObjectId(),duplicate=new ObjectId(),vendorOld=new ObjectId(),vendorNew=new ObjectId();
    const {db,data}=memory({
      user:[{_id:old,email:" Vendor@Example.com ",role:"ADMIN",emailVerified:true,createdAt:new Date("2020-01-01")}],
      users:[{_id:duplicate,email:"vendor@example.com",name:"Google name",role:"BUYER",emailVerified:null}],
      accounts:[{_id:new ObjectId(),provider:"google",providerAccountId:"google-id",userId:duplicate}],sessions:[{_id:new ObjectId(),userId:duplicate}],
      vendorprofiles:[{_id:vendorOld,userId:String(old),status:"APPROVED",displayName:"Established"},{_id:vendorNew,userId:String(duplicate),status:"PENDING",displayName:"Duplicate"}],
      favorites:[{_id:new ObjectId(),userId:String(old),vehicleId:"car"},{_id:new ObjectId(),userId:String(duplicate),vehicleId:"car"}],
      inquiries:[{_id:new ObjectId(),buyerId:String(duplicate)}],advisersessions:[{_id:new ObjectId(),userId:String(duplicate)}],auditlogs:[{_id:new ObjectId(),actorId:String(duplicate)}],
    });
    const report=await migrateBetterAuthUsers(db);
    expect(data.users).toHaveLength(1); expect(data.users[0]).toMatchObject({_id:old,email:"vendor@example.com",role:"ADMIN"});
    expect(data.accounts[0].userId).toEqual(old); expect(data.sessions).toHaveLength(0);
    expect(data.vendorprofiles).toHaveLength(1); expect(data.vendorprofiles[0]).toMatchObject({userId:String(old),status:"APPROVED",displayName:"Established"});
    expect(data.favorites).toHaveLength(1); expect(data.inquiries[0].buyerId).toBe(String(old)); expect(data.advisersessions[0].userId).toBe(String(old)); expect(data.auditlogs[0].actorId).toBe(String(old));
    expect(report).toMatchObject({duplicateUsers:1,accountLinksAffected:1,favoritesAffected:1});
  });
  it("is dry-run safe and idempotent after migration",async()=>{
    const old=new ObjectId(); const {db,data}=memory({user:[{_id:old,email:"buyer@example.com"}],users:[],accounts:[],sessions:[],vendorprofiles:[],favorites:[],inquiries:[],advisersessions:[],auditlogs:[]});
    await migrateBetterAuthUsers(db,{dryRun:true}); expect(data.users).toHaveLength(0);
    await migrateBetterAuthUsers(db); const first=data.users.map(row=>({...row}));
    const report=await migrateBetterAuthUsers(db); expect(data.users).toEqual(first); expect(report.duplicateUsers).toBe(0); expect(data.users[0]._id).toEqual(old);
  });
});
