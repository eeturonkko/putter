import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// If DATABASE_URL is given, use it; otherwise default to /server/data/putter.db
const defaultDir = path.join(__dirname, "data");
const defaultPath = path.join(defaultDir, "putter.db");

const dbPath = process.env.DATABASE_URL || defaultPath;
const dir = path.dirname(dbPath);

// Ensure the directory exists
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS putts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  distance_m INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  makes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_putts_session ON putts(session_id);
`);
