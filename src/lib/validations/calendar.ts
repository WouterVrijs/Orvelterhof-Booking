import { z } from "zod";

export const createBlockedPeriodSchema = z
  .object({
    startDate: z.coerce.date({ error: "Startdatum is verplicht" }),
    endDate: z.coerce.date({ error: "Einddatum is verplicht" }),
    reason: z.string().optional(),
    blockType: z.enum(["MANUAL", "MAINTENANCE", "OWNER", "OTHER"]).default("MANUAL"),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Einddatum moet na startdatum liggen",
    path: ["endDate"],
  });

export const updateBlockedPeriodSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reason: z.string().optional(),
  blockType: z.enum(["MANUAL", "MAINTENANCE", "OWNER", "OTHER"]).optional(),
});

export type CreateBlockedPeriodInput = z.infer<typeof createBlockedPeriodSchema>;
export type UpdateBlockedPeriodInput = z.infer<typeof updateBlockedPeriodSchema>;
