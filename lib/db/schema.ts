import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const siteObjects = pgTable("site_objects", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").references(() => sites.id),
  objectType: text("object_type").notNull(),
  geometry: jsonb("geometry").notNull(),
  measurements: jsonb("measurements").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const estimates = pgTable("estimates", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").references(() => sites.id),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  status: text("status").default("Draft"),
  total: numeric("total", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const costCodes = pgTable("cost_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(),
  label: text("label").notNull(),
  trade: text("trade").notNull(),
});

export const estimateLineItems = pgTable("estimate_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  costCodeId: uuid("cost_code_id").references(() => costCodes.id),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  userId: uuid("user_id").references(() => users.id),
  status: text("status").default("Active"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const jobBudgets = pgTable("job_budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobs.id),
  estimateLineItemId: uuid("estimate_line_item_id").references(() => estimateLineItems.id),
  budgetTotal: numeric("budget_total", { precision: 12, scale: 2 }).notNull(),
});

export const jobCosts = pgTable("job_costs", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobs.id),
  costCodeId: uuid("cost_code_id").references(() => costCodes.id),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const changeOrders = pgTable("change_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobs.id),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  status: text("status").default("Pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
