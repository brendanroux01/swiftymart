"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";

export default function SettingsTab() {
  const supabase = getBrowserClient();
  const [shipping, setShipping] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("shipping_cents")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        setShipping(((data?.shipping_cents ?? 0) / 100).toFixed(2));
        setLoading(false);
      });
  }, [supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const value = Number(shipping.replace(/[R\s]/gi, "").replace(",", "."));
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter a valid amount, for example 99.00");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("store_settings").update({ shipping_cents: Math.round(value * 100) }).eq("id", 1);
    setBusy(false);
    if (error) setError(error.message);
    else setMessage("Saved. New orders will use this delivery fee.");
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <section aria-label="Settings" style={{ maxWidth: 520 }}>
      <form onSubmit={save} className="panel" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ margin: 0 }}>Delivery fee</h2>
        <p className="muted" style={{ margin: 0 }}>
          A flat fee added to every order for delivery with The Courier Guy. Live courier rates can replace this later.
        </p>
        <div className="field">
          <label htmlFor="shipping">Flat delivery fee (R)</label>
          <input id="shipping" className="input" inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} />
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
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </section>
  );
}
