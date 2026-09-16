import Image from "next/image";
import type { CSSProperties } from "react";
import ExternalImage from "@/components/ExternalImage";

type ManagedImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  quality?: 75 | 90 | 100;
  priority?: boolean;
  className?: string;
  unoptimized?: boolean;
  width?: number;
  height?: number;
  style?: CSSProperties;
};

/**
 * Images imported by the dashboard are processed and stored locally, then
 * served through Next's responsive optimiser. A few older catalogue records
 * still contain a direct image URL; show those safely without making the
 * whole application accept arbitrary hosts in next.config.ts.
 */
export default function ManagedImage({ src, alt, fill = false, className = "", priority, quality = 100, width = 1200, height = 900, ...props }: ManagedImageProps) {
  if (/^https?:\/\//i.test(src)) {
    return <ExternalImage src={src} alt={alt} fill={fill} priority={priority} className={className} width={width} height={height} {...props} />;
  }

  if (fill) return <Image src={src} alt={alt} fill priority={priority} quality={quality} className={className} {...props} />;
  return <Image src={src} alt={alt} width={width} height={height} priority={priority} quality={quality} className={className} {...props} />;
}
