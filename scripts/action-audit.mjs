// Requires the local app and an isolated Chromium debugger on port 9222.
// Creates uniquely named test accounts and removes only their records in finally.
import nextEnv from "@next/env";
const {loadEnvConfig}=nextEnv;
import {MongoClient,ObjectId} from "mongodb";
import {randomUUID} from "node:crypto";
loadEnvConfig(process.cwd(),true);
const base=process.env.AUDIT_BASE_URL||"http://localhost:3000";
const marker="audit-"+randomUUID();
const password="Audit!"+randomUUID();
const emails={admin:marker+"-admin@example.com",seller:marker+"-seller@example.com",buyer:marker+"-buyer@example.com"};
const client=new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db=client.db();
const targets=await(await fetch("http://localhost:9222/json/list")).json();
const target=targets.find(value=>value.type==="page");
if(!target)throw new Error("No isolated browser target");
const ws=new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve=>ws.addEventListener("open",resolve,{once:true}));
let sequence=0;
const requests=new Map();
const errors=[];
ws.addEventListener("message",event=>{
  const message=JSON.parse(event.data);
  if(message.method==="Runtime.exceptionThrown")errors.push(message.params.exceptionDetails.text);
  if(message.id){const pending=requests.get(message.id);requests.delete(message.id);if(message.error)pending.reject(new Error(message.error.message));else pending.resolve(message.result);}
});
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;requests.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(expression,label=expression){const end=Date.now()+60000;while(Date.now()<end){try{if(await evaluate(expression))return;}catch{}await pause(250);}throw new Error("Timed out: "+label+"; page="+await evaluate("location.pathname")+"; alerts="+await evaluate("Array.from(document.querySelectorAll('[role=alert]')).map(x=>x.textContent).join('; ')"));}
async function navigate(path){await send("Page.navigate",{url:base+path});await until("document.readyState==='complete'");await pause(700);}
async function fields(values){for(const name of Object.keys(values))await until("!!document.querySelector(':is(input,textarea,select)[name="+JSON.stringify(name)+"]:not(:disabled)')","field "+name);await evaluate("("+((values)=>{
 for(const [name,value]of Object.entries(values)){
  const input=document.querySelector(':is(input,textarea,select)[name="'+name+'"]');
  if(!input)throw new Error("Missing field "+name);
  const proto=input instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:input instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,"value").set.call(input,String(value));
  input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));
 }
}).toString()+")("+JSON.stringify(values)+")");}
async function click(text){const label=text.replace(/[^a-zA-Z0-9 ]+$/,"").trim();await until("Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim().startsWith("+JSON.stringify(label)+")&&!b.disabled)","button "+label);await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim().startsWith("+JSON.stringify(label)+")).click()");}
async function link(href){await until("!!document.querySelector('a[href="+JSON.stringify(href)+"]')");await evaluate("document.querySelector('a[href="+JSON.stringify(href)+"]').click()");await until("location.pathname+location.search==="+JSON.stringify(href),"navigation to "+href);await pause(400);}
function assert(value,label){if(!value)throw new Error(label);console.log("PASS "+label);}
async function logout(){await evaluate("document.querySelector('[aria-controls=account-navigation]')?.click()");await click("Sign out");await until("location.pathname==='/'&&!document.querySelector('[aria-controls=account-navigation]')","logout clears session and navigation");}
async function login(role,callback=""){
 await navigate("/login"+(callback?"?callbackUrl="+encodeURIComponent(callback):""));
 await fields({email:emails[role],password});await click("Sign in");
 await until("location.pathname!== '/login'","successful "+role+" login");
}
async function moderateRequest(id,action){
 return evaluate("fetch('/api/admin/moderate',{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams("+JSON.stringify({targetType:"VEHICLE",targetId:id,action})+")}).then(async r=>({status:r.status,body:await r.json()}))");
}
let vendorId;
let carId;
try{
 await send("Page.enable");await send("Runtime.enable");
 await send("Network.enable");await send("Network.clearBrowserCookies");
 for(const role of ["admin","seller"]){
   const response=await fetch(base+"/api/auth/sign-up/email",{method:"POST",headers:{"Content-Type":"application/json",Origin:base},body:JSON.stringify({name:"Audit "+role,email:emails[role],password})});
   assert(response.ok,"create isolated "+role+" account");
 }
 await db.collection("user").updateOne({email:emails.admin},{$set:{role:"ADMIN"}});
 await navigate("/dashboard/favorites?audit=1");await evaluate("sessionStorage.clear();localStorage.clear()");
 await until("location.pathname==='/login'");
 assert(await evaluate("new URLSearchParams(location.search).get('next')==='/dashboard/favorites?audit=1'"),"protected route preserves query callback");
 await navigate("/register?callbackUrl="+encodeURIComponent("/dashboard/favorites?audit=1"));
 await fields({name:"Audit Buyer",email:emails.buyer,password});await click("Create account");
 await until("location.pathname==='/dashboard/favorites'","signup return URL");
 assert(await evaluate("!!document.querySelector('[aria-controls=account-navigation]')"),"signup refreshes authenticated navbar");
 await logout();
 await navigate("/login");
 await fields({email:emails.buyer,password:"WrongPassword123!"});await click("Sign in");
 await until("!!document.querySelector('[role=alert]')","wrong-password error");
 assert(await evaluate("location.pathname==='/login'"),"failed login stays on form");
 await fields({password});await click("Sign in");await until("location.pathname==='/dashboard'","buyer default dashboard");
 await navigate("/admin");await until("location.pathname==='/dashboard'","unauthorized admin route");
 const denied=await moderateRequest(new ObjectId().toHexString(),"APPROVE_LISTING");
 assert(denied.status===403,"server denies buyer moderation");
 await logout();
 await login("seller","/become-a-vendor");
 await fields({displayName:marker,businessName:"Audit Motors",phoneNumber:"+2348000000000",state:"Lagos",city:"Ikeja",description:"Isolated seller profile for action audit."});
 await click("Create seller profile");await until("location.pathname==='/vendor'","seller application navigation");
 const seller=await db.collection("user").findOne({email:emails.seller});
 const vendor=await db.collection("vendorprofiles").findOne({userId:String(seller._id)});
 assert(vendor?.location?.city==="Ikeja"&&vendor?.location?.state==="Lagos","seller location persists in canonical nested fields");
 vendorId=vendor._id;
 await logout();
 await login("admin");
 assert(await evaluate("location.pathname==='/admin'"),"admin default destination");
 await navigate("/admin/vendors/"+vendorId);await click("Approve");
 await until("document.body.innerText.includes('Seller status updated successfully.')","seller approval confirmation");
 assert((await db.collection("vendorprofiles").findOne({_id:vendorId})).status==="APPROVED","seller approval persisted");
 await logout();
 await login("seller");
 assert(await evaluate("location.pathname==='/vendor'"),"BUYER role with seller profile routes to vendor");
 await navigate("/vendor/cars/new");
 await fields({make:"Audit",model:marker,year:2024,price:4500000,mileage:10000,city:"Ikeja",transmission:"AUTOMATIC",description:"Isolated listing used to verify the entire action lifecycle.",imageUrl:"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"});
 await click("Submit for admin review");
 await until("/^\\/vendor\\/cars\\/[a-f0-9]{24}$/.test(location.pathname)","create listing navigation");
 carId=new ObjectId(await evaluate("location.pathname.split('/').pop()"));
 let car=await db.collection("vehicles").findOne({_id:carId});
 assert(car.status==="PENDING_REVIEW","created listing persisted pending review");
 await logout();await login("admin");
 await navigate("/admin/cars?status=PENDING_REVIEW");
 assert(await evaluate("document.body.innerText.includes("+JSON.stringify(marker)+")"),"pending list contains new car");
 await link("/admin/cars/"+carId);await click("Approve");
 await until("location.pathname==='/admin/cars'&&new URLSearchParams(location.search).get('status')==='ACTIVE'","approval navigates to approved list");
 assert(await evaluate("document.body.innerText.includes("+JSON.stringify(marker)+")&&document.body.innerText.includes('Car approved successfully.')"),"approved UI contains car and success feedback without reload");
 car=await db.collection("vehicles").findOne({_id:carId});
 assert(car.status==="ACTIVE"&&car.publishedAt instanceof Date,"approval database state is ACTIVE with publication date");
 assert(!await db.collection("vehicles").findOne({_id:carId,status:"PENDING_REVIEW"}),"pending query excludes approved car");
 assert(!!await db.collection("vehicles").findOne({_id:carId,status:"ACTIVE"}),"approved query includes approved car");
 assert(await db.collection("auditlogs").countDocuments({targetId:String(carId),action:"APPROVE_LISTING"})===1,"approval creates one audit record");
 assert((await moderateRequest(String(carId),"APPROVE_LISTING")).status===409,"duplicate approval cannot report success");
 assert((await moderateRequest(new ObjectId().toHexString(),"APPROVE_LISTING")).status===404,"nonexistent car cannot report success");
 assert((await moderateRequest("invalid","APPROVE_LISTING")).status===422,"invalid car ID rejected");
 await link("/admin/cars?status=PENDING_REVIEW");
 await until("!document.body.innerText.includes("+JSON.stringify(marker)+")","pending browser view excludes approved car after navigation");console.log("PASS pending browser view excludes approved car after navigation");
 await logout();await login("buyer","/cars/"+car.slug);
 await until("!!document.querySelector('button[aria-label=\"Save car\"]:not(:disabled)')","favorite status ready");
 await evaluate("document.querySelector('button[aria-label=\"Save car\"]:not(:disabled)').click()");
 await until("!!document.querySelector('button[aria-label=\"Remove saved car\"]')","favorite confirmed");
 await navigate("/dashboard/favorites");
 assert(await evaluate("document.body.innerText.includes("+JSON.stringify(marker)+")"),"saved list displays confirmed favorite");
 await until("!!document.querySelector('button[aria-label=\"Remove saved car\"]:not(:disabled)')");
 await evaluate("document.querySelector('button[aria-label=\"Remove saved car\"]:not(:disabled)').click()");
 await until("!document.body.innerText.includes("+JSON.stringify(marker)+")","unsave removes card without manual reload");
 await navigate("/cars/"+car.slug);
 await fields({message:"Isolated audit inquiry. No action required.",kind:"AVAILABILITY"});await click("Contact vendor");
 await until("document.body.innerText.includes('Inquiry sent.')","inquiry success feedback");
 const buyer=await db.collection("user").findOne({email:emails.buyer});
 assert(await db.collection("inquiries").countDocuments({buyerId:String(buyer._id),vehicleId:String(carId)})===1,"inquiry is persisted once");
 await navigate("/car-adviser");
 await click("Start my decision ?");
 await until("!!document.querySelector('input[type=number]')");
 await evaluate("(()=>{const i=document.querySelector('input[type=number]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'10000000');i.dispatchEvent(new Event('input',{bubbles:true}));})()");
 await click("Continue ?");await click("Continue ?");await click("Continue ?");await click("Find my cars ?");
 await until("!!document.getElementById('results')","adviser results");
 await click("Save my decision");await until("document.body.innerText.includes('Saved. Find this decision')","decision saved feedback");
 assert(await db.collection("advisersessions").countDocuments({userId:String(buyer._id),status:"COMPLETED"})===1,"decision persisted");
 await logout();await login("seller");
 await navigate("/vendor/profile");await fields({displayName:marker+" Updated",description:"Updated profile from isolated browser audit."});await click("Save profile");
 await until("document.body.innerText.includes('Seller profile updated.')","profile success feedback");
 await navigate("/vendors/"+vendorId);
 assert(await evaluate("document.body.innerText.includes("+JSON.stringify(marker+" Updated")+")"),"public seller profile reflects saved database values");
 await navigate("/vendor/cars/"+carId+"/edit");await fields({price:4600000});await click("Save changes");
 await until("location.pathname==="+JSON.stringify("/vendor/cars/"+carId),"edit redirects after save");
 car=await db.collection("vehicles").findOne({_id:carId});
 assert(car.price===4600000&&car.status==="PENDING_REVIEW","editing active listing persists and requires fresh moderation");
 await logout();await login("admin");await navigate("/admin/cars/"+carId);await click("Reject");
 await until("new URLSearchParams(location.search).get('status')==='REJECTED'","rejection destination");
 assert((await db.collection("vehicles").findOne({_id:carId})).status==="REJECTED","rejection database and browser agree");
 assert(errors.length===0,"no uncaught browser exceptions");
 console.log("ACTION AUDIT PASSED");
}finally{
 // Restrict every cleanup query to the unique test users and their related IDs.
 const users=await db.collection("user").find({email:{$in:Object.values(emails)}}).toArray();
 const ids=users.flatMap(user=>[user._id,String(user._id)]);
 const vendors=await db.collection("vendorprofiles").find({userId:{$in:ids}}).toArray();
 const vendorIds=vendors.map(vendor=>vendor._id);
 const vehicles=await db.collection("vehicles").find({vendorId:{$in:vendorIds}}).toArray();
 const vehicleIds=vehicles.map(vehicle=>String(vehicle._id));
 for(const name of ["session","account","favorites","advisersessions"])await db.collection(name).deleteMany({userId:{$in:ids}});
 await db.collection("inquiries").deleteMany({buyerId:{$in:ids}});
 await db.collection("auditlogs").deleteMany({actorId:{$in:ids}});
 await db.collection("auditlogs").deleteMany({targetId:{$in:[...vehicleIds,...vendorIds.map(String)]}});
 await db.collection("vehicles").deleteMany({vendorId:{$in:vendorIds}});
 await db.collection("vendorprofiles").deleteMany({userId:{$in:ids}});
 await db.collection("user").deleteMany({email:{$in:Object.values(emails)}});
 await send("Network.clearBrowserCookies").catch(()=>{});
 ws.close();await client.close();
 console.log("Isolated audit records cleaned up.");
}
