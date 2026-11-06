"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { CartIcon, SearchIcon } from "./Icons";

export default function Header() {
  const { count, ready } = useCart();
  return (
    <>
      <div className="test-banner">Test site – payments use the PayFast sandbox. No real money is charged.</div>
      <header className="site-header">
        <div className="container header-row">
          <Link href="/" className="brand" aria-label="SwiftyMart home">
            <img src="/mark.png" alt="" className="brand-mark" />
            <span className="wordmark">
              Swifty<span className="accent-text">Mart</span>
            </span>
          </Link>
          <nav aria-label="Main" className="main-nav">
            <Link href="/category/tech-accessories">Tech Accessories</Link>
            <Link href="/category/backup-power">Backup Power</Link>
            <Link href="/category/gaming-gear">Gaming Gear</Link>
          </nav>
          <div className="header-tools">
            <form role="search" action="/search" className="search-box">
              <SearchIcon />
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <input id="site-search" name="q" type="search" placeholder="Search chargers, power banks, headsets…" />
            </form>
            <Link href="/cart" className="cart-button" aria-label={`Cart, ${ready ? count : 0} items`}>
              <CartIcon />
              <span className="cart-count">{ready ? count : 0}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
