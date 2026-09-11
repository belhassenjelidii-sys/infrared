"use client";
export default function PrintButton({ label = "Imprimer" }: { label?: string }) {
  return <button type="button" onClick={() => window.print()} className="print:hidden rounded-lg bg-red px-5 py-3 text-sm font-semibold text-white">{label}</button>;
}
