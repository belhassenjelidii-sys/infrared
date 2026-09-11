// Tunisian Dinar formatting — 3 decimals (millimes) per local convention.
// Prisma returns Decimal instances on server-rendered admin pages, while
// public catalogue data uses plain numbers.
export function formatDT(amount: number | string | { toString(): string }) {
  const n = Number(amount);
  return `${n.toFixed(3)} DT`;
}
