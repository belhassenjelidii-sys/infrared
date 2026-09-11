import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function MentionsLegalesPage() {
  const settings = await getSiteSettings();
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <h1 className="font-display text-3xl">Mentions légales</h1>
      <div className="prose prose-sm mt-8 max-w-none space-y-5 text-sm leading-relaxed text-ink/80">
        <section>
          <h2 className="font-display text-lg text-ink">Éditeur du site</h2>
          <p className="mt-2">
            InfraRed Optic-Store{settings.address ? ` — ${settings.address}` : ""}
            {settings.phone ? `. Téléphone : ${settings.phone}.` : "."}
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-ink">Objet du site</h2>
          <p className="mt-2">
            Ce site présente le catalogue de lunettes solaires et optiques d&apos;InfraRed
            Optic-Store, ses boutiques et ses coordonnées. Il ne permet pas de commande ou de
            paiement en ligne : les achats se font exclusivement en boutique.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-ink">Propriété intellectuelle</h2>
          <p className="mt-2">
            L&apos;ensemble des contenus (textes, images, logo) présents sur ce site est la
            propriété d&apos;InfraRed Optic-Store ou de ses partenaires et ne peut être reproduit
            sans autorisation préalable.
          </p>
        </section>
      </div>
    </div>
  );
}
