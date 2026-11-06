// R1 299.00 style (South African thousands space, decimal point)
export function rand(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const frac = (abs % 100).toString().padStart(2, "0");
  return `${negative ? "-" : ""}R${whole}.${frac}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dispatchText(min: number, max: number): string {
  if (max <= 0) return "Usually dispatched the same working day";
  if (min === max) return `Usually dispatched within ${max} working day${max === 1 ? "" : "s"}`;
  return `Usually dispatched within ${min}–${max} working days`;
}

// Profit on the items (selling price minus cost). Null when any cost is unknown.
export function itemsProfit(items: { quantity: number; line_total_cents: number; cost_cents: number | null }[]): number | null {
  let profit = 0;
  for (const i of items) {
    if (i.cost_cents === null || i.cost_cents === undefined) return null;
    profit += i.line_total_cents - i.cost_cents * i.quantity;
  }
  return profit;
}
