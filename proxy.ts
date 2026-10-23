import {NextResponse,type NextRequest} from "next/server";
import {shouldCanonicalizeHost} from "@/lib/origin";
export function proxy(request:NextRequest){
  if(shouldCanonicalizeHost()&&request.nextUrl.hostname==="www.carxsailor.com"){
    const url=request.nextUrl.clone();
    url.protocol="https:";
    url.hostname="carxsailor.com";
    return NextResponse.redirect(url,308);
  }
  const headers=new Headers(request.headers);
  headers.set("x-carxsailor-path",request.nextUrl.pathname+request.nextUrl.search);
  return NextResponse.next({request:{headers}});
}
export const config={matcher:["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"]};
