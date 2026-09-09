"use client";
import {useFormStatus} from "react-dom";
import type {ButtonHTMLAttributes} from "react";
export function SubmitButton({pendingLabel,children,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{pendingLabel:string}){
  const {pending,data}=useFormStatus();
  const active=pending&&(!props.name||data?.get(props.name)===props.value);
  return <button {...props} disabled={pending||props.disabled}>{active?pendingLabel:children}</button>;
}
