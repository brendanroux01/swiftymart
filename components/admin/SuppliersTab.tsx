"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import type { Supplier } from "@/lib/types";

type Draft = Omit<Supplier, "id" | "dispatch_min_days" | "dispatch_max_days"> & {
  id?: string;
  dispatch_min_days: string;
  dispatch_max_days: string;
};

const blank: Draft = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  dispatch_min_days: "1",
  dispatch_max_days: "3",
  notes: "",
  active: true,
};

export default function SuppliersTab() {
  const supabase = getBrowserClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, { data: links }] = await Promise.all([
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("product_supplier").select("supplier_id"),
    ]);
    if (error) setError(error.message);
    const c: Record<string, number> = {};
    for (const l of links ?? []) if (l.supplier_id) c[l.supplier_id] = (c[l.supplier_id] ?? 0) + 1;
    setCounts(c);
    setSuppliers((data ?? []) as Supplier[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section aria-label="Suppliers">
      <div className="admin-toolbar">
        <p className="muted" style={{ margin: 0 }}>
          Suppliers deliver straight to your customers. Only admins can see this list.
        </p>
        <button type="button" className="btn btn-primary btn-small" onClick={() => setDraft({ ...blank })}>
          Add supplier
        </button>
      </div>
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {loading ? (
        <p className="muted">Loading suppliers…</p>
      ) : suppliers.length === 0 ? (
        <div className="panel empty">
          <p className="muted">No suppliers yet. Add your supplier, then link products to it on the Products tab.</p>
          <button type="button" className="btn btn-primary" onClick={() => setDraft({ ...blank })}>
            Add supplier
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Dispatch time</th>
                <th>Products</th>
                <th>Active</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    {s.contact_person || "—"}
                    <div className="muted" style={{ fontSize: 13 }}>
                      {[s.email, s.phone].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td>
                    {s.dispatch_min_days === s.dispatch_max_days ? s.dispatch_max_days : `${s.dispatch_min_days}–${s.dispatch_max_days}`} working days
                  </td>
                  <td>{counts[s.id] ?? 0}</td>
                  <td>{s.active ? "Yes" : "No"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() =>
                        setDraft({ ...s, dispatch_min_days: String(s.dispatch_min_days), dispatch_max_days: String(s.dispatch_max_days) })
                      }
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {draft && (
        <SupplierDialog
          draft={draft}
          productCount={draft.id ? counts[draft.id] ?? 0 : 0}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            load();
          }}
        />
      )}
    </section>
  );
}

function SupplierDialog({
  draft: initial,
  productCount,
  onClose,
  onSaved,
}: {
  draft: Draft;
  productCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = getBrowserClient();
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const min = Number(d.dispatch_min_days);
    const max = Number(d.dispatch_max_days);
    if (!d.name.trim()) return setError("Give the supplier a name.");
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < 0 || max > 90) return setError("Dispatch days must be whole numbers.");
    if (max < min) return setError("The longest dispatch time can't be shorter than the shortest.");
    if (d.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) return setError("That email address doesn't look right.");
    const row = {
      name: d.name.trim(),
      contact_person: d.contact_person.trim(),
      email: d.email.trim(),
      phone: d.phone.trim(),
      dispatch_min_days: min,
      dispatch_max_days: max,
      notes: d.notes.trim(),
      active: d.active,
    };
    setBusy(true);
    const { error } = d.id ? await supabase.from("suppliers").update(row).eq("id", d.id) : await supabase.from("suppliers").insert(row);
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  async function remove() {
    if (!d.id) return;
    const msg =
      productCount > 0
        ? `Delete "${d.name}"? ${productCount} product(s) are linked to it and will have no supplier until you choose a new one.`
        : `Delete "${d.name}"?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    const { error } = await supabase.from("suppliers").delete().eq("id", d.id);
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="supplier-dialog-title">
        <h2 id="supplier-dialog-title">{d.id ? "Edit supplier" : "Add supplier"}</h2>
        <form onSubmit={save}>
          <div className="form-grid">
            <div className="field span-2">
              <label htmlFor="s-name">Supplier name</label>
              <input id="s-name" className="input" required maxLength={120} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="s-contact">Contact person</label>
              <input id="s-contact" className="input" maxLength={120} value={d.contact_person} onChange={(e) => setD({ ...d, contact_person: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="s-phone">Phone</label>
              <input id="s-phone" className="input" type="tel" maxLength={30} value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} />
            </div>
            <div className="field span-2">
              <label htmlFor="s-email">Email for orders</label>
              <input id="s-email" className="input" type="email" maxLength={200} value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
              <span className="hint">Order emails from the &quot;To order&quot; tab go to this address.</span>
            </div>
            <div className="field">
              <label htmlFor="s-min">Dispatch time – shortest (working days)</label>
              <input id="s-min" className="input" inputMode="numeric" value={d.dispatch_min_days} onChange={(e) => setD({ ...d, dispatch_min_days: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="s-max">Dispatch time – longest (working days)</label>
              <input id="s-max" className="input" inputMode="numeric" value={d.dispatch_max_days} onChange={(e) => setD({ ...d, dispatch_max_days: e.target.value })} />
            </div>
            <div className="field span-2">
              <span className="hint">Customers see &quot;Usually dispatched within {d.dispatch_min_days || "?"}–{d.dispatch_max_days || "?"} working days&quot; on the product page. They never see the supplier&apos;s name.</span>
            </div>
            <div className="field span-2">
              <label htmlFor="s-notes">Notes (only admins see these)</label>
              <textarea id="s-notes" className="input" maxLength={2000} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
            </div>
            <label className="check span-2">
              <input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /> Active supplier
            </label>
          </div>
          {error && (
            <div className="alert alert-error" role="alert" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
          <div className="dialog-actions">
            {d.id && (
              <button type="button" className="btn btn-danger" style={{ marginRight: "auto" }} onClick={remove} disabled={busy}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
