import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Guide des tailles : comment bien choisir mes lunettes de soleil ou de vue ?",
  description: "Comprendre les dimensions d’une monture et choisir une taille Small, Medium ou Large avec les conseils InfraRed Optic-Store.",
  alternates: { canonical: "/guide" },
};

const dimensionItems = [
  { image: "/images/guide/glasses.png", alt: "Mesure de la largeur du verre", title: "Verres", text: <>La largeur ou le diamètre du verre est le premier nombre <strong className="text-red">(52-18-140)</strong>.</> },
  { image: "/images/guide/bridge.png", alt: "Mesure du pont de la monture", title: "Pont", text: <>La dimension du pont est la distance entre les deux verres <strong className="text-red">(52-18-140)</strong>.</> },
  { image: "/images/guide/temple_s.png", alt: "Mesure de la longueur des branches", title: "Branche", text: <>Le troisième nombre de la séquence est la longueur des branches <strong className="text-red">(52-18-140)</strong>.</> },
];

const fitItems = [
  { image: "/images/guide/small.png", alt: "Position A pour une petite monture", title: "Small", text: <>Si le bord de la carte dépasse l’extrémité de l’œil, préférez une monture <strong>Small</strong>.</> },
  { image: "/images/guide/medium.png", alt: "Position B pour une monture moyenne", title: "Medium", text: <>Si le bord de la carte se termine à l’extrémité de l’œil, optez pour la taille <strong>Medium</strong>.</> },
  { image: "/images/guide/large.png", alt: "Position C pour une grande monture", title: "Large", text: <>Si le bord de la carte n’atteint pas l’extrémité de l’œil, choisissez une taille <strong>Large</strong>.</> },
];

export default function SizeGuidePage() {
  return <main className="bg-white">
    <div className="vf-container py-16 sm:py-24">
      <h1 className="mx-auto max-w-6xl text-center text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-[1.75rem]">Guide des tailles : comment bien choisir mes lunettes de soleil ou de vue&nbsp;?</h1>

      <section className="mx-auto mt-16 grid max-w-6xl gap-10 lg:grid-cols-[1.55fr_.95fr] lg:items-center">
        <div className="relative aspect-[2.8/1] overflow-hidden bg-[#f1f1f1]"><Image src="/images/guide/temple.png" alt="Exemple des dimensions 52-18-140 imprimées sur une branche de lunettes" fill priority quality={100} sizes="(max-width:1024px) 100vw, 60vw" className="object-contain"/></div>
        <article className="border-y-2 border-black py-9"><h2 className="text-sm font-bold uppercase tracking-[-0.01em]">Que représentent les chiffres présents sur ma monture&nbsp;?</h2><p className="mt-5 text-sm leading-6">Les dimensions d’une monture sont généralement imprimées à l’intérieur de la branche gauche. Elles correspondent à trois mesures exprimées en millimètres&nbsp;: <strong>largeur du verre, écart du pont et longueur des branches.</strong></p><p className="mt-2 text-sm leading-6">La largeur du verre donne aussi une bonne indication sur la largeur globale de la monture.</p></article>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-10 md:grid-cols-3">{dimensionItems.map((item)=><article key={item.title} className="grid grid-cols-[126px_1fr] items-center gap-x-5 gap-y-3"><div className="relative aspect-square"><Image src={item.image} alt={item.alt} fill quality={100} sizes="126px" className="object-contain"/></div><p className="text-sm leading-6">{item.text}</p><h3 className="text-center text-sm font-bold uppercase">{item.title}</h3></article>)}</section>

      <h2 className="mt-20 text-center text-[1.65rem] font-semibold tracking-[-0.02em] sm:text-[2rem]">Notre astuce pour trouver votre taille de lunettes</h2>

      <section className="mx-auto mt-16 grid max-w-6xl gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <article className="border-y-2 border-black py-9"><h3 className="text-sm font-bold uppercase">Utiliser votre carte et déterminer la taille qui vous convient</h3><p className="mt-5 text-sm leading-6">La dimension d’une carte bancaire est approximativement identique à la largeur d’un verre de lunettes de taille standard.</p><p className="mt-5 text-sm leading-6">Small, Medium ou Large&nbsp;? Placez <strong>un côté de la carte au centre de votre nez</strong> et observez l’alignement de l’autre côté.</p></article>
        <div className="relative aspect-[2.4/1] overflow-hidden bg-[#f1f1f1]"><Image src="/images/guide/card-fit.png" alt="Méthode de la carte pour déterminer la taille de lunettes" fill quality={100} sizes="(max-width:1024px) 100vw, 45vw" className="object-contain"/></div>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-10 md:grid-cols-3">{fitItems.map((item)=><article key={item.title} className="grid grid-cols-[126px_1fr] items-center gap-x-5 gap-y-3"><div className="relative aspect-square"><Image src={item.image} alt={item.alt} fill quality={100} sizes="126px" className="object-contain"/></div><p className="text-sm leading-6">{item.text}</p><h3 className="text-center text-sm font-bold uppercase">{item.title}</h3></article>)}</section>
    </div>
  </main>;
}
