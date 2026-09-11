import Image from "next/image";

type ManagedImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  quality?: 75 | 90 | 100;
  priority?: boolean;
  className?: string;
  unoptimized?: boolean;
};

/**
 * Images imported by the dashboard are processed and stored locally, then
 * served through Next's responsive optimiser. A few older catalogue records
 * still contain a direct image URL; show those safely without making the
 * whole application accept arbitrary hosts in next.config.ts.
 */
export default function ManagedImage({ src, alt, fill = false, className = "", priority, quality = 100, ...props }: ManagedImageProps) {
  if (/^https?:\/\//i.test(src)) {
    return (
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={fill ? `absolute inset-0 h-full w-full ${className}` : className}
      />
    );
  }

  return <Image src={src} alt={alt} fill={fill} priority={priority} quality={quality} className={className} {...props} />;
}
