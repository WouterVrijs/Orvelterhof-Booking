import { db } from "@/lib/db";
import { pricingSettings } from "@/lib/db/schema";
import { getNights } from "@/lib/utils/dates";

export interface PriceCalculation {
  baseAmount: number;
  cleaningFee: number;
  depositAmount: number;
  totalPrice: number;
  nights: number;
  strategy: "PER_NIGHT" | "FIXED_PER_STAY";
}

/**
 * Calculate the total price for a reservation based on the current pricing settings.
 */
export async function calculatePrice(
  arrivalDate: Date,
  departureDate: Date
): Promise<PriceCalculation> {
  const [settings] = await db.select().from(pricingSettings).limit(1);

  const nights = getNights(arrivalDate, departureDate);
  const basePrice = settings ? parseFloat(settings.basePrice) : 0;
  const cleaningFee = settings ? parseFloat(settings.cleaningFee) : 0;
  const depositAmount = settings ? parseFloat(settings.depositAmount) : 0;
  const strategy = (settings?.strategy ?? "PER_NIGHT") as
    | "PER_NIGHT"
    | "FIXED_PER_STAY";

  const baseAmount =
    strategy === "PER_NIGHT" ? basePrice * nights : basePrice;

  const totalPrice = baseAmount + cleaningFee;

  return {
    baseAmount,
    cleaningFee,
    depositAmount,
    totalPrice,
    nights,
    strategy,
  };
}
