import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import { rand } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";
import ProductImage from "./ProductImage";

export default function ProductCard({ product, categories }: { product: Product; categories: Category[] }) {
  const category = categories.find((c) => c.slug === product.category_slug);
  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-card-link">
        <ProductImage src={product.image_url} alt={product.name} />
        <div className="product-card-body">
          <span className="eyebrow">{category?.name ?? ""}</span>
          <h3>{product.name}</h3>
          <div className="price">{rand(product.price_cents)}</div>
          {product.stock <= 0 ? <span className="stock-note out">Out of stock</span> : product.stock <= 3 ? <span className="stock-note">Only {product.stock} left</span> : null}
        </div>
      </Link>
      <div className="product-card-action">
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}

export function ProductGrid({ products, categories }: { products: Product[]; categories: Category[] }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} categories={categories} />
      ))}
    </div>
  );
}
