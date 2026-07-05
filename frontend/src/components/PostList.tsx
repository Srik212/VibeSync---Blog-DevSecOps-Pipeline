import { Post } from "../api/client";

interface Props {
  posts: Post[];
  onOpen: (id: number) => void;
}

export function PostList({ posts, onOpen }: Props) {
  if (posts.length === 0) {
    return (
      <div className="glass" style={{ padding: 32, textAlign: "center", marginTop: 20 }}>
        <p style={{ fontSize: "1.4rem", marginBottom: 4 }}>🕯️</p>
        <p className="muted">No posts match yet. Try a different search, or write the first one.</p>
      </div>
    );
  }

  return (
    <div className="post-grid">
      {posts.map((post) => (
        <button
          key={post.id}
          className="glass post-card"
          onClick={() => onOpen(post.id)}
          aria-label={`Open post: ${post.title}`}
        >
          <span className="post-emoji" aria-hidden="true">{post.emoji}</span>
          <h3 style={{ fontSize: "1.1rem" }}>{post.title}</h3>
          <p className="muted" style={{ margin: 0, fontSize: "0.88rem" }}>
            {post.content_md.slice(0, 110)}
            {post.content_md.length > 110 ? "…" : ""}
          </p>
          <div className="tag-row">
            {post.tags.map((tag) => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
          <span className="meta">{new Date(post.created_at).toLocaleDateString()}</span>
        </button>
      ))}
    </div>
  );
}
