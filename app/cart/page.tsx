"use client";

import Link from "next/link";
import { rand } from "@/lib/format";
import { useLiveCart } from "@/components/useLiveCart";
import { MAX_QTY } from "@/components/CartContext";
import ProductImage from "@/components/ProductImage";
import { TrashIcon } from "@/components/Icons";

export default function CartPage() {
  const { items, subtotal, setQuantity, remove, shipping, synced, ready } = useLiveCart();

  if (!ready || !synced) {
    return (
      <div className="container page">
        <h1 className="page-title">Your cart</h1>
        <p className="muted">Loading your cart…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">Your cart</h1>
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
  return (
    <div className="container page">
      <h1 className="page-title">Your cart</h1>
      <div className="two-col">
        <div className="main-col panel">
          {items.map((item) => {
            const max = Math.min(MAX_QTY, item.stock);
            return (
              <div key={item.product_id} className="cart-line">
                <ProductImage src={item.image_url} alt={item.name} className="thumb" />
                <div className="cart-line-info">
                  <Link href={`/product/${item.slug}`}>{item.name}</Link>
                  <div className="muted">{rand(item.price_cents)} each</div>
                </div>
                <div className="qty-control" role="group" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => setQuantity(item.product_id, item.quantity - 1)}>
                    −
                  </button>
                  <output aria-live="polite">{item.quantity}</output>
                  <button type="button" aria-label="Increase quantity" disabled={item.quantity >= max} onClick={() => setQuantity(item.product_id, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <div className="cart-line-total">{rand(item.price_cents * item.quantity)}</div>
                <button type="button" className="icon-btn" aria-label={`Remove ${item.name}`} onClick={() => remove(item.product_id)}>
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>
        <aside className="side-col panel" aria-label="Order summary">
          <h2>Summary</h2>
          <div className="summary-row">
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
          <Link href="/checkout" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Checkout
          </Link>
          <Link href="/" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
