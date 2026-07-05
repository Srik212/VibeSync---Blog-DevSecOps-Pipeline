import { FormEvent, useState } from "react";
import { api, AuthUser } from "../api/client";

interface Props {
  onAuthed: (user: AuthUser) => void;
}

export function AuthForms({ onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = mode === "login" ? await api.login(username, password) : await api.signup(username, password);
      onAuthed(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-strong" style={{ padding: 24, maxWidth: 360, margin: "40px auto" }}>
      <h2>{mode === "login" ? "🔑 Welcome back" : "🌱 Create your account"}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        {mode === "login" ? "Log in to write and react." : "Sign up to start posting."}
      </p>

      {error && <div className="banner banner-error">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
          />
        </div>
        <div className="field-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Working…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        style={{ marginTop: 12, width: "100%", background: "none", border: "none" }}
      >
        {mode === "login" ? "Need an account? Sign up →" : "Already have an account? Log in →"}
      </button>
    </div>
  );
}
