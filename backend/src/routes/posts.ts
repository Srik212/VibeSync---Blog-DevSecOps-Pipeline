import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, optionalAuth, AuthedRequest } from "../middleware/auth";
import { Post } from "../types";

const router = Router();

function serializePost(row: Post) {
  return { ...row, tags: JSON.parse(row.tags) as string[] };
}

const postSchema = z.object({
  title: z.string().min(1).max(200),
  content_md: z.string().min(1),
  tags: z.array(z.string()).max(10).default([]),
  emoji: z.string().max(8).default("📝"),
});

// GET /api/posts?search=&tag=&emoji=  (public, optional auth for "did I react" data)
router.get("/", optionalAuth, (req, res) => {
  const { search, tag, emoji } = req.query as { search?: string; tag?: string; emoji?: string };

  let rows = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all() as Post[];

  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (p) => p.title.toLowerCase().includes(s) || p.content_md.toLowerCase().includes(s)
    );
  }
  if (tag) {
    rows = rows.filter((p) => (JSON.parse(p.tags) as string[]).includes(tag));
  }
  if (emoji) {
    rows = rows.filter((p) => p.emoji === emoji);
  }

  res.json(rows.map(serializePost));
});

// GET /api/posts/:id  -> post + comments + reaction counts
router.get("/:id", optionalAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id) as Post | undefined;
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comments = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, u.username AS author
       FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`
    )
    .all(post.id);

  const reactionCounts = db
    .prepare(`SELECT emoji, COUNT(*) AS count FROM reactions WHERE post_id = ? GROUP BY emoji`)
    .all(post.id);

  res.json({ ...serializePost(post), comments, reactions: reactionCounts });
});

// POST /api/posts  (auth required)
router.post("/", requireAuth, (req: AuthedRequest, res) => {
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid post payload", details: parsed.error.flatten() });

  const { title, content_md, tags, emoji } = parsed.data;
  const result = db
    .prepare("INSERT INTO posts (author_id, title, content_md, tags, emoji) VALUES (?, ?, ?, ?, ?)")
    .run(req.user!.id, title, content_md, JSON.stringify(tags), emoji);

  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(result.lastInsertRowid) as Post;
  res.status(201).json(serializePost(post));
});

// PUT /api/posts/:id  (auth required, author only)
router.put("/:id", requireAuth, (req: AuthedRequest, res) => {
  const existing = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id) as Post | undefined;
  if (!existing) return res.status(404).json({ error: "Post not found" });
  if (existing.author_id !== req.user!.id) return res.status(403).json({ error: "Not your post" });

  const parsed = postSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid post payload" });

  const next = {
    title: parsed.data.title ?? existing.title,
    content_md: parsed.data.content_md ?? existing.content_md,
    tags: JSON.stringify(parsed.data.tags ?? JSON.parse(existing.tags)),
    emoji: parsed.data.emoji ?? existing.emoji,
  };

  db.prepare(
    `UPDATE posts SET title = ?, content_md = ?, tags = ?, emoji = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(next.title, next.content_md, next.tags, next.emoji, existing.id);

  const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(existing.id) as Post;
  res.json(serializePost(updated));
});

// DELETE /api/posts/:id  (auth required, author only)
router.delete("/:id", requireAuth, (req: AuthedRequest, res) => {
  const existing = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id) as Post | undefined;
  if (!existing) return res.status(404).json({ error: "Post not found" });
  if (existing.author_id !== req.user!.id) return res.status(403).json({ error: "Not your post" });

  db.prepare("DELETE FROM posts WHERE id = ?").run(existing.id);
  res.status(204).send();
});

// POST /api/posts/:id/reactions  { emoji }  (auth required) — toggles the reaction
router.post("/:id/reactions", requireAuth, (req: AuthedRequest, res) => {
  const { emoji } = req.body as { emoji?: string };
  if (!emoji) return res.status(400).json({ error: "emoji is required" });

  const existing = db
    .prepare("SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND emoji = ?")
    .get(req.params.id, req.user!.id, emoji);

  if (existing) {
    db.prepare("DELETE FROM reactions WHERE id = ?").run((existing as { id: number }).id);
  } else {
    db.prepare("INSERT INTO reactions (post_id, user_id, emoji) VALUES (?, ?, ?)").run(
      req.params.id,
      req.user!.id,
      emoji
    );
  }

  const reactionCounts = db
    .prepare(`SELECT emoji, COUNT(*) AS count FROM reactions WHERE post_id = ? GROUP BY emoji`)
    .all(req.params.id);
  res.json({ reactions: reactionCounts });
});

export default router;
