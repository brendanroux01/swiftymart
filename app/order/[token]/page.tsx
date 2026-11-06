"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { rand } from "@/lib/format";
import { useCart } from "@/components/CartContext";

type OrderView = {
  order_number: number;
  status: "pending" | "paid" | "shipped" | "cancelled" | "failed";
  customer_name: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  tracking_number: string | null;
  items: { name: string; quantity: number; line_total_cents: number }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { clear, ready } = useCart();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [waitedOut, setWaitedOut] = useState(false);

  useEffect(() => {
    if (!UUID.test(token)) {
      setNotFound(true);
      return;
    }
    const supabase = getBrowserClient();
    let stop = false;
    let tries = 0;
    async function load() {
      const { data } = await supabase.rpc("get_order_by_token", { p_token: token });
      if (stop) return;
      if (!data) {
        setNotFound(true);
        return;
      }
      setOrder(data as OrderView);
      // PayFast confirms payment in the background, so keep checking for a short while.
      if ((data as OrderView).status === "pending") {
        tries += 1;
        if (tries < 30) window.setTimeout(load, 3000);
        else setWaitedOut(true);
      }
    }
    load();
    return () => {
      stop = true;
    };
  }, [token]);

  useEffect(() => {
    if (ready && order && (order.status === "paid" || order.status === "shipped")) clear();
  }, [ready, order, clear]);

  if (notFound) {
    return (
      <div className="container page">
        <h1 className="page-title">Order not found</h1>
        <p className="muted">Check the link and try again.</p>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="container page">
        <p className="muted">Loading your order…</p>
      </div>
    );
  }

  const heading =
    order.status === "paid"
      ? "Thank you – your payment was received"
      : order.status === "shipped"
        ? "Your order is on its way"
        : order.status === "pending"
          ? "Confirming your payment…"
          : "Payment not completed";

  return (
    <div className="container page">
      <h1 className="page-title">{heading}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Order #{order.order_number} · {order.customer_name}
      </p>
      <div className="two-col" style={{ marginTop: 24 }}>
        <div className="main-col panel">
          <div style={{ marginBottom: 16 }}>
            <span className={`status-pill status-${order.status}`}>
              {order.status === "pending" ? "Awaiting payment confirmation" : order.status === "paid" ? "Paid" : order.status === "shipped" ? "Shipped" : order.status === "failed" ? "Payment failed" : "Cancelled"}
            </span>
          </div>
          {order.status === "pending" && !waitedOut && (
            <p className="muted" role="status">
              PayFast is confirming your payment. This page updates by itself, usually within a minute.
            </p>
          )}
          {order.status === "pending" && waitedOut && (
            <p className="muted" role="status">
              We haven&apos;t had confirmation from PayFast yet. If you completed the payment, it will show here once PayFast confirms it. Refresh this page in a few minutes.
            </p>
          )}
          {order.status === "paid" && (
            <p className="muted">We&apos;re packing your order now. You&apos;ll get a tracking number as soon as it ships with The Courier Guy.</p>
          )}
          {order.status === "shipped" && (
            <p className="muted">
              Shipped with The Courier Guy.{order.tracking_number ? ` Tracking number: ${order.tracking_number}` : ""}
            </p>
          )}
          {(order.status === "failed" || order.status === "cancelled") && (
            <p className="muted">
              This order wasn&apos;t paid, and you haven&apos;t been charged. Your cart is still saved. <Link href="/cart">Go to cart</Link>
            </p>
          )}
          <p className="muted" style={{ fontSize: 14 }}>
            Keep this page&apos;s link to check your order status later.
          </p>
        </div>
        <aside className="side-col panel" aria-label="Order summary">
          <h2>Order summary</h2>
          <div className="summary-items">
            {order.items.map((i, n) => (
              <div key={n} className="summary-row">
                <span>
                  {i.quantity} × {i.name}
                </span>
                <span>{rand(i.line_total_cents)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row" style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 12 }}>
            <span>Subtotal</span>
            <span>{rand(order.subtotal_cents)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{rand(order.shipping_cents)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{rand(order.total_cents)}</span>
          </div>
          <Link href="/" className="btn btn-outline btn-block" style={{ marginTop: 16 }}>
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
