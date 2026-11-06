"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { itemsProfit, rand, shortDate } from "@/lib/format";
import type { Order } from "@/lib/types";

type Filter = "all" | "pending" | "paid" | "ordered" | "shipped" | "unpaid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "paid", label: "Paid – to order" },
  { key: "ordered", label: "Ordered – to ship" },
  { key: "shipped", label: "Shipped" },
  { key: "pending", label: "Awaiting payment" },
  { key: "unpaid", label: "Failed / cancelled" },
  { key: "all", label: "All" },
];

export function StatusPill({ status }: { status: Order["status"] }) {
  const label =
    status === "pending" ? "Awaiting payment" : status === "paid" ? "Paid – to order" : status === "ordered" ? "Ordered from supplier" : status === "shipped" ? "Shipped" : status === "failed" ? "Payment failed" : "Cancelled";
  return <span className={`status-pill status-${status}`}>{label}</span>;
}

export default function OrdersTab() {
  const supabase = getBrowserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("paid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
    if (filter === "unpaid") q = q.in("status", ["failed", "cancelled"]);
    else if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setError("");
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, [supabase, filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section aria-label="Orders">
      <div className="admin-toolbar">
        <div className="filter-pills" role="group" aria-label="Filter orders">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-small" onClick={load}>
          Refresh
        </button>
      </div>
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {loading ? (
        <p className="muted">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="panel empty">
          <p className="muted">No orders here yet.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Profit</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr>
                    <td>#{o.order_number}</td>
                    <td>{shortDate(o.created_at)}</td>
                    <td>
                      {o.customer_name}
                      <div className="muted" style={{ fontSize: 13 }}>
                        {o.city}, {o.province}
                      </div>
                    </td>
                    <td>{o.order_items.reduce((n, i) => n + i.quantity, 0)}</td>
                    <td>{rand(o.total_cents)}</td>
                    <td>
                      <Profit order={o} />
                    </td>
                    <td>
                      <StatusPill status={o.status} />
                    </td>
                    <td>
                      <button type="button" className="btn btn-outline btn-small" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}>
                        {open === o.id ? "Close" : "View"}
                      </button>
                    </td>
                  </tr>
                  {open === o.id && (
                    <tr className="order-detail">
                      <td colSpan={8}>
                        <OrderDetail order={o} onChanged={load} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Profit({ order }: { order: Order }) {
  const p = itemsProfit(order.order_items);
  if (p === null) return <span className="muted" title="Add cost prices to the products to see profit">–</span>;
  return <span className={p >= 0 ? "profit-pos" : "profit-neg"}>{rand(p)}</span>;
}

function OrderDetail({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const supabase = getBrowserClient();
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(values: Partial<Order>) {
    setBusy(true);
    setError("");
    const { error } = await supabase.from("orders").update(values).eq("id", order.id);
    setBusy(false);
    if (error) setError(error.message);
    else onChanged();
  }

  const address = [order.address_line1, order.address_line2, order.suburb, order.city, order.province, order.postal_code]
    .filter(Boolean)
    .join("\n");

  return (
    <div>
      <div className="detail-grid">
        <div>
          <h4>Customer</h4>
          <p>
            {order.customer_name}
            {"\n"}
            <a href={`mailto:${order.email}`}>{order.email}</a>
            {"\n"}
            <a href={`tel:${order.phone}`}>{order.phone}</a>
          </p>
        </div>
        <div>
          <h4>Deliver to</h4>
          <p>{address}</p>
          {order.notes && (
            <>
              <h4 style={{ marginTop: 12 }}>Notes</h4>
              <p>{order.notes}</p>
            </>
          )}
        </div>
        <div>
          <h4>Items</h4>
          {order.order_items.map((i) => (
            <div key={i.id} className="summary-row" style={{ color: "var(--text)", fontSize: 14 }}>
              <span>
                {i.quantity} × {i.product_name}
              </span>
              <span>{rand(i.line_total_cents)}</span>
            </div>
          ))}
          <div className="summary-row" style={{ fontSize: 14 }}>
            <span>Delivery</span>
            <span>{rand(order.shipping_cents)}</span>
          </div>
          <div className="summary-row" style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>
            <span>Total</span>
            <span>{rand(order.total_cents)}</span>
          </div>
          <div className="summary-row" style={{ fontSize: 14 }}>
            <span>Profit on items (excl. delivery)</span>
            <Profit order={order} />
          </div>
        </div>
        <div>
          <h4>Payment</h4>
          <p>
            {order.paid_at ? `Paid ${shortDate(order.paid_at)}` : "Not paid"}
            {order.payfast_payment_id ? `\nPayFast ref: ${order.payfast_payment_id}` : ""}
            {order.supplier_ordered_at ? `\nOrdered from supplier ${shortDate(order.supplier_ordered_at)}` : ""}
            {order.supplier_reference ? `\nSupplier ref: ${order.supplier_reference}` : ""}
            {order.shipped_at ? `\nShipped ${shortDate(order.shipped_at)}` : ""}
          </p>
        </div>
      </div>

      {order.status === "paid" && (
        <p className="muted" style={{ marginTop: 16 }}>
          Next step: order it from the supplier on the <strong>To order</strong> tab.
        </p>
      )}
      {(order.status === "ordered" || order.status === "shipped") && (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            update({ status: "shipped", tracking_number: tracking.trim() || null, shipped_at: order.shipped_at ?? new Date().toISOString() });
          }}
        >
          <div className="field">
            <label htmlFor={`tracking-${order.id}`}>Tracking number from the supplier</label>
            <input id={`tracking-${order.id}`} className="input" value={tracking} maxLength={60} onChange={(e) => setTracking(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {order.status === "shipped" ? "Update tracking" : "Mark as shipped"}
          </button>
        </form>
      )}
      {order.status === "pending" && (
        <div className="inline-form">
          <p className="muted" style={{ margin: 0, flex: "1 1 300px" }}>
            The customer started checkout but PayFast hasn&apos;t confirmed payment. It updates by itself when they pay.
          </p>
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Cancel order #${order.order_number}? Do this only if the customer won't be paying.`)) update({ status: "cancelled" });
            }}
          >
            Cancel order
          </button>
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}
    </div>
  );
}
