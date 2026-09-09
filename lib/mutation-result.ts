export type ActionState = {error?: string; message?: string};
export type MutationKind = "moderate" | "createListing" | "editListing" | "submitListing" | "applyVendor" | "updateProfile";
export type MutationSuccess = {destination: string; message: string};
export class MutationError extends Error {
  constructor(message: string, public status = 422) { super(message); }
}
