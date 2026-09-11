import { rankSimilarProducts, scoreSimilarity } from "../src/lib/product-intelligence/similarity-engine";
import type { AnalyzableProduct } from "../src/lib/product-intelligence/types";

function make(overrides: Partial<AnalyzableProduct> & { id: string }): AnalyzableProduct {
  return {
    name: overrides.name ?? overrides.id,
    slug: overrides.id,
    reference: `REF-${overrides.id}`,
    description: "",
    price: 200,
    oldPrice: null,
    isPromotion: false,
    isNew: false,
    color: "Noir",
    shape: "Rectangulaire",
    brandName: "Ray-Ban",
    categoryName: "Lunettes solaires",
    target: "MIXTE",
    images: [],
    mainImageHash: null,
    ...overrides,
  };
}

function assert(label: string, condition: boolean, detail?: string) {
  console.log(condition ? "PASS" : "FAIL", "-", label, detail ? `(${detail})` : "");
  if (!condition) process.exitCode = 1;
}

console.log("\n=== Cas 1 : produit sans similaires (catalogue d'un seul produit) ===");
{
  const ref = make({ id: "ref" });
  const results = rankSimilarProducts(ref, [ref]);
  assert("aucun resultat retourne (le produit ne se recommande jamais lui-meme)", results.length === 0);
}

console.log("\n=== Cas 2 : produit avec beaucoup de similaires ===");
{
  const ref = make({ id: "ref", brandName: "Ray-Ban", categoryName: "Lunettes solaires", shape: "Aviateur", color: "Dore", price: 200 });
  const candidates = Array.from({ length: 30 }, (_, i) =>
    make({ id: `similar-${i}`, brandName: "Ray-Ban", categoryName: "Lunettes solaires", shape: "Aviateur", color: "Dore", price: 195 + i })
  );
  const results = rankSimilarProducts(ref, [ref, ...candidates], 4);
  assert("retourne exactement 4 resultats (limite respectee malgre 30 candidats proches)", results.length === 4);
  assert("aucun resultat n'est le produit lui-meme", !results.some((r) => r.productId === "ref"));
  assert("scores tries du plus eleve au plus bas", results.every((r, i) => i === 0 || r.score <= results[i - 1].score));
}

console.log("\n=== Cas 3 : garantie disponibilite (documente + verifie par lecture de code) ===");
{
  const ref = make({ id: "ref" });
  const onlyCandidate = make({ id: "would-be-unavailable", brandName: "Ray-Ban" });
  const results = rankSimilarProducts(ref, [ref, onlyCandidate]);
  assert("note: la disponibilite est filtree AVANT le scoring, au niveau Prisma (WHERE available:true) - un produit indisponible n'entre jamais dans ce pool en production", results.length === 1);
}

console.log("\n=== Cas 4 : marque differente ===");
{
  const ref = make({ id: "ref", brandName: "Ray-Ban", categoryName: "Lunettes solaires" });
  const sameBrandDiffEverythingElse = make({ id: "same-brand", brandName: "Ray-Ban", categoryName: "Lunettes optiques", shape: "Ronde", color: "Rouge", price: 500 });
  const diffBrandSameEverythingElse = make({ id: "diff-brand", brandName: "Persol", categoryName: "Lunettes solaires", shape: "Rectangulaire", color: "Noir", price: 200 });
  const scoreA = scoreSimilarity(ref, sameBrandDiffEverythingElse);
  const scoreB = scoreSimilarity(ref, diffBrandSameEverythingElse);
  assert(
    "un produit de marque differente mais tres proche sur le reste peut depasser un produit de meme marque mais tres different",
    scoreB.score > scoreA.score,
    `diffBrand=${scoreB.score.toFixed(3)} vs sameBrandOnly=${scoreA.score.toFixed(3)}`
  );
  assert("sameBrand=true bien detecte", scoreA.factors.sameBrand === true);
  assert("sameBrand=false bien detecte pour la marque differente", scoreB.factors.sameBrand === false);
}

console.log("\n=== Cas 5 : categories differentes ===");
{
  const ref = make({ id: "ref", categoryName: "Lunettes solaires" });
  const sameCat = make({ id: "same-cat", categoryName: "Lunettes solaires" });
  const diffCat = make({ id: "diff-cat", categoryName: "Lunettes optiques" });
  const scoreSame = scoreSimilarity(ref, sameCat);
  const scoreDiff = scoreSimilarity(ref, diffCat);
  assert("sameCategory augmente le score", scoreSame.score > scoreDiff.score);
  assert("sameCategory=false bien detecte", scoreDiff.factors.sameCategory === false);
}

console.log("\n=== Cas 6 : similarite visuelle (hash perceptuel) ===");
{
  const ref = make({ id: "ref", mainImageHash: "00ff00ff00ff00ff" });
  const identicalHash = make({ id: "identical", brandName: "Autre", categoryName: "Autre", shape: null, color: "Vert", mainImageHash: "00ff00ff00ff00ff" });
  const noHash = make({ id: "no-hash", brandName: "Autre", categoryName: "Autre", shape: null, color: "Vert", mainImageHash: null });
  const scoreWithHash = scoreSimilarity(ref, identicalHash);
  const scoreNoHash = scoreSimilarity(ref, noHash);
  assert("un hash identique augmente le score par rapport a l'absence de hash", scoreWithHash.score > scoreNoHash.score);
  assert("visualSimilarity=1.0 pour un hash identique", scoreWithHash.factors.visualSimilarity === 1);
  assert("visualSimilarity=0 quand aucun hash n'est disponible (jamais invente)", scoreNoHash.factors.visualSimilarity === 0);
}

console.log("\n=== Cas 7 : promotion/nouveaute comme simple departage, jamais dominant ===");
{
  const ref = make({ id: "ref", brandName: "Ray-Ban", categoryName: "Lunettes solaires", shape: "Aviateur" });
  const relevantNotNew = make({ id: "relevant", brandName: "Ray-Ban", categoryName: "Lunettes solaires", shape: "Aviateur", isNew: false });
  const irrelevantButNew = make({ id: "irrelevant-new", brandName: "Persol", categoryName: "Lunettes optiques", shape: "Ronde", isNew: true, isPromotion: true });
  const scoreRelevant = scoreSimilarity(ref, relevantNotNew);
  const scoreIrrelevant = scoreSimilarity(ref, irrelevantButNew);
  assert(
    "un produit pertinent mais pas nouveau bat un produit non pertinent juste parce qu'il est nouveau/promo",
    scoreRelevant.score > scoreIrrelevant.score,
    `relevant=${scoreRelevant.score.toFixed(3)} vs irrelevantButNew=${scoreIrrelevant.score.toFixed(3)}`
  );
}

console.log("\n" + (process.exitCode ? "=== ECHEC: au moins un test a echoue ===" : "=== TOUS LES TESTS PASSENT ==="));
