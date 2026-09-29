import { getLibsqlClient } from "./client";

const DDL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_login_at TEXT,
  session_version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS connectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive')),
  sync_time TEXT NOT NULL DEFAULT '02:00:00',
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_synced_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (business_unit_id) REFERENCES business_units(id)
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  connector_id INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('schedule','manual')),
  attempt_no INTEGER NOT NULL DEFAULT 1,
  records_fetched INTEGER NOT NULL DEFAULT 0,
  records_saved INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  FOREIGN KEY (connector_id) REFERENCES connectors(id)
);

CREATE INDEX IF NOT EXISTS idx_sl_conn_started ON sync_logs (connector_id, started_at);

CREATE TABLE IF NOT EXISTS donation_daily_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  summary_date TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  transaction_count INTEGER NOT NULL DEFAULT 0,
  sync_log_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (business_unit_id, summary_date),
  FOREIGN KEY (business_unit_id) REFERENCES business_units(id),
  FOREIGN KEY (sync_log_id) REFERENCES sync_logs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS donation_monthly_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  year_month TEXT NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  unique_donor_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE (business_unit_id, year_month),
  FOREIGN KEY (business_unit_id) REFERENCES business_units(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_al_created ON audit_logs (created_at);

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export async function migrate() {
  const client = getLibsqlClient();
  await client.execute("PRAGMA foreign_keys = ON");
  const statements = DDL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await client.execute(statement);
  }
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  migrate().then(() => {
    console.log("Migration complete");
  });
}
