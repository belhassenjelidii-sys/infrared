"use client";

import Link from "next/link";
import ManagedImage from "@/components/ManagedImage";

export default function HomeHero({ title, subtitle, cta, imageUrl, videoUrl, mediaType, scale = 100, x = 0, y = 0, preview = false }: { title: string; subtitle: string; cta: string; imageUrl?: string | null; videoUrl?: string | null; mediaType?: "image" | "video"; scale?: number; x?: number; y?: number; preview?: boolean }) {
  const src = imageUrl || "/uploads/msvrz53x-c8da396d7bed4ead.webp";
  const transform = `translate(${Math.max(-30, Math.min(30, x))}%, ${Math.max(-30, Math.min(30, y))}%) scale(${Math.max(90, Math.min(145, scale)) / 100})`;
  return (
    <section className={`relative overflow-hidden bg-[#ececec] ${preview ? "aspect-[16/7] min-h-0" : "min-h-[510px] sm:min-h-[610px] lg:min-h-[calc(100vh-114px)] lg:max-h-[760px]"}`}>
      <div className="absolute inset-0" style={{ transform }}>
        {mediaType === "video" && videoUrl ? (
          <video src={videoUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
        ) : (
          <ManagedImage src={src} alt="Collection InfraRed Optic-Store" fill priority sizes="100vw" quality={100} unoptimized={src.startsWith("/uploads/")} className="object-cover" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
      <div className={`vf-container relative flex items-end ${preview ? "h-full min-h-0 pb-[7%]" : "min-h-[510px] pb-12 sm:min-h-[610px] sm:pb-16 lg:min-h-[calc(100vh-114px)] lg:max-h-[760px]"}`}>
        <div className="max-w-xl text-white">
          <p className={`${preview ? "text-[7px]" : "text-xs"} uppercase tracking-[0.24em]`}>InfraRed Optic-Store</p>
          <h1 className={`${preview ? "mt-2 text-sm sm:text-xl" : "mt-4 text-3xl sm:text-5xl"} font-medium leading-tight`}>{title}</h1>
          <p className={`${preview ? "mt-2 max-w-[45%] text-[8px] leading-3 sm:text-[11px] sm:leading-4" : "mt-4 max-w-lg text-sm leading-6 sm:text-base"} text-white/85`}>{subtitle}</p>
          {preview ? <span className="mt-3 inline-flex border border-white bg-white px-3 py-1.5 text-[7px] font-semibold uppercase tracking-[0.14em] text-black">{cta}</span> : <Link href="/catalogue" className="mt-7 inline-flex border border-white bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition-colors hover:bg-transparent hover:text-white">{cta}</Link>}
        </div>
      </div>
    </section>
  );
}
