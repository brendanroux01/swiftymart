"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase";

export default function AdminLogin() {
  const supabase = getBrowserClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(error.message === "Email not confirmed" ? "This account hasn't been approved yet." : "Wrong email or password.");
    } else {
      if (password.length < 8) {
        setError("Use a password of at least 8 characters.");
        setBusy(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) setError(error.message);
      else if (!data.session)
        setMessage("Account created. Once the store owner approves it, you can sign in here.");
    }
    setBusy(false);
  }

  return (
    <div className="container page" style={{ maxWidth: 480 }}>
      <h1 className="page-title">{mode === "signin" ? "Admin sign in" : "Create admin account"}</h1>
      <p className="muted">For SwiftyMart staff only.</p>
      <form onSubmit={onSubmit} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        <div className="field">
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            className="input"
            type="password"
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="alert alert-success" role="status">
            {message}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setMessage("");
          }}
        >
          {mode === "signin" ? "New here? Create an admin account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
