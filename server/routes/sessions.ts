import { Router } from "express";
import { db } from "../db";
import {
  AddPuttsSchema,
  CreateSessionSchema,
  PuttRow,
  SessionListRow,
  SessionRow,
} from "../types";

const router = Router();

function getUserId(req: import("express").Request): string {
  const userId = req.header("x-user-id");
  if (!userId) {
    const err: any = new Error("Missing x-user-id header");
    err.code = 400;
    throw err;
  }
  return userId;
}

// GET /sessions
router.get("/", (req, res) => {
  try {
    const userId = getUserId(req);
    const rows = db
      .prepare<[string], SessionListRow>(
        `SELECT id, name, date, created_at
         FROM sessions
         WHERE user_id = ?
         ORDER BY datetime(created_at) DESC`
      )
      .all(userId);
    res.json(rows);
  } catch (e: any) {
    res.status(e.code || 500).json({ message: e.message });
  }
});

// POST /sessions  { name, date }
router.post("/", (req, res) => {
  try {
    const userId = getUserId(req);
    const parsed = CreateSessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const { name, date } = parsed.data;

    const info = db
      .prepare<[string, string, string], unknown>(
        `INSERT INTO sessions (user_id, name, date)
         VALUES (?, ?, ?)`
      )
      .run(userId, name, date);

    const session = db
      .prepare<[number], SessionListRow>(
        `SELECT id, name, date, created_at
         FROM sessions
         WHERE id = ?`
      )
      .get(info.lastInsertRowid as number);

    res.status(201).json(session);
  } catch (e: any) {
    res.status(e.code || 500).json({ message: e.message });
  }
});

// GET /sessions/:id
router.get("/:id", (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);

    const session = db
      .prepare<[number], SessionRow>(
        `SELECT id, user_id, name, date, created_at
         FROM sessions WHERE id = ?`
      )
      .get(id);

    if (!session || session.user_id !== userId) return res.sendStatus(404);

    const putts = db
      .prepare<[number], PuttRow>(
        `SELECT id, session_id, distance_m, attempts, makes, created_at
         FROM putts
         WHERE session_id = ?
         ORDER BY distance_m ASC, id ASC`
      )
      .all(id);

    res.json({ ...session, putts });
  } catch (e: any) {
    res.status(e.code || 500).json({ message: e.message });
  }
});

// DELETE /sessions/:id
router.delete("/:id", (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);

    const owned = db
      .prepare<[number], { user_id: string }>(
        `SELECT user_id FROM sessions WHERE id = ?`
      )
      .get(id);

    if (!owned || owned.user_id !== userId) return res.sendStatus(404);

    db.prepare<[number], unknown>(`DELETE FROM putts WHERE session_id = ?`).run(
      id
    );
    db.prepare<[number], unknown>(`DELETE FROM sessions WHERE id = ?`).run(id);
    res.sendStatus(204);
  } catch (e: any) {
    res.status(e.code || 500).json({ message: e.message });
  }
});

// POST /sessions/:id/putts  { distance_m, attempts, makes }
router.post("/:id/putts", (req, res) => {
  try {
    const userId = getUserId(req);
    const sessionId = Number(req.params.id);

    const owned = db
      .prepare<[number], { user_id: string }>(
        `SELECT user_id FROM sessions WHERE id = ?`
      )
      .get(sessionId);

    if (!owned || owned.user_id !== userId) return res.sendStatus(404);

    const parsed = AddPuttsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const { distance_m, attempts, makes } = parsed.data;

    const info = db
      .prepare<[number, number, number, number], unknown>(
        `INSERT INTO putts (session_id, distance_m, attempts, makes)
         VALUES (?, ?, ?, ?)`
      )
      .run(sessionId, distance_m, attempts, makes);

    const row = db
      .prepare<[number], PuttRow>(
        `SELECT id, session_id, distance_m, attempts, makes, created_at
         FROM putts WHERE id = ?`
      )
      .get(info.lastInsertRowid as number);

    res.status(201).json(row);
  } catch (e: any) {
    res.status(e.code || 500).json({ message: e.message });
  }
});

// PATCH /sessions/:id/putts/:puttId  { attempts?, makes? }
router.patch("/:id/putts/:puttId", (req, res) => {
  try {
    const userId = getUserId(req);
    const sessionId = Number(req.params.id);
    const puttId = Number(req.params.puttId);

    const owned = db
      .prepare<[number], { user_id: string }>(
        `SELECT user_id FROM sessions WHERE id = ?`
      )
      .get(sessionId);
    if (!owned || owned.user_id !== userId) return res.sendStatus(404);

    const attempts = req.body.attempts as number | undefined;
    const makes = req.body.makes as number | undefined;

    if (attempts !== undefined && attempts < 0)
      return res.status(400).json({ message: "attempts must be >= 0" });
    if (makes !== undefined && makes < 0)
      return res.status(400).json({ message: "makes must be >= 0" });
    if (attempts !== undefined && makes !== undefined && makes > attempts)
      return res.status(400).json({ message: "makes cannot exceed attempts" });

    const exists = db
      .prepare<[number, number], PuttRow>(
        `SELECT id, session_id, distance_m, attempts, makes, created_at
         FROM putts WHERE id = ? AND session_id = ?`
      )
      .get(puttId, sessionId);
    if (!exists) return res.sendStatus(404);

    if (attempts !== undefined)
      db.prepare<[number, number], unknown>(
        `UPDATE putts SET attempts = ? WHERE id = ?`
      ).run(attempts, puttId);
    if (makes !== undefined)
      db.prepare<[number, number], unknown>(
        `UPDATE putts SET makes = ? WHERE id = ?`
      ).run(makes, puttId);

    const updated = db
      .prepare<[number], PuttRow>(
        `SELECT id, session_id, distance_m, attempts, makes, created_at
         FROM putts WHERE id = ?`
      )
      .get(puttId);

    res.json(updated);
  } catch (e: any) {
    res.status(e.code || 500).json({ message: e.message });
  }
});

// DELETE /sessions/:id/putts/:puttId
router.delete("/:id/putts/:puttId", (req, res) => {
  try {
    const userId = getUserId(req);
    const sessionId = Number(req.params.id);
    const puttId = Number(req.params.puttId);

    const owned = db
      .prepare<[number], { user_id: string }>(
        `SELECT user_id FROM sessions WHERE id = ?`
      )
      .get(sessionId);
    if (!owned || owned.user_id !== userId) return res.sendStatus(404);

    db.prepare<[number, number], unknown>(
      `DELETE FROM putts WHERE id = ? AND session_id = ?`
    ).run(puttId, sessionId);

    res.sendStatus(204);
  } catch (e: any) {
    res.status(e.code || 500).json({ message: e.message });
  }
});

export default router;
