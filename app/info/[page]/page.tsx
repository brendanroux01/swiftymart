import Link from "next/link";
import { notFound } from "next/navigation";

const PAGES: Record<string, { title: string; body: string[] }> = {
  delivery: {
    title: "Delivery information",
    body: [
      "Orders are delivered anywhere in South Africa by The Courier Guy.",
      "Once your order ships, you'll receive a tracking number so you can follow your parcel.",
      "[Delivery times and fees to be confirmed before launch.]",
    ],
  },
  returns: {
    title: "Returns",
    body: ["[Returns and refunds policy to be added before launch.]"],
  },
  contact: {
    title: "Contact us",
    body: ["Email: [Contact email]", "WhatsApp: [WhatsApp number]", "[Business hours to be added.]"],
  },
  about: {
    title: "About SwiftyMart",
    body: [
      "SwiftyMart sells tech accessories, backup power and gaming gear online, delivered across South Africa.",
      "Everything you want. One swift click.",
    ],
  },
  terms: {
    title: "Terms and conditions",
    body: ["[Terms and conditions to be added before launch.]"],
  },
  privacy: {
    title: "Privacy policy",
    body: ["[Privacy policy (POPIA) to be added before launch.]"],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  return { title: PAGES[page]?.title ?? "Information" };
}

export default async function InfoPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const content = PAGES[page];
  if (!content) notFound();
  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / {content.title}
      </nav>
      <h1 className="page-title">{content.title}</h1>
      <div className="prose">
        {content.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
