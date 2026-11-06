"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import AddToCartButton from "./AddToCartButton";
import { MAX_QTY } from "./CartContext";

export default function ProductBuyBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const max = Math.min(MAX_QTY, Math.max(product.stock, 1));
  if (product.stock <= 0) return <AddToCartButton product={product} className="btn btn-primary" />;
  return (
    <div className="qty-row">
      <div className="qty-control" role="group" aria-label="Quantity">
        <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>
          −
        </button>
        <output aria-live="polite">{qty}</output>
        <button type="button" aria-label="Increase quantity" disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))}>
          +
        </button>
      </div>
      <AddToCartButton product={product} quantity={qty} className="btn btn-primary" />
    </div>
  );
}
