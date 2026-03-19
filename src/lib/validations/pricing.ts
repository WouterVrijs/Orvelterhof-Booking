import { z } from "zod";

export const updatePricingSchema = z.object({
  strategy: z.enum(["PER_NIGHT", "FIXED_PER_STAY"]),
  basePrice: z.coerce.number().min(0, "Prijs moet minimaal 0 zijn"),
  cleaningFee: z.coerce.number().min(0, "Schoonmaakkosten moeten minimaal 0 zijn"),
  depositAmount: z.coerce.number().min(0, "Borg moet minimaal 0 zijn"),
});

export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
