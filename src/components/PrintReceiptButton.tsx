"use client";

import { Printer } from "lucide-react";

export default function PrintReceiptButton() {
  return <button type="button" onClick={() => window.print()} className="no-print mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-black/15 px-4 text-sm font-semibold transition hover:border-red hover:text-red">
    <Printer size={17} /> Imprimer le reçu
  </button>;
}
