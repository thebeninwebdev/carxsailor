import {MutationError} from "./mutation-result";
import type {VehicleStatus} from "@/types";
export const listingActions = ["APPROVE_LISTING", "REJECT_LISTING", "SUSPEND_LISTING", "FEATURE_LISTING", "UNFEATURE_LISTING"] as const;
export type ListingAction = typeof listingActions[number];
export function listingTransition(status: VehicleStatus, action: ListingAction, featured = false) {
  if (action === "APPROVE_LISTING" || action === "REJECT_LISTING") {
    if (status !== "PENDING_REVIEW") throw new MutationError("Only listings awaiting review can be approved or rejected.", 409);
    return {status: action === "APPROVE_LISTING" ? "ACTIVE" as const : "REJECTED" as const, isFeatured: false};
  }
  if (status !== "ACTIVE") throw new MutationError("This action requires an active listing.", 409);
  if (action === "SUSPEND_LISTING") return {status: "SUSPENDED" as const, isFeatured: false};
  const isFeatured = action === "FEATURE_LISTING";
  if (featured === isFeatured) throw new MutationError("This listing has already been updated.", 409);
  return {status, isFeatured};
}
