/**
 * Generates a unique reservation number in format: ORV-YYYYMMDD-XXXX
 * where XXXX is a random 4-digit alphanumeric code.
 */
export function generateReservationNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded confusing chars
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `ORV-${datePart}-${randomPart}`;
}
