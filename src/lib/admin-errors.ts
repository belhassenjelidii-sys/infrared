import { Prisma } from "@prisma/client";
export class FormError extends Error {}
export function adminError(error: unknown): string {
  if(error instanceof Prisma.PrismaClientKnownRequestError) {
    if(error.code==="P2002") {const target=String(error.meta?.target??"");return target.includes("ean")?"Cet EAN existe déjà.":target.includes("sku")?"Ce SKU existe déjà.":target.includes("slug")?"Cette URL existe déjà.":"Cette référence ou ce modèle existe déjà.";}
    if(error.code==="P2003") return "Cet élément est encore utilisé. Archivez-le plutôt que de le supprimer.";
    if(error.code==="P2025") return "Cet élément n’existe plus. Actualisez la page.";
    return "L’enregistrement a échoué. Réessayez.";
  }
  return error instanceof Error && !error.message.includes("prisma") ? error.message : "Une erreur est survenue. Réessayez.";
}
