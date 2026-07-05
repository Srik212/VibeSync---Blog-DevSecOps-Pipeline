# ✨ Emberpost — an emoji-forward blog with a black-to-gold glass UI

A lightweight full-stack blog: React + TypeScript frontend, Node + TypeScript
(Express) backend, SQLite for storage. No heavy frameworks, no ORM — just
enough structure to be easy to extend.

## Stack decisions (and why)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React 18 + TS | Fastest dev loop, tiny bundle, no meta-framework overhead |
| Styling | Hand-written CSS (custom properties) | Full control over the black-to-gold glass theme, zero extra KB |
| Backend | Express + TS | Minimal, unopinionated, everyone can read it in a code review |
| DB | SQLite via `better-sqlite3` | Zero setup, single file, synchronous API — perfect for a small app. Swap for Postgres later by changing `db.ts` only |
| Auth | JWT (7-day expiry) + bcrypt | Stateless, no session store needed |
| Markdown | `react-markdown` | Small, no `dangerouslySetInnerHTML` needed |
| Offline | localStorage cache of last-fetched posts | No service worker complexity, still useful for spotty connections |

## Project structure

```
blog-app/
├── backend/
│   ├── src/
│   │   ├── db.ts              # SQLite connection + schema
│   │   ├── types.ts           # Shared interfaces
│   │   ├── middleware/auth.ts # JWT sign/verify, requireAuth/optionalAuth
│   │   ├── routes/auth.ts     # /api/auth/signup, /login
│   │   ├── routes/posts.ts    # /api/posts CRUD + search/filter + reactions
│   │   ├── routes/comments.ts # /api/posts/:id/comments
│   │   └── index.ts           # Express app entry
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/client.ts        # Typed fetch wrapper + offline cache
    │   ├── components/
    │   │   ├── AuthForms.tsx
    │   │   ├── PostList.tsx
    │   │   ├── PostEditor.tsx
    │   │   ├── PostView.tsx
    │   │   └── TagFilter.tsx
    │   ├── hooks/useOfflineCache.ts
    │   ├── styles/theme.css     # Black-to-gold glass design system
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

## Data models

```
User      { id, username, password_hash, created_at }
Post      { id, author_id, title, content_md, tags: string[], emoji, created_at, updated_at }
Comment   { id, post_id, author_id, body, created_at }
Reaction  { id, post_id, user_id, emoji }   -- unique per (post, user, emoji)
```

## API surface

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/signup` | – | `{username, password}` | Returns `{token, user}` |
| POST | `/api/auth/login` | – | `{username, password}` | Returns `{token, user}` |
| GET | `/api/posts?search=&tag=&emoji=` | optional | – | List + filter/search |
| GET | `/api/posts/:id` | optional | – | Post + comments + reaction counts |
| POST | `/api/posts` | required | `{title, content_md, tags[], emoji}` | Create |
| PUT | `/api/posts/:id` | required (author) | partial fields | Update |
| DELETE | `/api/posts/:id` | required (author) | – | Delete |
| POST | `/api/posts/:id/reactions` | required | `{emoji}` | Toggles reaction on/off |
| POST | `/api/posts/:id/comments` | required | `{body}` | Add comment |
| DELETE | `/api/posts/:id/comments/:cid` | required (author) | – | Delete comment |

Auth flow: client stores the JWT in `localStorage`; every request attaches
`Authorization: Bearer <token>`. `requireAuth` rejects missing/invalid tokens;
`optionalAuth` attaches the user if present but never blocks the request
(used on read routes).

## Component map

- **App** — owns view state (`list | post | new | edit`), auth state, search/tag filters, and the offline banner.
- **AuthForms** — signup/login toggle, calls `api.login`/`api.signup`.
- **PostList** — card grid, click to open a post.
- **PostEditor** — title, emoji picker, tag input, markdown textarea with live preview toggle.
- **PostView** — full post render, reactions, comment thread.
- **TagFilter** — search box + tag pill row, derived from currently loaded posts.

## Run locally

**Backend:**
```bash
cd backend
cp .env.example .env      # edit JWT_SECRET
npm install
npm run dev                # http://localhost:4000
```

**Frontend** (separate terminal):
```bash
cd frontend
npm install
npm run dev                # http://localhost:5173, proxies /api to :4000
```

Open `http://localhost:5173`, sign up, and start posting.

## Build for production

```bash
# backend
cd backend && npm run build && npm start

# frontend
cd frontend && npm run build   # outputs to frontend/dist — serve with any static host
```

For a single-server deploy, add `express.static(path.join(__dirname, "../../frontend/dist"))`
to `backend/src/index.ts` and build the frontend first.

## Accessibility notes already in place

- All interactive elements are real `<button>`/`<input>` elements (keyboard-reachable by default).
- Visible focus ring via `:focus-visible` in `theme.css`.
- Reduced-motion users get the ember flicker animation disabled automatically.
- Color contrast: body text `#f3ead6` on near-black backgrounds exceeds WCAG AA.

## Suggested next steps (not built yet)

1. **Image uploads** — add `multer` + a `/uploads` static route; store the URL on the post.
2. **Real-time** — a `ws` server broadcasting new comments/reactions to open post views.
3. **Analytics** — a `views` counter column, incremented on `GET /api/posts/:id`.
4. **Rate limiting** — `express-rate-limit` on `/api/auth/*` before this goes anywhere public.
5. **True offline writes** — queue failed POSTs in IndexedDB and replay on reconnect (current cache is read-only).
