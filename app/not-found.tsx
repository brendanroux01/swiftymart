import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page">
      <h1 className="page-title">Page not found</h1>
      <p className="muted">That page doesn&apos;t exist or the product is no longer available.</p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: 12 }}>
        Back to the store
      </Link>
    </div>
  );
}
