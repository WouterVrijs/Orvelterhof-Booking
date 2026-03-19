import { z } from "zod";

export const updateSettingsSchema = z.object({
  accommodationName: z.string().min(1, "Naam accommodatie is verplicht"),
  contactEmail: z.string().email("Ongeldig e-mailadres"),
  contactPhone: z.string().optional(),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, "Gebruik formaat HH:MM"),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, "Gebruik formaat HH:MM"),
  maxGuests: z.coerce.number().int().min(1, "Minimaal 1 gast"),
  minStayNights: z.coerce.number().int().min(1, "Minimaal 1 nacht"),
  defaultCleaningFee: z.coerce.number().min(0),
  defaultDeposit: z.coerce.number().min(0),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
