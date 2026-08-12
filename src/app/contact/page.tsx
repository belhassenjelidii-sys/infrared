import type { Metadata } from "next";
import { MessageCircle, Phone, MapPin } from "lucide-react";
import { shopInfo } from "@/lib/data";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez InfraRed Optic-Store par téléphone, WhatsApp ou message.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="eyebrow text-red">Nous contacter</p>
      <h1 className="font-display mt-2 text-3xl sm:text-4xl">Une question ? Parlons-en.</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <a
            href={`https://wa.me/${shopInfo.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-line p-5 transition-colors hover:border-red"
          >
            <MessageCircle size={20} className="text-red" />
            <div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-sm text-stone">Réponse rapide, aux heures d&apos;ouverture</p>
            </div>
          </a>
          <a
            href={`tel:${shopInfo.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-4 rounded-2xl border border-line p-5 transition-colors hover:border-red"
          >
            <Phone size={20} className="text-red" />
            <div>
              <p className="font-medium">{shopInfo.phone}</p>
              <p className="text-sm text-stone">Appelez directement la boutique</p>
            </div>
          </a>
          <a
            href={shopInfo.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-line p-5 transition-colors hover:border-red"
          >
            <MapPin size={20} className="text-red" />
            <div>
              <p className="font-medium">{shopInfo.address}</p>
              <p className="text-sm text-stone">Voir l&apos;itinéraire</p>
            </div>
          </a>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
