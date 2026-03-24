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

export const paymentStatusEnum = pgEnum("payment_status", [
  "UNPAID",
  "PARTIAL",
  "PAID",
  "REFUNDED",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "BANK_TRANSFER",
  "CASH",
  "IDEAL",
  "CREDITCARD",
  "MOLLIE",
  "OTHER",
]);

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "USER"]);

// --- Users ---

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("USER"),
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
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("UNPAID"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  // Borgsom
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  depositStatus: varchar("deposit_status", { length: 20 }).notNull().default("PENDING"),
  depositReceivedAt: date("deposit_received_at"),
  depositReturnedAt: date("deposit_returned_at"),
  depositReturnedAmount: numeric("deposit_returned_amount", { precision: 10, scale: 2 }),
  depositRetentionReason: text("deposit_retention_reason"),
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

// --- Payments ---

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  reservationId: uuid("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  description: varchar("description", { length: 500 }),
  molliePaymentId: varchar("mollie_payment_id", { length: 100 }),
  mollieStatus: varchar("mollie_status", { length: 50 }),
  paidAt: date("paid_at").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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

// --- Seasons ---

export const seasons = pgTable("seasons", {
  id: uuid("id").defaultRandom().primaryKey(),
  year: integer("year").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Stay Type Prices ---

export const stayTypeEnum = pgEnum("stay_type", [
  "WEEKEND",
  "LONG_WEEKEND",
  "MIDWEEK",
  "WEEK",
]);

export const stayTypePrices = pgTable("stay_type_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  seasonId: uuid("season_id")
    .notNull()
    .references(() => seasons.id, { onDelete: "cascade" }),
  stayType: stayTypeEnum("stay_type").notNull(),
  nights: integer("nights").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Special Arrangements ---

export const specialArrangements = pgTable("special_arrangements", {
  id: uuid("id").defaultRandom().primaryKey(),
  year: integer("year").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  isBooked: boolean("is_booked").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// --- Invoices ---

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "SENT",
  "PAID",
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  reservationId: uuid("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
  status: invoiceStatusEnum("status").notNull().default("DRAFT"),
  // Snapshot of data at invoice creation
  guestName: varchar("guest_name", { length: 500 }).notNull(),
  guestEmail: varchar("guest_email", { length: 255 }).notNull(),
  accommodationName: varchar("accommodation_name", { length: 255 }).notNull(),
  arrivalDate: date("arrival_date").notNull(),
  departureDate: date("departure_date").notNull(),
  numberOfGuests: integer("number_of_guests").notNull(),
  // Financials
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("21.00"),
  vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  // Line items stored as JSON snapshot
  lineItems: text("line_items").notNull(), // JSON string
  // Dates
  invoiceDate: date("invoice_date").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
export type Season = typeof seasons.$inferSelect;
export type StayTypePrice = typeof stayTypePrices.$inferSelect;
export type SpecialArrangement = typeof specialArrangements.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
