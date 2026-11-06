import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getProduct } from "@/lib/data";
import { rand } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import ProductBuyBox from "@/components/ProductBuyBox";
import { CardIcon, ShieldIcon, TruckIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const category = await getCategory(product.category_slug);

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> /{" "}
        {category && <Link href={`/category/${category.slug}`}>{category.name}</Link>} / {product.name}
      </nav>
      <div className="product-layout">
        <ProductImage src={product.image_url} alt={product.name} className="product-hero-image" />
        <div className="product-info">
          {category && <span className="eyebrow">{category.name}</span>}
          <h1>{product.name}</h1>
          <div className="price">{rand(product.price_cents)}</div>
          {product.stock <= 0 ? (
            <span className="stock-note out">Out of stock</span>
          ) : product.stock <= 3 ? (
            <span className="stock-note">Only {product.stock} left in stock</span>
          ) : (
            <span className="muted">In stock</span>
          )}
          <p className="product-desc">{product.description}</p>
          <ProductBuyBox product={product} />
          <ul className="info-list">
            <li>
              <ShieldIcon size={20} /> Secure checkout with PayFast
            </li>
            <li>
              <CardIcon size={20} /> Card or instant EFT
            </li>
            <li>
              <TruckIcon size={20} /> Tracked delivery with The Courier Guy
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
