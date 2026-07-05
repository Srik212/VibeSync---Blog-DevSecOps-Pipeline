import { useEffect, useMemo, useState } from "react";
import { api, AuthUser, getStoredUser, clearSession, Post, PostDetail } from "./api/client";
import { AuthForms } from "./components/AuthForms";
import { PostList } from "./components/PostList";
import { PostEditor } from "./components/PostEditor";
import { PostView } from "./components/PostView";
import { TagFilter } from "./components/TagFilter";
import { useOnlineStatus } from "./hooks/useOfflineCache";

type View = { name: "list" } | { name: "post"; id: number } | { name: "new" } | { name: "edit"; post: PostDetail };

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState<View>({ name: "list" });
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const online = useOnlineStatus();

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeTag]);

  async function loadPosts() {
    try {
      const data = await api.listPosts({ search, tag: activeTag ?? undefined });
      setPosts(data);
      setError(null);
    } catch {
      setPosts(api.getCachedPosts());
      setError("Couldn't reach the server — showing your last saved posts.");
    }
  }

  const allTags = useMemo(() => Array.from(new Set(posts.flatMap((p) => p.tags))).sort(), [posts]);

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  async function handleCreate(input: { title: string; content_md: string; tags: string[]; emoji: string }) {
    await api.createPost(input);
    await loadPosts();
    setView({ name: "list" });
  }

  async function handleUpdate(id: number, input: { title: string; content_md: string; tags: string[]; emoji: string }) {
    await api.updatePost(id, input);
    await loadPosts();
    setView({ name: "post", id });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="brand">✨ VibeSync</div>
          <div className="brand-underline" />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {user ? (
            <>
              <span className="muted">Hi, {user.username} 👋</span>
              <button onClick={() => setView({ name: "new" })}>+ New post</button>
              <button onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setShowAuth(true)}>Log in</button>
          )}
        </div>
      </header>

      {!online && <div className="banner banner-offline">📴 Offline mode — showing cached content.</div>}
      {error && <div className="banner banner-error">⚠️ {error}</div>}

      {showAuth && !user && (
        <AuthForms
          onAuthed={(u) => {
            setUser(u);
            setShowAuth(false);
          }}
        />
      )}

      {view.name === "list" && (
        <>
          <TagFilter
            search={search}
            onSearchChange={setSearch}
            tags={allTags}
            activeTag={activeTag}
            onTagChange={setActiveTag}
          />
          <PostList posts={posts} onOpen={(id) => setView({ name: "post", id })} />
        </>
      )}

      {view.name === "new" && (
        <PostEditor onSave={handleCreate} onCancel={() => setView({ name: "list" })} />
      )}

      {view.name === "edit" && (
        <PostEditor
          initial={view.post}
          onSave={(input) => handleUpdate(view.post.id, input)}
          onCancel={() => setView({ name: "post", id: view.post.id })}
        />
      )}

      {view.name === "post" && (
        <PostView
          postId={view.id}
          currentUser={user}
          onEdit={(post) => setView({ name: "edit", post })}
          onDeleted={() => {
            loadPosts();
            setView({ name: "list" });
          }}
          onBack={() => setView({ name: "list" })}
        />
      )}
    </div>
  );
}
