import { z } from "zod";

export const createReservationSchema = z
  .object({
    firstName: z.string().min(1, "Voornaam is verplicht"),
    lastName: z.string().min(1, "Achternaam is verplicht"),
    email: z.string().email("Ongeldig e-mailadres"),
    phone: z.string().optional(),
    arrivalDate: z.coerce.date({ error: "Aankomstdatum is verplicht" }),
    departureDate: z.coerce.date({ error: "Vertrekdatum is verplicht" }),
    numberOfGuests: z.coerce
      .number()
      .int()
      .min(1, "Minimaal 1 gast"),
    guestNote: z.string().optional(),
    internalNote: z.string().optional(),
    source: z.enum(["WEBSITE", "MANUAL", "PHONE", "EMAIL"]).default("MANUAL"),
  })
  .refine((data) => data.departureDate > data.arrivalDate, {
    message: "Vertrekdatum moet na aankomstdatum liggen",
    path: ["departureDate"],
  });

export const updateReservationSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht").optional(),
  lastName: z.string().min(1, "Achternaam is verplicht").optional(),
  email: z.string().email("Ongeldig e-mailadres").optional(),
  phone: z.string().optional(),
  arrivalDate: z.coerce.date().optional(),
  departureDate: z.coerce.date().optional(),
  numberOfGuests: z.coerce.number().int().min(1).optional(),
  guestNote: z.string().optional(),
  internalNote: z.string().optional(),
  totalPrice: z.coerce.number().min(0).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "CONFIRMED", "CANCELLED"]),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
