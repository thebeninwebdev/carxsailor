import type {MetadataRoute} from "next";
import {connectMongoose} from "@/lib/db";
import {VehicleModel} from "@/models/Vehicle";
import {VendorProfileModel} from "@/models/VendorProfile";
import {absoluteUrl} from "@/lib/seo";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectMongoose();
  const vendors = await VendorProfileModel.find({status: "APPROVED", userId: {$ne: "test-seller"}}).select("_id updatedAt").lean();
  const vehicles = await VehicleModel.find({status: "ACTIVE", vendorId: {$in: vendors.map(v => v._id)}, seedTag: {$in: [null, ""]}}).select("slug updatedAt images.url").lean();
  return [
    ...["/", "/cars", "/car-adviser", "/compare", "/about", "/how-it-works", "/contact", "/become-a-vendor"].map(path => ({url: absoluteUrl(path)})),
    ...vendors.map(v => ({url: absoluteUrl("/vendors/" + String(v._id)), ...(v.updatedAt ? {lastModified: new Date(v.updatedAt)} : {})})),
    ...vehicles.map(v => ({url: absoluteUrl("/cars/" + encodeURIComponent(v.slug)), ...(v.updatedAt ? {lastModified: new Date(v.updatedAt)} : {}), images: v.images.map((image: {url: string}) => image.url)})),
  ];
}
