import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <span className="wordmark small">
            Swifty<span className="accent-text">Mart</span>
          </span>
          <p className="muted">Everything you want. One swift click.</p>
          <p className="muted">[Contact email] · [WhatsApp number]</p>
        </div>
        <nav aria-label="Shop" className="footer-col">
          <h3>Shop</h3>
          <Link href="/category/tech-accessories">Tech Accessories</Link>
          <Link href="/category/backup-power">Backup Power</Link>
          <Link href="/category/gaming-gear">Gaming Gear</Link>
        </nav>
        <nav aria-label="Help" className="footer-col">
          <h3>Help</h3>
          <Link href="/info/delivery">Delivery information</Link>
          <Link href="/info/returns">Returns</Link>
          <Link href="/info/contact">Contact us</Link>
        </nav>
        <nav aria-label="Company" className="footer-col">
          <h3>Company</h3>
          <Link href="/info/about">About SwiftyMart</Link>
          <Link href="/info/terms">Terms and conditions</Link>
          <Link href="/info/privacy">Privacy policy</Link>
        </nav>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} SwiftyMart. All rights reserved.</span>
        <span>Secure payments by PayFast · Deliveries by The Courier Guy</span>
      </div>
    </footer>
  );
}
