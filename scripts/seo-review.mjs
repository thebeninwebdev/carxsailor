import assert from 'node:assert/strict';
const base=process.argv[2] || 'http://localhost:3001';
for(const path of ['/','/about','/cars?make=Toyota','/car-adviser','/compare?cars=example','/contact']) {
 const response=await fetch(base+path,{headers:{'user-agent':'Twitterbot'}});assert.equal(response.status,200,path);
 const html=await response.text(); const canonical=path.split('?')[0];
 const canonicalTag=html.match(/<link rel="canonical" href="([^"]+)"/); assert.ok(canonicalTag,path+' canonical tag'); assert.equal(new URL(canonicalTag[1]).href,new URL(canonical,'https://carxsailor.vercel.app').href,path+' canonical');
 assert.ok(html.includes('name="twitter:card" content="summary_large_image"'),path+' social card');
 assert.ok(html.includes('property="og:image"'),path+' share image');
 assert.ok(html.includes('rel="icon"'),path+' favicon');
 if(path==='/') {assert.ok(html.includes('application/ld+json'));assert.ok(html.includes('WebSite'));}
 console.log('PASS metadata',path);
}
for(const [path,type] of [['/favicon.ico','image/'],['/icon.svg','image/svg+xml'],['/apple-icon.png','image/png'],['/social-preview.png','image/png'],['/manifest.webmanifest','application/manifest+json']]){
 const response=await fetch(base+path);assert.equal(response.status,200,path);assert.ok(response.headers.get('content-type').includes(type),path);console.log('PASS asset',path);
}
const robots=await(await fetch(base+'/robots.txt')).text();assert.ok(robots.includes('https://carxsailor.vercel.app/sitemap.xml'));assert.ok(robots.includes('/vendor$'));console.log('PASS robots');
const response=await fetch(base+'/sitemap.xml');assert.equal(response.status,200);const sitemap=await response.text();assert.ok(sitemap.includes('https://carxsailor.vercel.app/cars'));assert.ok(!sitemap.includes('-test-'));assert.ok(!sitemap.includes('localhost'));console.log('PASS sitemap');
