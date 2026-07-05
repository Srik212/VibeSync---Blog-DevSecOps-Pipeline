import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Post } from "../api/client";

interface Props {
  initial?: Partial<Post>;
  onSave: (input: { title: string; content_md: string; tags: string[]; emoji: string }) => Promise<void>;
  onCancel: () => void;
}

const EMOJI_CHOICES = ["📝", "🚀", "💡", "🐛", "🎨", "🔥", "🧠", "☕"];

export function PostEditor({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content_md ?? "");
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [emoji, setEmoji] = useState(initial?.emoji ?? "📝");
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave({ title, content_md: content, tags, emoji });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong" style={{ padding: 24 }}>
      {error && <div className="banner banner-error">⚠️ {error}</div>}

      <div className="field-group">
        <label htmlFor="emoji-picker">Headline emoji</label>
        <div className="tag-row" id="emoji-picker" role="group" aria-label="Choose an emoji for this post">
          {EMOJI_CHOICES.map((choice) => (
            <button
              type="button"
              key={choice}
              aria-pressed={emoji === choice}
              onClick={() => setEmoji(choice)}
              style={{
                fontSize: "1.2rem",
                borderColor: emoji === choice ? "var(--gold-bright)" : undefined,
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </div>

      <div className="field-group">
        <label htmlFor="tags">Tags (comma-separated)</label>
        <input
          id="tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="devsecops, azure, 🚀launch"
        />
      </div>

      <div className="field-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label htmlFor="content">Content (Markdown supported)</label>
          <button type="button" onClick={() => setShowPreview((p) => !p)}>
            {showPreview ? "✏️ Edit" : "👁️ Preview"}
          </button>
        </div>
        {showPreview ? (
          <div className="glass" style={{ padding: 16, minHeight: 200 }}>
            <ReactMarkdown>{content || "*Nothing to preview yet.*"}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            required
            placeholder="Write in Markdown — **bold**, _italic_, `code`, lists, and emoji 🎉 all work."
          />
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "💾 Save post"}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
