"use client";

import ActionForm, { SubmitButton, type ActionResult } from "@/components/ActionForm";

export default function PreparationStoreForm({ action, stores, storeId, disabled = false }: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  stores: { id: string; name: string; address: string }[];
  storeId: string | null;
  disabled?: boolean;
}) {
  return <ActionForm action={action} refreshOnSuccess className="mt-4 grid gap-3">
    <label className="grid gap-1 text-sm">Boutique de préparation
      <select name="preparationStoreId" defaultValue={storeId ?? ""} disabled={disabled} className="min-h-11 rounded-lg border px-3 disabled:cursor-not-allowed disabled:bg-mist">
        <option value="">Non affectée</option>
        {stores.map((store) => <option key={store.id} value={store.id}>{store.name} — {store.address}</option>)}
      </select>
    </label>
    {!disabled && <div><SubmitButton>Enregistrer la boutique</SubmitButton></div>}
  </ActionForm>;
}
