// Local smoke review using an isolated Chromium instance on port 9222.
// Start Edge/Chrome with --headless=new --remote-debugging-port=9222 first.
import {mkdir,writeFile} from "node:fs/promises";
const targets=await(await fetch("http://127.0.0.1:9222/json/list")).json();
const target=targets.find(x=>x.type==="page");
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener("open",r,{once:true}));
let id=0;const pending=new Map();socket.addEventListener("message",e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(m.error);else p.resolve(m.result)}});
function send(method,params={}){return new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}))})}
async function evaluate(expression){const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text+JSON.stringify(r.exceptionDetails.exception));return r.result.value}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(expression){const end=Date.now()+60000;while(Date.now()<end){if(await evaluate(expression))return;await pause(350)}throw new Error("Timed out: "+expression)}
async function navigate(path){await send("Page.navigate",{url:"http://localhost:3000"+path});await until('document.readyState === "complete" && !!document.querySelector("h1")');await pause(1200)}
async function shot(name){await mkdir("artifacts",{recursive:true});const image=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});await writeFile(`artifacts/${name}.png`,Buffer.from(image.data,"base64"))}
function assert(value,message){if(!value)throw new Error(message);console.log("PASS "+message)}
await send("Page.enable");await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await navigate("/");await evaluate('fetch("/api/auth/sign-out",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}).then(r=>r.ok)');await navigate("/");assert(await evaluate('document.querySelectorAll("h1").length===1'),"One homepage H1");assert(await evaluate('document.querySelectorAll("main section").length>=12'),"Rich homepage sections");
await shot("homepage-desktop");
await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await pause(700);
assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),"No mobile homepage overflow");await shot("homepage-mobile");
await evaluate('document.querySelector(".mobile-toggle").click()');assert(await evaluate('!!document.querySelector("#mobile-navigation")'),"Mobile navigation opens");await evaluate('document.querySelector(".mobile-toggle").click()');
await navigate("/car-adviser");await evaluate('sessionStorage.clear();localStorage.removeItem("carxsailor-compare")');await navigate("/car-adviser");
await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Start my decision")).click()');await pause(300);
await evaluate('(()=>{const el=document.querySelector("input[type=number]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"20000000");el.dispatchEvent(new Event("input",{bubbles:true}))})()');
for(let i=0;i<3;i++){await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Continue")).click()');await pause(350)}
assert(await evaluate('document.body.innerText.includes("Review your answers")'),"Questionnaire reaches review");await shot("decision-review-mobile");
await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Find my cars")).click()');await until('!!document.querySelector("#results")');
assert(await evaluate('document.body.innerText.includes("Why it fits")'),"Recommendations explain strengths");assert(await evaluate('document.body.innerText.includes("Trade-offs & missing information")'),"Recommendations disclose trade-offs");
await shot("decision-results-mobile");
await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Add to compare")).click()');await pause(400);
await navigate("/compare");assert(await evaluate('!!document.querySelector("table")'),"Comparison retains selected car");
await evaluate('(()=>{const el=document.querySelectorAll("main select")[1];el.value=el.options[1].value;el.dispatchEvent(new Event("change",{bubbles:true}))})()');await pause(500);assert(await evaluate('document.querySelectorAll("thead th").length===3'),"Two-car comparison renders");assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),"Comparison scroll stays inside its panel");await shot("comparison-mobile");
await navigate("/dashboard/favorites");assert(await evaluate('location.pathname==="/login"&&new URLSearchParams(location.search).get("next")==="/dashboard/favorites"'),"Protected destination preserved at login");
await navigate("/car-adviser?resume=1#results");await until('!!document.querySelector("#results")');await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Save my decision")).click()');await until('location.pathname==="/login"');assert(await evaluate('new URLSearchParams(location.search).get("next")==="/car-adviser?resume=1#results"'),"Save decision keeps return context");
console.log("Anonymous browser journey passed. Screenshots are in artifacts/.");
if(process.argv.includes("--auth")){
  const email=`carxsailor-review-${Date.now()}@example.invalid`;
  const password=crypto.randomUUID()+"aA1!";
  await writeFile("artifacts/review-account.json",JSON.stringify({email}));
  await navigate("/register?next="+encodeURIComponent("/car-adviser?resume=1#results"));
  for(const [name,value] of [["name","Browser Review"],["email",email],["password",password]])await evaluate(`(()=>{const el=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event("input",{bubbles:true}))})()`);
  await evaluate('document.querySelector("form button[type=submit], form button").click()');
  await until('location.pathname==="/car-adviser" && !!document.querySelector("#results")');
  assert(await evaluate('![...document.querySelectorAll("header a")].find(x=>x.getAttribute("href")==="/login") && !!document.querySelector(".avatar")'),"Registered user has clear signed-in navbar");
  await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Save my decision")).click()');await until('document.body.innerText.includes("Saved. Find this decision")');
  await evaluate('[...document.querySelectorAll("button")].find(x=>x.getAttribute("aria-label")==="Save car").click()');await until('!![...document.querySelectorAll("button")].find(x=>x.getAttribute("aria-label")==="Remove saved car")');
  await navigate("/dashboard/favorites");assert(await evaluate('document.querySelectorAll("main article").length>0'),"Saved car appears in My Garage");
  await navigate("/dashboard/recommendations");assert(await evaluate('document.body.innerText.includes("Review & refresh matches")'),"Saved decision appears in My decisions");
  await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Review & refresh matches")).click()');await until('location.pathname==="/car-adviser" && document.body.innerText.includes("Review your answers")');assert(await evaluate('document.body.innerText.includes("20,000,000")'),"Saved decision restores budget");
  await navigate("/");await evaluate('document.querySelector("button[aria-controls=account-navigation]").click()');await shot("signed-in-mobile");await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Sign out")).click()');await until('!![...document.querySelectorAll("header a")].find(x=>x.getAttribute("href")==="/login")');assert(await evaluate('!document.querySelector(".avatar")'),"Sign out immediately restores anonymous navbar");
  await navigate("/login?next="+encodeURIComponent("/dashboard/favorites"));for(const[name,value]of[["email",email],["password",password]])await evaluate(`(()=>{const el=document.querySelector('input[name="${name}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event("input",{bubbles:true}))})()`);await evaluate('document.querySelector("form button").click()');await until('location.pathname==="/dashboard/favorites"');assert(await evaluate('document.querySelectorAll("main article").length>0'),"Sign in returns existing user to saved cars");
  await evaluate('document.querySelector("button[aria-controls=account-navigation]").click()');await evaluate('[...document.querySelectorAll("button")].find(x=>x.textContent.includes("Sign out")).click()');await until('!![...document.querySelectorAll("header a")].find(x=>x.getAttribute("href")==="/login")');
  console.log("Authenticated browser journey passed. Remove the isolated account using scripts/cleanup-review-account.mjs.");
}
socket.close();
