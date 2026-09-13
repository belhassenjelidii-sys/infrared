"use client";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
export type CartPriceUpdate = { items: { id: string; quantity: number; unitPrice: number }[]; subtotal: number; total: number };
export type ActionResult = { error?: string; success?: string; priceUpdate?: CartPriceUpdate };
export function SubmitButton({children = "Enregistrer", disabled = false}:{children?:React.ReactNode;disabled?:boolean}) {
  const {pending}=useFormStatus();
  return <button disabled={pending || disabled} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red px-5 text-sm font-semibold text-white hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-50">{pending?"Enregistrement…":children}</button>;
}
export default function ActionForm({action,children,className="grid gap-5",refreshOnSuccess=false,noValidate=false,onSubmit,onResult}:{action:(state:ActionResult,data:FormData)=>Promise<ActionResult>;children:React.ReactNode;className?:string;refreshOnSuccess?:boolean;noValidate?:boolean;onSubmit?:React.FormEventHandler<HTMLFormElement>;onResult?:(state:ActionResult)=>void}) {
  const [state,submit,pending]=useActionState(action,{});
  const router=useRouter();
  useEffect(()=>{if(refreshOnSuccess&&state.success)router.refresh();},[refreshOnSuccess,router,state.success]);
  useEffect(()=>{if(state.error||state.success)onResult?.(state);},[onResult,state]);
  return <form action={submit} className={className} noValidate={noValidate} onSubmit={onSubmit}><fieldset disabled={pending} className="contents">{children}</fieldset>{state.error&&<p role="alert" className="rounded-lg bg-red-soft p-3 text-sm text-red">{state.error}</p>}{state.success&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{state.success}</p>}</form>;
}
