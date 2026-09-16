"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import ActionForm, { SubmitButton, type ActionResult } from "@/components/ActionForm";

export default function StockQuantityControl({ action, value }: { action: (state: ActionResult, formData: FormData) => Promise<ActionResult>; value: number | null }) {
  const [quantity, setQuantity] = useState(value === null ? "" : String(value));
  const amount = Number(quantity);
  const adjust = (delta: number) => setQuantity(String(Math.max(0, (Number.isFinite(amount) ? amount : 0) + delta)));
  return <ActionForm action={action} refreshOnSuccess className="flex items-center justify-end gap-2"><div className="flex h-10 items-center rounded-lg border border-line bg-mist/50"><button type="button" onClick={() => adjust(-1)} aria-label="Diminuer le stock" className="grid h-full w-9 place-items-center text-stone transition hover:bg-white hover:text-red"><Minus size={15}/></button><input name="stock" type="number" min="0" max="1000000" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="—" aria-label="Quantité en stock" className="h-full w-14 border-x border-line bg-white text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-red/20"/><button type="button" onClick={() => adjust(1)} aria-label="Augmenter le stock" className="grid h-full w-9 place-items-center text-stone transition hover:bg-white hover:text-red"><Plus size={15}/></button></div><SubmitButton>Enregistrer</SubmitButton></ActionForm>;
}
