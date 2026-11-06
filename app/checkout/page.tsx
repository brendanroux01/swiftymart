"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { rand } from "@/lib/format";
import { PROVINCES } from "@/lib/types";
import { getBrowserClient } from "@/lib/supabase";
import { useLiveCart } from "@/components/useLiveCart";

type Form = {
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  notes: string;
};

const EMPTY: Form = {
  name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  suburb: "",
  city: "",
  province: "",
  postal_code: "",
  notes: "",
};

function submitToPayFast(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function CheckoutInner() {
  const params = useSearchParams();
  const cancelled = params.get("cancelled") === "1";
  const { items, subtotal, shipping, synced, ready } = useLiveCart();
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!ready || !synced) {
    return (
      <div className="container page">
        <h1 className="page-title">Checkout</h1>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">Checkout</h1>
        <div className="panel empty">
          <p className="muted">Your cart is empty.</p>
          <Link href="/" className="btn btn-primary">
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  const ship = shipping ?? 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[0-9 +()-]{9,20}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number, for example 082 123 4567.");
      return;
    }
    if (!/^\d{4}$/.test(form.postal_code.trim())) {
      setError("Please enter a 4-digit postal code.");
      return;
    }
    setBusy(true);
    const supabase = getBrowserClient();
    const { data: order, error: orderError } = await supabase.rpc("create_order", {
      p_items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      p_customer: form,
    });
    if (orderError || !order) {
      setError(orderError?.message ?? "Something went wrong placing your order. Please try again.");
      setBusy(false);
      return;
    }
    const { data: pay, error: payError } = await supabase.functions.invoke("payfast-checkout", {
      body: { order_id: order.order_id, access_token: order.access_token },
    });
    if (payError || !pay?.action) {
      setError("We couldn't connect to PayFast. Please try again in a moment.");
      setBusy(false);
      return;
    }
    submitToPayFast(pay.action, pay.fields);
  }

  return (
    <div className="container page">
      <h1 className="page-title">Checkout</h1>
      {cancelled && (
        <div className="alert alert-info" role="status" style={{ margin: "16px 0" }}>
          Payment was cancelled, and you haven&apos;t been charged. Your cart is still here when you&apos;re ready.
        </div>
      )}
      <form onSubmit={onSubmit} className="two-col" style={{ marginTop: 20 }}>
        <div className="main-col panel">
          <h2>Delivery details</h2>
          <div className="form-grid">
            <div className="field span-2">
              <label htmlFor="name">Full name</label>
              <input id="name" className="input" required autoComplete="name" maxLength={120} value={form.name} onChange={set("name")} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" required autoComplete="email" maxLength={200} value={form.email} onChange={set("email")} />
            </div>
            <div className="field">
              <label htmlFor="phone">Cellphone number</label>
              <input id="phone" className="input" type="tel" required autoComplete="tel" maxLength={20} value={form.phone} onChange={set("phone")} />
              <span className="hint">The courier uses this to reach you.</span>
            </div>
            <div className="field span-2">
              <label htmlFor="line1">Street address</label>
              <input id="line1" className="input" required autoComplete="address-line1" maxLength={200} value={form.address_line1} onChange={set("address_line1")} />
            </div>
            <div className="field span-2">
              <label htmlFor="line2">Complex, unit or building (optional)</label>
              <input id="line2" className="input" autoComplete="address-line2" maxLength={200} value={form.address_line2} onChange={set("address_line2")} />
            </div>
            <div className="field">
              <label htmlFor="suburb">Suburb</label>
              <input id="suburb" className="input" autoComplete="address-level3" maxLength={100} value={form.suburb} onChange={set("suburb")} />
            </div>
            <div className="field">
              <label htmlFor="city">City or town</label>
              <input id="city" className="input" required autoComplete="address-level2" maxLength={100} value={form.city} onChange={set("city")} />
            </div>
            <div className="field">
              <label htmlFor="province">Province</label>
              <select id="province" className="input" required value={form.province} onChange={set("province")}>
                <option value="">Choose a province</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="postal">Postal code</label>
              <input id="postal" className="input" required inputMode="numeric" autoComplete="postal-code" maxLength={4} value={form.postal_code} onChange={set("postal_code")} />
            </div>
            <div className="field span-2">
              <label htmlFor="notes">Delivery notes (optional)</label>
              <textarea id="notes" className="input" maxLength={500} value={form.notes} onChange={set("notes")} />
            </div>
          </div>
        </div>
        <aside className="side-col panel" aria-label="Order summary">
          <h2>Your order</h2>
          <div className="summary-items">
            {items.map((i) => (
              <div key={i.product_id} className="summary-row">
                <span>
                  {i.quantity} × {i.name}
                </span>
                <span>{rand(i.price_cents * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row" style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 12 }}>
            <span>Subtotal</span>
            <span>{rand(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery (The Courier Guy)</span>
            <span>{rand(ship)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{rand(subtotal + ship)}</span>
          </div>
          {error && (
            <div className="alert alert-error" role="alert" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
            {busy ? "Taking you to PayFast…" : "Pay with PayFast"}
          </button>
          <p className="payfast-note">You&apos;ll be taken to PayFast&apos;s secure page to pay by card or instant EFT.</p>
        </aside>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container page"><p className="muted">Loading…</p></div>}>
      <CheckoutInner />
    </Suspense>
  );
}
