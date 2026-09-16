"use client";

import Image, { type ImageLoaderProps } from "next/image";
import type { CSSProperties } from "react";

const passthroughLoader = ({ src }: ImageLoaderProps) => src;

type ExternalImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
};

export default function ExternalImage({ src, alt, fill = false, sizes, priority, className = "", width = 1200, height = 900, style }: ExternalImageProps) {
  if (fill) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} style={style} loader={passthroughLoader} unoptimized />;
  return <Image src={src} alt={alt} width={width} height={height} sizes={sizes} priority={priority} className={className} style={style} loader={passthroughLoader} unoptimized />;
}
