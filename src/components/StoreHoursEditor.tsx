"use client";

import { useMemo, useState } from "react";

type HoursRow = { day: string; hours: string };

const TIMES = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2).toString().padStart(2, "0");
  const minute = index % 2 ? "30" : "00";
  return `${hour}:${minute}`;
});

function parseHours(value: string) {
  if (/^fermé$/i.test(value.trim())) return { closed: true, open: "09:30", close: "19:30", open2: "", close2: "" };
  const parts = value.split(/\s*\/\s*/).map((part) => part.trim());
  const first = parts[0]?.match(/(\d{1,2}:\d{2})\s*(?:–|-|—)\s*(\d{1,2}:\d{2})/);
  const second = parts[1]?.match(/(\d{1,2}:\d{2})\s*(?:–|-|—)\s*(\d{1,2}:\d{2})/);
  return {
    closed: false,
    open: first?.[1] ?? "09:30",
    close: first?.[2] ?? "19:30",
    open2: second?.[1] ?? "",
    close2: second?.[2] ?? "",
  };
}

export default function StoreHoursEditor({
  days,
  initialHours,
}: {
  days: readonly string[];
  initialHours: HoursRow[];
}) {
  const initial = useMemo(() => Object.fromEntries(days.map((day) => [day, parseHours(initialHours.find((row) => row.day === day)?.hours ?? "Fermé")])), [days, initialHours]);
  const [rows, setRows] = useState(initial);
  const serialize = (row: (typeof rows)[string]) => {
    if (row.closed) return "Fermé";
    const first = `${row.open} – ${row.close}`;
    return row.open2 && row.close2 ? `${first} / ${row.open2} – ${row.close2}` : first;
  };

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {days.map((day) => {
        const row = rows[day];
        return (
          <div key={day} className="rounded-lg border border-line bg-white p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{day}</span>
              <label className="flex items-center gap-1.5 text-[11px] text-stone">
                <input
                  type="checkbox"
                  checked={row.closed}
                  onChange={(event) => setRows((current) => ({ ...current, [day]: { ...current[day], closed: event.target.checked } }))}
                />
                Fermé
              </label>
            </div>
            {!row.closed && (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-stone">Ouverture<select value={row.open} onChange={(event) => setRows((current) => ({ ...current, [day]: { ...current[day], open: event.target.value } }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-xs text-ink"><option value="">—</option>{TIMES.map((time) => <option key={time}>{time}</option>)}</select></label>
                  <label className="text-[11px] text-stone">Fermeture<select value={row.close} onChange={(event) => setRows((current) => ({ ...current, [day]: { ...current[day], close: event.target.value } }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-xs text-ink"><option value="">—</option>{TIMES.map((time) => <option key={time}>{time}</option>)}</select></label>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-stone">2e ouverture<select value={row.open2} onChange={(event) => setRows((current) => ({ ...current, [day]: { ...current[day], open2: event.target.value } }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-xs text-ink"><option value="">Aucune</option>{TIMES.map((time) => <option key={time}>{time}</option>)}</select></label>
                  <label className="text-[11px] text-stone">2e fermeture<select value={row.close2} onChange={(event) => setRows((current) => ({ ...current, [day]: { ...current[day], close2: event.target.value } }))} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-xs text-ink"><option value="">Aucune</option>{TIMES.map((time) => <option key={time}>{time}</option>)}</select></label>
                </div>
              </>
            )}
            <input type="hidden" name={`hours_${day.toLowerCase()}`} value={serialize(row)} />
          </div>
        );
      })}
    </div>
  );
}
