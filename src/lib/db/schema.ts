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

// --- Pricing Settings ---

export const pricingStrategyEnum = pgEnum("pricing_strategy", [
  "PER_NIGHT",
  "FIXED_PER_STAY",
]);

export const pricingSettings = pgTable("pricing_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  strategy: pricingStrategyEnum("strategy").notNull().default("PER_NIGHT"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  cleaningFee: numeric("cleaning_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Accommodation Settings ---

export const accommodationSettings = pgTable("accommodation_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  accommodationName: varchar("accommodation_name", { length: 255 })
    .notNull()
    .default("Orvelterhof"),
  contactEmail: varchar("contact_email", { length: 255 })
    .notNull()
    .default(""),
  contactPhone: varchar("contact_phone", { length: 50 }),
  checkInTime: varchar("check_in_time", { length: 5 })
    .notNull()
    .default("15:00"),
  checkOutTime: varchar("check_out_time", { length: 5 })
    .notNull()
    .default("10:00"),
  maxGuests: integer("max_guests").notNull().default(36),
  minStayNights: integer("min_stay_nights").notNull().default(1),
  defaultCleaningFee: numeric("default_cleaning_fee", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("0"),
  defaultDeposit: numeric("default_deposit", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Cost Items ---

export const costItemTypeEnum = pgEnum("cost_item_type", [
  "FIXED",
  "PER_PERSON",
  "PER_NIGHT",
  "PER_PERSON_PER_NIGHT",
  "PER_UNIT",
]);

export const costItemCategoryEnum = pgEnum("cost_item_category", [
  "BASE",
  "MANDATORY",
  "UPGRADE",
]);

export const costItems = pgTable("cost_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: costItemTypeEnum("type").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  category: costItemCategoryEnum("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Reservation Line Items ---

export const reservationLineItems = pgTable("reservation_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  reservationId: uuid("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  costItemId: uuid("cost_item_id").references(() => costItems.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Audit Logs ---

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for extra context
  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Type exports ---

export type AuditLog = typeof auditLogs.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type BlockedPeriod = typeof blockedPeriods.$inferSelect;
export type NewBlockedPeriod = typeof blockedPeriods.$inferInsert;
export type PricingSettings = typeof pricingSettings.$inferSelect;
export type AccommodationSettings = typeof accommodationSettings.$inferSelect;
export type CostItem = typeof costItems.$inferSelect;
export type ReservationLineItem = typeof reservationLineItems.$inferSelect;
