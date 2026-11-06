import Link from "next/link";
import { getCategories, searchProducts } from "@/lib/data";
import { ProductGrid } from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const [products, categories] = await Promise.all([searchProducts(term), getCategories()]);

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / Search
      </nav>
      <div className="section-head">
        <div>
          <h1 className="page-title">{term ? `Results for “${term}”` : "Search"}</h1>
          <p>
            {term
              ? `${products.length} ${products.length === 1 ? "product" : "products"} found`
              : "Type in the search bar above to find products."}
          </p>
        </div>
      </div>
      {term && products.length === 0 ? (
        <p className="muted">
          Nothing matched. Try a shorter word, or browse <Link href="/#categories">the categories</Link>.
        </p>
      ) : (
        <ProductGrid products={products} categories={categories} />
      )}
    </div>
  );
}
