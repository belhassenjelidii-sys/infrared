"use client";

import { useState } from "react";
import ActionForm, { SubmitButton, type ActionResult } from "@/components/ActionForm";

type DeliveryCompany = { id: string; name: string };

export default function DeliveryAssignmentForm({
  action,
  companies,
  deliveryCompanyId,
  manualFirstName,
  manualLastName,
  manualPhone,
  trackingNumber,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  companies: DeliveryCompany[];
  deliveryCompanyId: string | null;
  manualFirstName: string | null;
  manualLastName: string | null;
  manualPhone: string | null;
  trackingNumber: string | null;
}) {
  const initialProvider = deliveryCompanyId ?? (manualFirstName || manualLastName || manualPhone ? "manual" : "");
  const [provider, setProvider] = useState(initialProvider);
  const manual = provider === "manual";

  return (
    <ActionForm action={action} refreshOnSuccess className="mt-4 grid gap-3">
      <label className="grid gap-1 text-sm">
        Transporteur
        <select name="deliveryProvider" value={provider} onChange={(event) => setProvider(event.target.value)} className="min-h-11 rounded-lg border px-3">
          <option value="">Non affecté</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          <option value="manual">Livreur manuel</option>
        </select>
      </label>
      {manual && <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">Prénom<input name="manualDeliveryFirstName" required defaultValue={manualFirstName ?? ""} maxLength={80} className="min-h-11 rounded-lg border px-3" /></label>
        <label className="grid gap-1 text-sm">Nom<input name="manualDeliveryLastName" required defaultValue={manualLastName ?? ""} maxLength={80} className="min-h-11 rounded-lg border px-3" /></label>
        <label className="grid gap-1 text-sm sm:col-span-2">Téléphone<input name="manualDeliveryPhone" required type="tel" defaultValue={manualPhone ?? ""} maxLength={40} className="min-h-11 rounded-lg border px-3" /></label>
      </div>}
      <label className="grid gap-1 text-sm">N° de suivi<input name="trackingNumber" defaultValue={trackingNumber ?? ""} maxLength={120} className="min-h-11 rounded-lg border px-3" /></label>
      <div><SubmitButton>Enregistrer l’affectation</SubmitButton></div>
    </ActionForm>
  );
}
