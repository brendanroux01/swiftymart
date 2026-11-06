import Link from "next/link";
import { getCategories, getFeaturedProducts } from "@/lib/data";
import { ProductGrid } from "@/components/ProductCard";
import { CardIcon, CategoryIcon, ShieldIcon, TruckIcon } from "@/components/Icons";
import Newsletter from "@/components/Newsletter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeaturedProducts()]);

  return (
    <>
      <section className="container hero">
        <div className="hero-text">
          <p className="tagline">Everything you want. One swift click.</p>
          <h1>Tech, power and gaming gear – delivered to your door.</h1>
          <p>
            Chargers, cables, power banks, backup power and gaming accessories, shipped anywhere in South Africa with
            The Courier Guy.
          </p>
          <div className="hero-actions">
            <Link href="#featured" className="btn btn-primary">
              Shop now
            </Link>
            <Link href="/category/backup-power" className="btn btn-outline">
              Shop backup power
            </Link>
          </div>
        </div>
        <div className="hero-logo">
          <img src="/logo.jpg" alt="SwiftyMart logo: a speeding shopping cart shaped like an S" />
        </div>
      </section>

      <section aria-label="Why shop with us" className="trust">
        <div className="container trust-grid">
          <div className="trust-item">
            <ShieldIcon />
            <div>
              <strong>Secure checkout</strong>
              <span>Payments processed by PayFast</span>
            </div>
          </div>
          <div className="trust-item">
            <TruckIcon />
            <div>
              <strong>Nationwide delivery</strong>
              <span>Tracked courier with The Courier Guy</span>
            </div>
          </div>
          <div className="trust-item">
            <CardIcon />
            <div>
              <strong>Pay your way</strong>
              <span>Card or instant EFT</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container section" id="categories">
        <div className="section-head">
          <div>
            <h2>Shop by category</h2>
            <p>Three ranges, one swift checkout.</p>
          </div>
        </div>
        <div className="category-grid">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="category-card">
              <div className="icon-tile">
                <CategoryIcon slug={c.slug} />
              </div>
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <span className="card-link">Shop {c.name.toLowerCase()} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section" id="featured">
        <div className="section-head">
          <div>
            <h2>Featured products</h2>
            <p>Hand-picked gear from across the store.</p>
          </div>
        </div>
        {featured.length ? (
          <ProductGrid products={featured} categories={categories} />
        ) : (
          <p className="muted">No featured products yet.</p>
        )}
      </section>

      <section className="promo">
        <div className="container promo-row">
          <div>
            <h2>Keep the Wi-Fi on when the power goes off.</h2>
            <p>Router UPS units and portable power stations to keep your internet, phone and laptop running through outages.</p>
          </div>
          <Link href="/category/backup-power" className="btn btn-primary">
            Shop backup power
          </Link>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <h2>How it works</h2>
          </div>
        </div>
        <ol className="steps">
          <li>
            <span className="num">1</span>
            <h3>Pick your gear</h3>
            <p>Browse the range and add what you need to your cart.</p>
          </li>
          <li>
            <span className="num">2</span>
            <h3>Pay securely</h3>
            <p>Check out with PayFast using your card or instant EFT.</p>
          </li>
          <li>
            <span className="num">3</span>
            <h3>Track your delivery</h3>
            <p>The Courier Guy brings it to your door, and we send you the tracking number.</p>
          </li>
        </ol>
      </section>

      <div className="container">
        <Newsletter />
      </div>
    </>
  );
}
