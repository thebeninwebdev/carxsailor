"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import type {CarPreference} from "@/types";
export function ResumeDecision({preference}:{preference:CarPreference}){const router=useRouter();const[error,setError]=useState("");return <div><button className="btn btn-dark" onClick={()=>{try{sessionStorage.setItem("carxsailor-draft",JSON.stringify({preference,step:3}));router.push("/car-adviser")}catch{setError("Enable browser storage to reopen this decision.")}}}>Review & refresh matches ↗</button>{error&&<p role="alert">{error}</p>}</div>}
