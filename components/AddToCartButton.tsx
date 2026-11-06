"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import type { Product } from "@/lib/types";

export default function AddToCartButton({
  product,
  quantity = 1,
  className = "btn btn-primary btn-block",
}: {
  product: Pick<Product, "id" | "slug" | "name" | "price_cents" | "image_url" | "stock">;
  quantity?: number;
  className?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (product.stock <= 0) {
    return (
      <button type="button" className={className} disabled>
        Out of stock
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        add(
          {
            product_id: product.id,
            slug: product.slug,
            name: product.name,
            price_cents: product.price_cents,
            image_url: product.image_url,
            stock: product.stock,
          },
          quantity
        );
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
    >
      {added ? "Added to cart" : "Add to cart"}
    </button>
  );
}
