"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import type { ActionResult } from "@/components/ActionForm";

export default function ConfirmDeleteDialog({
  action,
  itemLabel,
  compact = false,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  itemLabel: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const close = () => { setOpen(false); setConfirmation(""); };
  return <>
    <button type="button" onClick={() => setOpen(true)} className={compact ? "admin-action-button border-red/40 text-red" : "inline-flex min-h-11 items-center gap-2 rounded-lg border border-red/40 px-4 text-sm font-semibold text-red hover:bg-red/10"}><Trash2 size={compact ? 14 : 17}/>{compact ? "Supprimer" : "Supprimer définitivement"}</button>
    {open && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#111c2a] p-6 text-slate-100 shadow-2xl">
        <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-400"><AlertTriangle/></span><div className="min-w-0 flex-1"><h2 id="delete-dialog-title" className="text-xl font-bold">Supprimer définitivement cet élément ?</h2><p className="mt-2 text-sm text-slate-400"><strong className="text-slate-200">{itemLabel}</strong> sera supprimé de façon irréversible.</p></div><button type="button" aria-label="Fermer" onClick={close} className="text-slate-400 hover:text-white"><X/></button></div>
        <ActionForm action={action} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm"><span>Pour confirmer, tapez <strong>SUPPRIMER</strong></span><input name="confirmation" required pattern="SUPPRIMER" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-11 rounded-lg border border-slate-700 bg-[#0b1522] px-3 text-white" placeholder="SUPPRIMER"/></label>
          <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={close} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm">Annuler</button><SubmitButton disabled={confirmation !== "SUPPRIMER"}>Supprimer définitivement</SubmitButton></div>
        </ActionForm>
      </section>
    </div>}
  </>;
}
