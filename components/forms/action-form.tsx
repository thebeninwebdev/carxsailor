"use client";
import {useActionState, useRef} from "react";
import {unstable_rethrow} from "next/navigation";
import {useFormStatus} from "react-dom";
import {runMutation} from "@/lib/actions";
import type {ActionState, MutationKind} from "@/lib/mutation-result";
function Fields({children, className, pendingLabel}: {children: React.ReactNode; className?: string; pendingLabel: string}) {
  const {pending} = useFormStatus();
  return <><fieldset disabled={pending} className={className} style={{minWidth:0}}>{children}</fieldset>{pending && <p role="status" className="mt-3 text-sm">{pendingLabel}</p>}</>;
}
export function ActionForm({kind, children, className, pendingLabel="Saving..."}: {kind: MutationKind; children: React.ReactNode; className?: string; pendingLabel?: string}) {
  const locked = useRef(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (previous, form) => {
    try { return await runMutation(kind, previous, form); }
    catch(error) { unstable_rethrow(error); return {error:"Could not reach the server. Your changes are still here; please try again."}; }
    finally { locked.current = false; }
  }, {});
  return <form action={action} onReset={event=>event.preventDefault()} onSubmit={event=>{if(locked.current || pending) event.preventDefault(); else locked.current=true;}}>
    <Fields className={className} pendingLabel={pendingLabel}>{children}</Fields>
    {state.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
  </form>;
}
