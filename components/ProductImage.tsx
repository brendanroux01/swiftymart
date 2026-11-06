import { ImageIcon } from "./Icons";

export default function ProductImage({
  src,
  alt,
  className = "product-image",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={className}>
        <img src={src} alt={alt} loading={className === "product-image" ? "lazy" : "eager"} />
      </div>
    );
  }
  return (
    <div className={`${className} placeholder`}>
      <ImageIcon />
      <span>Photo coming soon</span>
    </div>
  );
}
