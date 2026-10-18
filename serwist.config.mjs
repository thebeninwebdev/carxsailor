import {serwist} from "@serwist/next/config";
import {resolve} from "node:path";

export default serwist({
  swSrc: resolve("app/sw.ts"),
  swDest: resolve("public/sw.js"),
});
