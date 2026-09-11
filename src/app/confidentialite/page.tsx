import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false },
};

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <h1 className="font-display text-3xl">Politique de confidentialité</h1>
      <div className="prose prose-sm mt-8 max-w-none space-y-5 text-sm leading-relaxed text-ink/80">
        <section>
          <h2 className="font-display text-lg text-ink">Données collectées</h2>
          <p className="mt-2">
            Lorsque vous utilisez notre formulaire de contact, nous collectons votre nom, votre
            adresse email, votre numéro de téléphone et le contenu de votre message,
            dans le seul but de répondre à votre demande.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-ink">Conservation</h2>
          <p className="mt-2">
            Ces données sont conservées le temps nécessaire au traitement de votre demande et ne
            sont partagées avec aucun tiers à des fins commerciales.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-ink">Vos droits</h2>
          <p className="mt-2">
            Vous pouvez demander l&apos;accès, la correction ou la suppression de vos données en
            nous contactant directement via la page Contact.
          </p>
        </section>
      </div>
    </div>
  );
}
