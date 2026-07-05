export interface Post {
  id: number;
  author_id: number;
  title: string;
  content_md: string;
  tags: string[];
  emoji: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  body: string;
  author: string;
  created_at: string;
}

export interface ReactionCount {
  emoji: string;
  count: number;
}

export interface PostDetail extends Post {
  comments: Comment[];
  reactions: ReactionCount[];
}

export interface AuthUser {
  id: number;
  username: string;
}

const TOKEN_KEY = "emberpost.token";
const USER_KEY = "emberpost.user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  async signup(username: string, password: string) {
    const data = await request<{ token: string; user: AuthUser }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setSession(data.token, data.user);
    return data.user;
  },

  async login(username: string, password: string) {
    const data = await request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setSession(data.token, data.user);
    return data.user;
  },

  async listPosts(filters: { search?: string; tag?: string; emoji?: string } = {}) {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => Boolean(v)) as [string, string][]
    ).toString();
    const posts = await request<Post[]>(`/posts${qs ? `?${qs}` : ""}`);
    localStorage.setItem("emberpost.cache.posts", JSON.stringify(posts));
    return posts;
  },

  getCachedPosts(): Post[] {
    const raw = localStorage.getItem("emberpost.cache.posts");
    return raw ? (JSON.parse(raw) as Post[]) : [];
  },

  async getPost(id: number) {
    const post = await request<PostDetail>(`/posts/${id}`);
    localStorage.setItem(`emberpost.cache.post.${id}`, JSON.stringify(post));
    return post;
  },

  getCachedPost(id: number): PostDetail | null {
    const raw = localStorage.getItem(`emberpost.cache.post.${id}`);
    return raw ? (JSON.parse(raw) as PostDetail) : null;
  },

  createPost(input: { title: string; content_md: string; tags: string[]; emoji: string }) {
    return request<Post>("/posts", { method: "POST", body: JSON.stringify(input) });
  },

  updatePost(id: number, input: Partial<{ title: string; content_md: string; tags: string[]; emoji: string }>) {
    return request<Post>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(input) });
  },

  deletePost(id: number) {
    return request<void>(`/posts/${id}`, { method: "DELETE" });
  },

  addComment(postId: number, body: string) {
    return request<Comment>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ body }) });
  },

  toggleReaction(postId: number, emoji: string) {
    return request<{ reactions: ReactionCount[] }>(`/posts/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    });
  },
};
