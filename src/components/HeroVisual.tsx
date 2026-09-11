"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type Props = {
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: "image" | "video";
  scale?: number;
  x?: number;
  y?: number;
};

export default function HeroVisual({ imageUrl, videoUrl, mediaType = "image", scale = 125, x = 0, y = 0 }: Props) {
  const safeScale = Math.min(160, Math.max(80, scale));
  const safeX = Math.min(60, Math.max(-60, x));
  const safeY = Math.min(60, Math.max(-60, y));
  const visualTransform = `translate(${safeX}%, ${safeY}%) scale(${safeScale / 100})`;
  const showVideo = mediaType === "video" && Boolean(videoUrl);
  const showImage = !showVideo && Boolean(imageUrl);

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-md shrink-0 origin-center"
      style={{ transform: visualTransform }}
    >
      {showVideo ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white"
        >
          <video
            src={videoUrl!}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        </motion.div>
      ) : showImage ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white"
        >
          <Image src={imageUrl!} alt="Collection InfraRed" fill quality={100} sizes="45vw" className="object-contain p-5" priority />
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lens-ring absolute inset-6 overflow-hidden rounded-full bg-gradient-to-br from-white via-mist to-[#f0e2e0]"
          >
            <motion.svg
              viewBox="0 0 300 140"
              className="absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2"
              initial={{ y: 6 }}
              animate={{ y: -6 }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            >
              <circle cx="80" cy="70" r="58" fill="none" stroke="#E0122C" strokeWidth="7" />
              <circle cx="220" cy="70" r="58" fill="none" stroke="#E0122C" strokeWidth="7" />
              <path d="M138 62c6-10 18-10 24 0" fill="none" stroke="#E0122C" strokeWidth="7" strokeLinecap="round" />
              <path d="M22 56 L2 48" fill="none" stroke="#E0122C" strokeWidth="7" strokeLinecap="round" />
              <path d="M278 56 L298 48" fill="none" stroke="#E0122C" strokeWidth="7" strokeLinecap="round" />
            </motion.svg>
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-line bg-white px-4 py-1.5 text-[0.65rem] font-medium uppercase tracking-wide text-stone shadow-sm"
          >
            Ajoutez une photo depuis le dashboard
          </motion.span>
        </>
      )}
    </div>
  );
}
