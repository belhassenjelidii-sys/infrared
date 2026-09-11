export type StoreStatusOverride = "auto" | "open" | "closed";
export type StoreLiveStatus = "open" | "closed";
export type StoreHoursRow = { day: string; hours: string };

const TUNIS_TZ = "Africa/Tunis";
const DAY_NAMES: Record<string, number> = {
  dimanche: 0,
  sunday: 0,
  lundi: 1,
  monday: 1,
  mardi: 2,
  tuesday: 2,
  mercredi: 3,
  wednesday: 3,
  jeudi: 4,
  thursday: 4,
  vendredi: 5,
  friday: 5,
  samedi: 6,
  saturday: 6,
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function dayIndex(value: string) {
  return DAY_NAMES[normalize(value)] ?? null;
}

function rowMatchesDay(label: string, targetDay: number) {
  const clean = normalize(label);
  const exact = dayIndex(clean);
  if (exact !== null) return exact === targetDay;

  // Accept compact ranges such as "Lundi – Samedi" / "Monday-Friday".
  const parts = clean.split(/\s*(?:–|—|-)\s*/).filter(Boolean);
  if (parts.length === 2) {
    const start = dayIndex(parts[0]);
    const end = dayIndex(parts[1]);
    if (start !== null && end !== null) {
      return start <= end
        ? targetDay >= start && targetDay <= end
        : targetDay >= start || targetDay <= end;
    }
  }
  return false;
}

export function parseStoreHours(json: string | null | undefined): StoreHoursRow[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is { day: unknown; hours: unknown } => Boolean(row) && typeof row === "object")
      .map((row) => ({
        day: typeof row.day === "string" ? row.day.trim() : "",
        hours: typeof row.hours === "string" ? row.hours.trim() : "",
      }))
      .filter((row) => row.day && row.hours);
  } catch {
    return [];
  }
}

export function getHoursForDay(hours: StoreHoursRow[], day: string) {
  const index = dayIndex(day);
  if (index === null) return "";
  return hours.find((row) => rowMatchesDay(row.day, index))?.hours ?? "";
}

function localDayAndMinutes(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TUNIS_TZ,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const day = dayIndex(values.weekday || "");
  if (day === null) return null;
  return { day, minutes: Number(values.hour) * 60 + Number(values.minute) };
}

function parseInterval(segment: string) {
  // 09:30 - 19:30, 9h30–19h30, 9 - 19, etc.
  const match = segment.match(/(\d{1,2})(?:\s*[:h]\s*(\d{1,2}))?\s*(?:–|—|-)\s*(\d{1,2})(?:\s*[:h]\s*(\d{1,2}))?/i);
  if (!match) return null;
  const openHour = Number(match[1]);
  const openMinute = Number(match[2] || 0);
  const closeHour = Number(match[3]);
  const closeMinute = Number(match[4] || 0);
  if (openHour > 23 || closeHour > 23 || openMinute > 59 || closeMinute > 59) return null;
  return { open: openHour * 60 + openMinute, close: closeHour * 60 + closeMinute };
}

export function isOpenFromManualHours(hours: StoreHoursRow[] | undefined, now = new Date()): boolean | null {
  if (!hours?.length) return null;
  const local = localDayAndMinutes(now);
  if (!local) return null;
  const row = hours.find((item) => rowMatchesDay(item.day, local.day));
  if (!row) return null;

  const value = normalize(row.hours);
  if (/^(ferme|fermee|closed|off|—|-)$/.test(value)) return false;
  if (/^(24h|24\/24|24h\/24|ouvert 24h\/24)$/.test(value)) return true;

  const intervals = row.hours
    .split(/\s*(?:\/|;|,|\bet\b)\s*/i)
    .map(parseInterval)
    .filter((interval): interval is { open: number; close: number } => Boolean(interval));

  if (!intervals.length) return null;
  return intervals.some(({ open, close }) =>
    close > open
      ? local.minutes >= open && local.minutes < close
      : local.minutes >= open || local.minutes < close
  );
}

export function getStoreLiveStatus(args: {
  statusOverride?: string | null;
  hours?: StoreHoursRow[];
}): StoreLiveStatus {
  if (args.statusOverride === "open") return "open";
  if (args.statusOverride === "closed") return "closed";
  return isOpenFromManualHours(args.hours) ? "open" : "closed";
}

export function storeStatusLabel(status: StoreLiveStatus) {
  return status === "open" ? "Ouverte" : "Fermée";
}
