// The smallest schema that can carry the core interaction: one row per
// stroke, no accounts, nothing else to normalise against.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface Mark {
  id: number;
  hand: string;
  note: string;
  color: string;
  createdAt: string;
}

const dbPath = process.env.DATA_DIR
  ? `${process.env.DATA_DIR}/scroll.db`
  : fileURLToPath(new URL("../data/scroll.db", import.meta.url));

mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hand TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

const insertStmt = db.prepare(
  "INSERT INTO marks (hand, note, color, created_at) VALUES (?, ?, ?, ?)",
);
const selectAllStmt = db.prepare(
  "SELECT id, hand, note, color, created_at AS createdAt FROM marks ORDER BY id ASC",
);

const selectAfterStmt = db.prepare(
  "SELECT id, hand, note, color, created_at AS createdAt FROM marks WHERE id > ? ORDER BY id ASC",
);

export function addMark(hand: string, note: string, color: string): Mark {
  const createdAt = new Date().toISOString();
  const result = insertStmt.run(hand, note, color, createdAt);
  return { id: Number(result.lastInsertRowid), hand, note, color, createdAt };
}

export function listMarks(): Mark[] {
  return selectAllStmt.all() as unknown as Mark[];
}

export function listMarksAfter(id: number): Mark[] {
  return selectAfterStmt.all(id) as unknown as Mark[];
}
