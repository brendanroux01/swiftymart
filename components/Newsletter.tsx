"use client";

import { useState } from "react";

export default function Newsletter() {
  const [note, setNote] = useState("");
  return (
    <section className="newsletter" aria-labelledby="newsletter-title">
      <div>
        <h2 id="newsletter-title">Get deals first</h2>
        <p>New stock and specials, straight to your inbox.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setNote("Newsletter sign-up will be switched on before the store launches.");
        }}
      >
        <label htmlFor="news-email" className="sr-only">
          Email address
        </label>
        <input id="news-email" type="email" required placeholder="you@example.com" />
        <button type="submit" className="btn btn-primary">
          Subscribe
        </button>
        {note && (
          <p className="form-note" role="status">
            {note}
          </p>
        )}
      </form>
    </section>
  );
}
