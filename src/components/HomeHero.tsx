"use client";

import Link from "next/link";

export default function HomeHero({ title, subtitle, cta, imageUrl, videoUrl, mediaType, scale = 100, x = 0, y = 0 }: { title: string; subtitle: string; cta: string; imageUrl?: string | null; videoUrl?: string | null; mediaType?: "image" | "video"; scale?: number; x?: number; y?: number }) {
  const src = imageUrl || "/uploads/msvrz53x-c8da396d7bed4ead.webp";
  const transform = `translate(${Math.max(-30, Math.min(30, x))}%, ${Math.max(-30, Math.min(30, y))}%) scale(${Math.max(90, Math.min(145, scale)) / 100})`;
  return (
    <section className="relative min-h-[510px] overflow-hidden bg-[#ececec] sm:min-h-[610px] lg:min-h-[calc(100vh-114px)] lg:max-h-[760px]">
      <div className="absolute inset-0" style={{ transform }}>
        {mediaType === "video" && videoUrl ? (
          <video src={videoUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
        ) : (
          <img src={src} alt="Collection InfraRed Optic-Store" fetchPriority="high" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
      <div className="vf-container relative flex min-h-[510px] items-end pb-12 sm:min-h-[610px] sm:pb-16 lg:min-h-[calc(100vh-114px)] lg:max-h-[760px]">
        <div className="max-w-xl text-white">
          <p className="text-xs uppercase tracking-[0.24em]">InfraRed Optic-Store</p>
          <h1 className="mt-4 text-3xl font-medium leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/85 sm:text-base">{subtitle}</p>
          <Link href="/catalogue" className="mt-7 inline-flex border border-white bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-black transition-colors hover:bg-transparent hover:text-white">{cta}</Link>
        </div>
      </div>
    </section>
  );
}
