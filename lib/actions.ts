"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {mutations} from "./mutations";
import {MutationError, type ActionState, type MutationKind} from "./mutation-result";
import {getCurrentUser, getPostLoginDestination} from "./auth";

export async function runMutation(kind:MutationKind, _previous:ActionState, form:FormData):Promise<ActionState> {
  let result;
  try {
    if(!Object.hasOwn(mutations,kind)) throw new MutationError("Unknown action.");
    result=await mutations[kind](form);
  } catch(error) {
    if(error instanceof MutationError) return {error:error.message};
    console.error("[mutation]",kind,error instanceof Error?error.name:"Unknown error");
    return {error:"The operation could not be completed. Please try again."};
  }
  const separator=result.destination.includes("?")?"&":"?";
  redirect(result.destination+separator+"notice="+encodeURIComponent(result.message));
}
export async function completeSignIn(callback:unknown):Promise<ActionState> {
  let destination;
  try {
    const user=await getCurrentUser();
    if(!user) return {error:"The session was not established. Please sign in again."};
    destination=await getPostLoginDestination(user,callback);
  } catch(error) {
    console.error("[completeSignIn]",error instanceof Error?error.name:"Unknown error");
    return {error:"Could not verify your session. Please try again."};
  }
  revalidatePath("/", "layout");
  redirect(destination);
}
export async function completeSignOut():Promise<ActionState> {
  try {
    if(await getCurrentUser()) return {error:"Your session is still active. Please try signing out again."};
  } catch(error) {
    console.error("[completeSignOut]",error instanceof Error?error.name:"Unknown error");
    return {error:"Could not verify sign-out. Please try again."};
  }
  revalidatePath("/", "layout");
  redirect("/");
}
