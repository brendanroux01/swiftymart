"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { rand, shortDate } from "@/lib/format";
import type { Order, OrderItem, ProductSupplier, Supplier } from "@/lib/types";
import { MailIcon } from "@/components/Icons";

type Line = OrderItem & { supplierId: string | null; sku: string };

export default function ToOrderTab() {
  const supabase = getBrowserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [links, setLinks] = useState<ProductSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [o, s, l] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").eq("status", "paid").order("paid_at", { ascending: true }),
      supabase.from("suppliers").select("*"),
      supabase.from("product_supplier").select("*"),
    ]);
    setError(o.error?.message ?? s.error?.message ?? l.error?.message ?? "");
    setOrders((o.data ?? []) as Order[]);
    setSuppliers((s.data ?? []) as Supplier[]);
    setLinks((l.data ?? []) as ProductSupplier[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <section aria-label="To order from suppliers">
      <div className="admin-toolbar">
        <p className="muted" style={{ margin: 0 }}>
          Paid orders that still need to be ordered from the supplier. Oldest first.
        </p>
        <button type="button" className="btn btn-outline btn-small" onClick={load}>
          Refresh
        </button>
      </div>
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="panel empty">
          <p className="muted">Nothing to order right now. New paid orders will show up here.</p>
        </div>
      ) : (
        orders.map((o) => <OrderToPlace key={o.id} order={o} suppliers={suppliers} links={links} onDone={load} />)
      )}
    </section>
  );
}

function OrderToPlace({
  order,
  suppliers,
  links,
  onDone,
}: {
  order: Order;
  suppliers: Supplier[];
  links: ProductSupplier[];
  onDone: () => void;
}) {
  const supabase = getBrowserClient();
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Supplier recorded on the order; if none, use the product's current supplier.
  const lines: Line[] = order.order_items.map((i) => {
    const current = links.find((l) => l.product_id === i.product_id);
    return {
      ...i,
      supplierId: i.supplier_id ?? current?.supplier_id ?? null,
      sku: i.supplier_sku || current?.supplier_sku || "",
    };
  });
  const groups = new Map<string, Line[]>();
  for (const l of lines) {
    const key = l.supplierId ?? "none";
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }

  const address = [order.address_line1, order.address_line2, order.suburb, order.city, order.province, order.postal_code].filter(Boolean);

  function emailText(supplier: Supplier | undefined, items: Line[]) {
    const greeting = supplier?.contact_person ? `Hi ${supplier.contact_person},` : "Hi,";
    const itemLines = items.map((i) => `- ${i.quantity} x ${i.product_name}${i.sku ? ` (your code: ${i.sku})` : ""}`).join("\n");
    return [
      greeting,
      "",
      `Please supply and deliver the following for SwiftyMart order #${order.order_number}:`,
      "",
      itemLines,
      "",
      "Please deliver directly to our customer:",
      order.customer_name,
      ...address,
      `Phone: ${order.phone}`,
      ...(order.notes ? [`Delivery notes: ${order.notes}`] : []),
      "",
      "Please send us the invoice and the tracking number once it has been dispatched.",
      "",
      "Thank you,",
      "SwiftyMart",
    ].join("\n");
  }

  async function markOrdered() {
    setBusy(true);
    setError("");
    const { error } = await supabase
      .from("orders")
      .update({ status: "ordered", supplier_reference: reference.trim() || null, supplier_ordered_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "paid");
    setBusy(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <article className="order-card">
      <div className="order-card-head">
        <h3>
          Order #{order.order_number} · {order.customer_name}
        </h3>
        <span className="muted" style={{ fontSize: 14 }}>
          Paid {shortDate(order.paid_at)} · {rand(order.total_cents)}
        </span>
      </div>

      {[...groups.entries()].map(([key, items]) => {
        const supplier = suppliers.find((s) => s.id === key);
        if (key === "none" || !supplier) {
          return (
            <div key={key} className="supplier-group">
              <h4>No supplier set</h4>
              <ul>
                {items.map((i) => (
                  <li key={i.id}>
                    {i.quantity} × {i.product_name}
                  </li>
                ))}
              </ul>
              <p className="warn-text" style={{ margin: 0 }}>
                Set the supplier for {items.length === 1 ? "this product" : "these products"} on the Products tab, then click Refresh.
              </p>
            </div>
          );
        }
        const body = emailText(supplier, items);
        const subject = `Order for SwiftyMart #${order.order_number}`;
        return (
          <div key={key} className="supplier-group">
            <h4>{supplier.name}</h4>
            <ul>
              {items.map((i) => (
                <li key={i.id}>
                  {i.quantity} × {i.product_name}
                  {i.sku ? <span className="muted"> · code {i.sku}</span> : <span className="warn-text"> · no supplier code</span>}
                </li>
              ))}
            </ul>
            <div className="btn-row">
              {supplier.email ? (
                <a
                  className="btn btn-primary btn-small"
                  href={`mailto:${encodeURIComponent(supplier.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                >
                  <MailIcon /> Email order to {supplier.name}
                </a>
              ) : (
                <span className="warn-text">No email saved for this supplier.</span>
              )}
              <button
                type="button"
                className="btn btn-outline btn-small"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(body);
                    setCopied(key);
                    window.setTimeout(() => setCopied(null), 2000);
                  } catch {
                    setError("Couldn't copy. Select the text in the email instead.");
                  }
                }}
              >
                {copied === key ? "Copied" : "Copy order text"}
              </button>
              {supplier.phone && <span className="muted" style={{ fontSize: 14 }}>Supplier phone: {supplier.phone}</span>}
            </div>
          </div>
        );
      })}

      <form
        className="inline-form"
        style={{ marginTop: 0 }}
        onSubmit={(e) => {
          e.preventDefault();
          markOrdered();
        }}
      >
        <div className="field">
          <label htmlFor={`ref-${order.id}`}>Supplier&apos;s order or invoice number (optional)</label>
          <input id={`ref-${order.id}`} className="input" maxLength={80} value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Mark as ordered"}
        </button>
      </form>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}
    </article>
  );
}
