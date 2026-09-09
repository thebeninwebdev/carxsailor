import type {MetadataRoute} from "next";
import {absoluteUrl, indexingEnabled} from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {rules: indexingEnabled ? [{userAgent: "*", allow: "/", disallow: ["/admin$", "/admin/", "/vendor$", "/vendor/", "/dashboard$", "/dashboard/", "/api/"]}] : [{userAgent: "*", disallow: "/"}], sitemap: absoluteUrl("/sitemap.xml")};
}
