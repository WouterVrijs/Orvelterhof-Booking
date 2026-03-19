import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  boolean,
  integer,
  numeric,
  text,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const reservationStatusEnum = pgEnum("reservation_status", [
  "NEW",
  "IN_PROGRESS",
  "CONFIRMED",
  "CANCELLED",
]);

export const reservationSourceEnum = pgEnum("reservation_source", [
  "WEBSITE",
  "MANUAL",
  "PHONE",
  "EMAIL",
]);

// --- Users ---

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Password Reset Tokens ---

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Reservations ---

export const reservations = pgTable("reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  reservationNumber: varchar("reservation_number", { length: 20 })
    .notNull()
    .unique(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  arrivalDate: date("arrival_date").notNull(),
  departureDate: date("departure_date").notNull(),
  numberOfGuests: integer("number_of_guests").notNull(),
  status: reservationStatusEnum("status").notNull().default("NEW"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }),
  guestNote: text("guest_note"),
  internalNote: text("internal_note"),
  source: reservationSourceEnum("source").notNull().default("MANUAL"),
  statusChangedAt: timestamp("status_changed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Blocked Periods ---

export const blockTypeEnum = pgEnum("block_type", [
  "MANUAL",
  "MAINTENANCE",
  "OWNER",
  "OTHER",
]);

export const blockedPeriods = pgTable("blocked_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  blockType: blockTypeEnum("block_type").notNull().default("MANUAL"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Type exports ---

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type BlockedPeriod = typeof blockedPeriods.$inferSelect;
export type NewBlockedPeriod = typeof blockedPeriods.$inferInsert;
