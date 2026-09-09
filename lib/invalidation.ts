import "server-only";
import {revalidatePath} from "next/cache";
export function invalidateInventory() {
  for (const path of ["/", "/cars", "/compare", "/car-adviser", "/admin", "/admin/cars", "/vendor", "/vendor/cars", "/dashboard/favorites", "/dashboard/recommendations", "/sitemap.xml"]) revalidatePath(path);
  for (const path of ["/cars/[slug]", "/vendors/[vendorId]", "/admin/cars/[id]", "/vendor/cars/[id]", "/vendor/cars/[id]/edit"]) revalidatePath(path, "page");
}
export function invalidateVendor() {
  invalidateInventory();
  for (const path of ["/admin/vendors", "/vendor/profile", "/become-a-vendor"]) revalidatePath(path);
  revalidatePath("/admin/vendors/[id]", "page");
  revalidatePath("/vendor", "layout");
}
export function invalidateGarage(section: "favorites" | "recommendations" | "inquiries") {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/" + section);
  if (section === "inquiries") {
    for (const path of ["/vendor", "/vendor/inquiries", "/admin/inquiries"]) revalidatePath(path);
  }
}
