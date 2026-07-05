import { FormEvent, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api, AuthUser, PostDetail } from "../api/client";
import { useOnlineStatus } from "../hooks/useOfflineCache";

const QUICK_REACTIONS = ["🔥", "❤️", "😂", "🤯", "👏"];

interface Props {
  postId: number;
  currentUser: AuthUser | null;
  onEdit: (post: PostDetail) => void;
  onDeleted: () => void;
  onBack: () => void;
}

export function PostView({ postId, currentUser, onEdit, onDeleted, onBack }: Props) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const online = useOnlineStatus();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function load() {
    try {
      const data = await api.getPost(postId);
      setPost(data);
    } catch {
      const cached = api.getCachedPost(postId);
      if (cached) setPost(cached);
      else setError("Couldn't load this post, and no offline copy is saved.");
    }
  }

  async function handleReact(emoji: string) {
    if (!currentUser) return setError("Log in to react to posts.");
    const result = await api.toggleReaction(postId, emoji);
    setPost((prev) => (prev ? { ...prev, reactions: result.reactions } : prev));
  }

  async function handleComment(e: FormEvent) {
    e.preventDefault();
    if (!currentUser) return setError("Log in to comment.");
    if (!commentBody.trim()) return;
    const comment = await api.addComment(postId, commentBody);
    setPost((prev) => (prev ? { ...prev, comments: [...prev.comments, comment] } : prev));
    setCommentBody("");
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    await api.deletePost(postId);
    onDeleted();
  }

  if (!post) {
    return <div className="glass" style={{ padding: 24 }}>{error ?? "Loading…"}</div>;
  }

  const isAuthor = currentUser?.id === post.author_id;
  const reactionCounts = Object.fromEntries(post.reactions.map((r) => [r.emoji, r.count]));

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: 16 }}>← Back to posts</button>

      {!online && <div className="banner banner-offline">📴 You're offline — showing the last saved copy.</div>}
      {error && <div className="banner banner-error">⚠️ {error}</div>}

      <article className="glass-strong" style={{ padding: 28 }}>
        <span className="post-emoji" aria-hidden="true">{post.emoji}</span>
        <h1>{post.title}</h1>
        <p className="meta">
          Posted {new Date(post.created_at).toLocaleString()}
          {post.updated_at !== post.created_at ? " · edited" : ""}
        </p>

        <div className="tag-row" style={{ margin: "10px 0 20px" }}>
          {post.tags.map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>

        <div className="markdown-body">
          <ReactMarkdown>{post.content_md}</ReactMarkdown>
        </div>

        {isAuthor && (
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => onEdit(post)}>✏️ Edit</button>
            <button onClick={handleDelete}>🗑️ Delete</button>
          </div>
        )}

        <div className="reaction-row" style={{ marginTop: 24 }}>
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="reaction-chip"
              onClick={() => handleReact(emoji)}
              aria-label={`React with ${emoji}`}
            >
              {emoji} {reactionCounts[emoji] ?? 0}
            </button>
          ))}
        </div>
      </article>

      <section className="glass" style={{ padding: 24, marginTop: 20 }}>
        <h2 style={{ fontSize: "1.1rem" }}>💬 Comments ({post.comments.length})</h2>

        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0" }}>
          {post.comments.map((c) => (
            <li key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--glass-border)" }}>
              <p style={{ margin: 0 }}>{c.body}</p>
              <span className="meta">{c.author} · {new Date(c.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>

        <form onSubmit={handleComment} style={{ display: "flex", gap: 10 }}>
          <input
            aria-label="Write a comment"
            placeholder={currentUser ? "Add a comment…" : "Log in to comment"}
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            disabled={!currentUser}
          />
          <button type="submit" className="btn-primary" disabled={!currentUser}>Post</button>
        </form>
      </section>
    </div>
  );
}
