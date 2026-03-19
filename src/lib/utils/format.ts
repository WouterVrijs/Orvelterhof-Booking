export function formatCurrency(amount: number | { toString(): string } | null | undefined): string {
  if (amount == null) return "—";
  const num = typeof amount === "number" ? amount : Number(amount.toString());
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

export function formatGuestCount(count: number): string {
  return count === 1 ? "1 gast" : `${count} gasten`;
}

export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}
