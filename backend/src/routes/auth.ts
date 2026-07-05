import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../db";
import { signToken } from "../middleware/auth";
import { User } from "../types";

const router = Router();

const credentialsSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
});

// POST /api/auth/signup  { username, password } -> { token, user }
router.post("/signup", (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid signup payload", details: parsed.error.flatten() });
  }
  const { username, password } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, password_hash);

  const user = { id: Number(result.lastInsertRowid), username };
  const token = signToken(user);
  res.status(201).json({ token, user });
});

// POST /api/auth/login  { username, password } -> { token, user }
router.post("/login", (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid login payload" });
  }
  const { username, password } = parsed.data;

  const row = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as User | undefined;
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Incorrect username or password" });
  }

  const user = { id: row.id, username: row.username };
  const token = signToken(user);
  res.json({ token, user });
});

export default router;
