import {ObjectId, type Db, type Document} from "mongodb";

type Role="ADMIN"|"BUYER";
type LegacyUser=Document&{_id:ObjectId;email?:string;name?:string;image?:string;role?:Role;emailVerified?:boolean;createdAt?:Date;updatedAt?:Date};
export type MigrationReport={legacyUsers:number;usersRequiringMigration:number;duplicateUsers:number;vendorProfilesAffected:number;accountLinksAffected:number;favoritesAffected:number;inquiriesAffected:number;adviserSessionsAffected:number;auditLogsAffected:number;sessionsInvalidated:number};
export type MigrationOptions={dryRun?:boolean;now?:Date};

const zero=():MigrationReport=>({legacyUsers:0,usersRequiringMigration:0,duplicateUsers:0,vendorProfilesAffected:0,accountLinksAffected:0,favoritesAffected:0,inquiriesAffected:0,adviserSessionsAffected:0,auditLogsAffected:0,sessionsInvalidated:0});
const emailOf=(email:unknown)=>typeof email==="string"?email.trim().toLowerCase():"";
const roleOf=(...roles:unknown[]):Role=>roles.includes("ADMIN")?"ADMIN":"BUYER";
const statusRank=(status:unknown)=>({REJECTED:1,PENDING:2,SUSPENDED:3,APPROVED:4}[String(status)]??0);
const idString=(id:unknown)=>String(id);

/**
 * Moves Better Auth identities from `user` to Auth.js `users` without changing
 * their ObjectIds. This intentionally leaves the legacy collection untouched.
 */
export async function migrateBetterAuthUsers(db:Db,{dryRun=false,now=new Date()}:MigrationOptions={}):Promise<MigrationReport>{
  const report=zero();
  const legacy=await db.collection<LegacyUser>("user").find({}).toArray();
  report.legacyUsers=legacy.length;
  const users=db.collection<Document>("users"),accounts=db.collection<Document>("accounts"),sessions=db.collection<Document>("sessions");

  for(const old of legacy){
    if(!(old._id instanceof ObjectId)) throw new Error(`Legacy user ${idString(old._id)} does not have an ObjectId; Auth.js MongoDBAdapter requires ObjectId user IDs.`);
    const email=emailOf(old.email);
    if(!email) continue; // Auth.js cannot authenticate an identity without an email.
    const canonicalId=old._id;
    const sameId=await users.findOne({_id:canonicalId});
    const emailMatches=await users.find({email:{$regex:`^${escapeRegex(email)}$`,$options:"i"},_id:{$ne:canonicalId}}).toArray();
    const duplicates=emailMatches.filter(user=>user._id instanceof ObjectId) as Array<Document&{_id:ObjectId}>;
    if(!sameId||duplicates.length) report.usersRequiringMigration++;
    report.duplicateUsers+=duplicates.length;

    const source=[old,sameId,...duplicates].filter(Boolean) as Document[];
    const verified=source.some(user=>user.emailVerified===true||user.emailVerified instanceof Date);
    const verifiedAt=source.find(user=>user.emailVerified instanceof Date)?.emailVerified as Date|undefined;
    const canonical={
      _id:canonicalId,
      email,
      name:source.map(user=>user.name).find(value=>typeof value==="string"&&value.trim())??null,
      image:source.map(user=>user.image).find(value=>typeof value==="string"&&value.trim())??null,
      role:roleOf(...source.map(user=>user.role)),
      emailVerified:verified?(verifiedAt??old.updatedAt??old.createdAt??now):null,
    };
    if(!dryRun){
      await users.updateOne({_id:canonicalId},{$set:canonical},{upsert:true});
    }

    for(const duplicate of duplicates){
      const newId=duplicate._id;
      await moveAccounts(accounts,newId,canonicalId,dryRun,report);
      await moveVendorProfile(db,newId,canonicalId,dryRun,report);
      await moveFavorites(db,newId,canonicalId,dryRun,report);
      await moveField(db,"inquiries","buyerId",newId,canonicalId,dryRun,"inquiriesAffected",report);
      await moveField(db,"advisersessions","userId",newId,canonicalId,dryRun,"adviserSessionsAffected",report);
      await moveField(db,"auditlogs","actorId",newId,canonicalId,dryRun,"auditLogsAffected",report);
      const invalidated=await sessions.countDocuments({userId:{$in:[newId,canonicalId]}});
      report.sessionsInvalidated+=invalidated;
      if(!dryRun){
        await sessions.deleteMany({userId:{$in:[newId,canonicalId]}});
        await users.deleteOne({_id:newId});
      }
    }
    // Even a non-duplicate migrated identity must receive a fresh Auth.js session.
    if(!duplicates.length){
      const invalidated=await sessions.countDocuments({userId:canonicalId});
      report.sessionsInvalidated+=invalidated;
      if(!dryRun) await sessions.deleteMany({userId:canonicalId});
    }
  }
  return report;
}

async function moveAccounts(accounts:ReturnType<Db["collection"]>,from:ObjectId,to:ObjectId,dryRun:boolean,report:MigrationReport){
  const rows=await accounts.find({userId:from}).toArray(); report.accountLinksAffected+=rows.length;
  for(const account of rows){
    const key={provider:account.provider,providerAccountId:account.providerAccountId};
    const already=await accounts.findOne({...key,userId:to});
    if(!dryRun){
      if(already) await accounts.deleteOne({_id:account._id});
      else await accounts.updateOne({_id:account._id},{$set:{userId:to}});
    }
  }
}
async function moveField(db:Db,collection:string,field:string,from:ObjectId,to:ObjectId,dryRun:boolean,key:keyof MigrationReport,report:MigrationReport){
  const filter={[field]:idString(from)};
  const count=await db.collection(collection).countDocuments(filter); report[key]+=count;
  if(!dryRun&&count) await db.collection(collection).updateMany(filter,{$set:{[field]:idString(to)}});
}
async function moveFavorites(db:Db,from:ObjectId,to:ObjectId,dryRun:boolean,report:MigrationReport){
  const favorites=db.collection("favorites"), rows=await favorites.find({userId:idString(from)}).toArray(); report.favoritesAffected+=rows.length;
  for(const row of rows){
    const canonical=await favorites.findOne({userId:idString(to),vehicleId:row.vehicleId});
    if(!dryRun){
      if(canonical) await favorites.deleteOne({_id:row._id});
      else await favorites.updateOne({_id:row._id},{$set:{userId:idString(to)}});
    }
  }
}
async function moveVendorProfile(db:Db,from:ObjectId,to:ObjectId,dryRun:boolean,report:MigrationReport){
  const vendors=db.collection("vendorprofiles"), old=await vendors.findOne({userId:idString(to)}), duplicate=await vendors.findOne({userId:idString(from)});
  if(!duplicate) return; report.vendorProfilesAffected++;
  if(!old){if(!dryRun) await vendors.updateOne({_id:duplicate._id},{$set:{userId:idString(to)}});return;}
  const winner=statusRank(old.status)>=statusRank(duplicate.status)?old:duplicate;
  const loser=winner===old?duplicate:old;
  const merged:{[key:string]:unknown}={...loser,...winner,userId:idString(to),status:statusRank(old.status)>=statusRank(duplicate.status)?old.status:duplicate.status};
  delete merged._id; delete merged.createdAt; delete merged.updatedAt;
  if(!dryRun){await vendors.updateOne({_id:old._id},{$set:merged});await vendors.deleteOne({_id:duplicate._id});}
}
function escapeRegex(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
