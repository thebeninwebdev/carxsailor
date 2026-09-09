"use client";
import {useState} from "react";
export function ContactForm(){
  const [message,setMessage]=useState("");
  return <form className="card mt-8 grid gap-4 p-7" onSubmit={event=>{
    event.preventDefault();const form=new FormData(event.currentTarget);
    window.location.href="mailto:hello@carxsailor.com?subject="+encodeURIComponent("CarXSailor inquiry")+"&body="+encodeURIComponent(String(form.get("message"))+"\n\nReply to: "+String(form.get("email")));
    setMessage("Continue in your email app to send this message.");
  }}><label><span className="label">Email</span><input className="input" name="email" type="email" required/></label><label><span className="label">Message</span><textarea className="input min-h-32" name="message" required/></label><button className="btn btn-dark">Email CarxSailor</button>{message&&<p role="status" className="text-sm">{message}</p>}</form>;
}
