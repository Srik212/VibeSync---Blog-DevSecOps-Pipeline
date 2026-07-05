import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

const commentSchema = z.object({ body: z.string().min(1).max(1000) });

// POST /api/posts/:postId/comments  (auth required)
router.post("/:postId/comments", requireAuth, (req: AuthedRequest, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Comment body is required" });

  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const result = db
    .prepare("INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)")
    .run(req.params.postId, req.user!.id, parsed.data.body);

  const comment = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, u.username AS author
       FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json(comment);
});

// DELETE /api/posts/:postId/comments/:commentId  (auth required, comment author only)
router.delete("/:postId/comments/:commentId", requireAuth, (req: AuthedRequest, res) => {
  const comment = db
    .prepare("SELECT * FROM comments WHERE id = ? AND post_id = ?")
    .get(req.params.commentId, req.params.postId) as { author_id: number } | undefined;

  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (comment.author_id !== req.user!.id) return res.status(403).json({ error: "Not your comment" });

  db.prepare("DELETE FROM comments WHERE id = ?").run(req.params.commentId);
  res.status(204).send();
});

export default router;
