interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export function TagFilter({ search, onSearchChange, tags, activeTag, onTagChange }: Props) {
  return (
    <div className="toolbar">
      <input
        aria-label="Search posts"
        placeholder="🔍 Search posts…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ maxWidth: 260 }}
      />
      <div className="tag-row" role="group" aria-label="Filter by tag">
        <button
          className="tag-pill"
          style={{ borderColor: activeTag === null ? "var(--gold-bright)" : undefined }}
          onClick={() => onTagChange(null)}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            className="tag-pill"
            aria-pressed={activeTag === tag}
            style={{ borderColor: activeTag === tag ? "var(--gold-bright)" : undefined }}
            onClick={() => onTagChange(activeTag === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
