"use client";

import { useState } from "react";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { savePromotionAction } from "./actions";

export default function PromotionEditor({productId,price,discount,compact=false}:{productId:string;price:number;discount?:number|null;compact?:boolean}){
  const [mode,setMode]=useState<"percentage"|"price">(discount?"percentage":"price");
  return <ActionForm action={savePromotionAction} refreshOnSuccess className={compact?"grid min-w-64 gap-2":"grid gap-3 sm:grid-cols-[160px_180px_auto]"}>
    <input type="hidden" name="productId" value={productId}/>
    <select name="mode" value={mode} onChange={event=>setMode(event.target.value as "percentage"|"price")} className="min-h-10 rounded-lg border px-3 text-sm"><option value="percentage">Réduction en %</option><option value="price">Prix promotionnel</option></select>
    {mode==="percentage"?<select name="percentage" defaultValue={discount&&discount%5===0?discount:10} className="min-h-10 rounded-lg border px-3 text-sm">{Array.from({length:18},(_,index)=>(index+1)*5).map(value=><option key={value} value={value}>-{value} %</option>)}</select>:<input name="promoPrice" type="number" min="0.001" step="0.001" defaultValue={price.toFixed(3)} aria-label="Prix promotionnel" className="min-h-10 rounded-lg border px-3 text-sm"/>}
    <SubmitButton>{compact?"Mettre à jour":"Activer la promotion"}</SubmitButton>
  </ActionForm>;
}

export function PromotionCreator({products}:{products:{id:string;label:string}[]}){
  const [mode,setMode]=useState<"percentage"|"price">("percentage");
  return <ActionForm action={savePromotionAction} refreshOnSuccess className="mt-5 grid gap-3 lg:grid-cols-[minmax(280px,1fr)_170px_180px_auto]">
    <select name="productId" required className="min-h-11 rounded-lg border px-3 text-sm"><option value="">Choisir un article…</option>{products.map(product=><option key={product.id} value={product.id}>{product.label}</option>)}</select>
    <select name="mode" value={mode} onChange={event=>setMode(event.target.value as "percentage"|"price")} className="min-h-11 rounded-lg border px-3 text-sm"><option value="percentage">Réduction en %</option><option value="price">Prix promotionnel</option></select>
    {mode==="percentage"?<select name="percentage" defaultValue={10} className="min-h-11 rounded-lg border px-3 text-sm">{Array.from({length:18},(_,index)=>(index+1)*5).map(value=><option key={value} value={value}>-{value} %</option>)}</select>:<input name="promoPrice" type="number" min="0.001" step="0.001" required placeholder="Prix promo (TND)" className="min-h-11 rounded-lg border px-3 text-sm"/>}
    <SubmitButton>Activer</SubmitButton>
  </ActionForm>;
}
