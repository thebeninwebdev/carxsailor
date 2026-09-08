import {authDatabase} from "@/lib/db";

export const dynamic="force-dynamic";

export default async function Page(){
  const users=await authDatabase.collection("user").find({}).project({name:1,email:1,role:1,emailVerified:1,createdAt:1}).sort({createdAt:-1}).toArray();
  return <div><div><h2 className="text-xl font-bold">User overview</h2><p className="mt-1 text-sm text-[#68756f]">{users.length} registered accounts</p></div>
    <div className="mt-6 grid gap-3">{users.map(user=><article className="card flex flex-wrap items-center justify-between gap-4 p-5" key={String(user._id)}><div><b>{String(user.name||"Unnamed user")}</b><p className="mt-1 text-sm text-[#68756f]">{String(user.email)}</p></div><div className="flex items-center gap-2"><span className="pill bg-[#edf2ee]">{String(user.role||"BUYER")}</span><span className={`pill ${user.emailVerified?"bg-green-100 text-green-800":"bg-amber-100 text-amber-800"}`}>{user.emailVerified?"Verified":"Unverified"}</span></div></article>)}</div>
  </div>
}
