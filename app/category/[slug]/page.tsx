import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategory, getProductsInCategory } from "@/lib/data";
import { ProductGrid } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [category, categories, products] = await Promise.all([
    getCategory(slug),
    getCategories(),
    getProductsInCategory(slug),
  ]);
  if (!category) notFound();

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / {category.name}
      </nav>
      <div className="section-head">
        <div>
          <h1 className="page-title">{category.name}</h1>
          <p>{category.description}</p>
        </div>
        <span className="muted">
          {products.length} {products.length === 1 ? "product" : "products"}
        </span>
      </div>
      {products.length ? (
        <ProductGrid products={products} categories={categories} />
      ) : (
        <p className="muted">No products in this category yet. Check back soon.</p>
      )}
    </div>
  );
}
