import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id),
  status: text("status", { enum: ["active", "inactive"] })
    .notNull()
    .default("active"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  lastLoginAt: text("last_login_at"),
  sessionVersion: integer("session_version").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const passwordResets = sqliteTable("password_resets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull(),
});

export const businessUnits = sqliteTable("business_units", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
});

export const connectors = sqliteTable("connectors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessUnitId: integer("business_unit_id")
    .notNull()
    .references(() => businessUnits.id),
  type: text("type").notNull(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  credentialsEncrypted: text("credentials_encrypted").notNull(),
  status: text("status", { enum: ["active", "inactive"] })
    .notNull()
    .default("inactive"),
  syncTime: text("sync_time").notNull().default("02:00:00"),
  maxRetries: integer("max_retries").notNull().default(3),
  lastSyncedAt: text("last_synced_at"),
  updatedAt: text("updated_at").notNull(),
});

export const syncLogs = sqliteTable(
  "sync_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    connectorId: integer("connector_id")
      .notNull()
      .references(() => connectors.id),
    startedAt: text("started_at").notNull(),
    finishedAt: text("finished_at"),
    status: text("status", { enum: ["running", "success", "failed"] }).notNull(),
    triggeredBy: text("triggered_by", { enum: ["schedule", "manual"] }).notNull(),
    attemptNo: integer("attempt_no").notNull().default(1),
    recordsFetched: integer("records_fetched").notNull().default(0),
    recordsSaved: integer("records_saved").notNull().default(0),
    errorMessage: text("error_message"),
  },
  (table) => [index("idx_sl_conn_started").on(table.connectorId, table.startedAt)],
);

export const donationDailySummary = sqliteTable(
  "donation_daily_summary",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    businessUnitId: integer("business_unit_id")
      .notNull()
      .references(() => businessUnits.id),
    summaryDate: text("summary_date").notNull(),
    totalAmount: real("total_amount").notNull().default(0),
    transactionCount: integer("transaction_count").notNull().default(0),
    syncLogId: integer("sync_log_id").references(() => syncLogs.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("uq_daily").on(table.businessUnitId, table.summaryDate)],
);

export const donationMonthlySummary = sqliteTable(
  "donation_monthly_summary",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    businessUnitId: integer("business_unit_id")
      .notNull()
      .references(() => businessUnits.id),
    yearMonth: text("year_month").notNull(),
    totalAmount: real("total_amount").notNull().default(0),
    transactionCount: integer("transaction_count").notNull().default(0),
    uniqueDonorCount: integer("unique_donor_count").notNull().default(0),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [uniqueIndex("uq_monthly").on(table.businessUnitId, table.yearMonth)],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    ipAddress: text("ip_address"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_al_created").on(table.createdAt)],
);

export const systemSettings = sqliteTable("system_settings", {
  settingKey: text("setting_key").primaryKey(),
  settingValue: text("setting_value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type RoleName = "owner" | "admin";
export type UserStatus = "active" | "inactive";
export type UserRow = typeof users.$inferSelect;
export type ConnectorRow = typeof connectors.$inferSelect;
