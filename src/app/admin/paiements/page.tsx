import AdminShell from "@/components/AdminShell";
import ActionForm, { SubmitButton } from "@/components/ActionForm";
import { Field, Select } from "@/components/AdminFields";
import { requirePagePermission } from "@/lib/authz";
import { commerceSettings } from "@/lib/features";
import { prisma } from "@/lib/prisma";
import { PAYMENT_PROVIDER_LABELS, TND_PAYMENT_PROVIDERS, type TndPaymentProvider } from "@/lib/tnd-payment";
import { testPaymentGatewayAction, updatePaymentGatewayAction, updatePaymentOptionsAction } from "@/app/admin/configuration/actions";

const toggleClass = "flex min-h-14 items-center justify-between rounded-xl border border-line bg-white px-4 text-sm";

function validProvider(value: string | null | undefined): TndPaymentProvider {
  return TND_PAYMENT_PROVIDERS.includes(value as TndPaymentProvider) ? value as TndPaymentProvider : "FLOUCI";
}

export default async function PaymentsPage() {
  await requirePagePermission("payments.manage");
  const settings = await prisma.storeSettings.findUnique({
    where: { singletonKey: "main" },
    select: { features: true, paymentProvider: true, paymentMode: true, paymentPublicKey: true, paymentSecretEncrypted: true, paymentMerchantId: true, paymentApiBaseUrl: true },
  });
  const commerce = commerceSettings(settings?.features);
  const provider = validProvider(settings?.paymentProvider);
  const configured = Boolean(settings?.paymentSecretEncrypted && (
    (provider === "FLOUCI" && settings.paymentPublicKey)
    || (provider === "KONNECT" && settings.paymentMerchantId)
    || (provider === "CLICKTOPAY" && settings.paymentPublicKey && settings.paymentMerchantId && settings.paymentApiBaseUrl)
  ));

  return <AdminShell active="/admin/paiements">
    <p className="eyebrow text-red">Encaissement</p>
    <h1 className="mt-2 text-3xl font-semibold">Paiements en dinars tunisiens</h1>
    <p className="mt-2 max-w-3xl text-sm text-stone">Tous les prix, débits et contrôles de montant restent en TND. Aucune conversion EUR ou USD n’est utilisée.</p>

    <ActionForm action={updatePaymentOptionsAction} className="mt-6 grid gap-4 rounded-2xl border border-line bg-white p-6">
      <h2 className="font-display text-xl">Modes proposés au client</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={toggleClass}><span><strong className="block">Paiement à la livraison</strong><small className="text-stone">Règlement lors de la réception</small></span><input type="checkbox" name="cashOnDelivery" defaultChecked={commerce.cashOnDelivery} className="h-5 w-5 accent-red"/></label>
        <label className={toggleClass}><span><strong className="block">Paiement en ligne</strong><small className="text-stone">Flouci ou Konnect, directement en TND</small></span><input type="checkbox" name="onlinePayment" defaultChecked={commerce.onlinePayment} className="h-5 w-5 accent-red"/></label>
      </div>
      <div><SubmitButton>Enregistrer les modes</SubmitButton></div>
    </ActionForm>

    <section className="mt-5 rounded-2xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="eyebrow text-red">Passerelle sécurisée</p><h2 className="font-display mt-1 text-xl">{PAYMENT_PROVIDER_LABELS[provider]} · TND</h2></div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{configured ? "Configuration enregistrée" : "À configurer"}</span>
      </div>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-stone md:grid-cols-3">
        <p className="rounded-xl border border-line p-4"><strong className="block text-ink">Flouci</strong>Clé publique + clé privée. Wallet, carte et e-Dinar selon votre contrat.</p>
        <p className="rounded-xl border border-line p-4"><strong className="block text-ink">Konnect</strong>Clé API + Receiver Wallet ID. Sandbox et production en TND.</p>
        <p className="rounded-xl border border-line p-4"><strong className="block text-ink">ClickToPay (SMT)</strong>Les champs sont prêts. L’activation finale dépend du profil API remis par votre banque/SMT.</p>
      </div>

      <ActionForm action={updatePaymentGatewayAction} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Fournisseur" name="paymentProvider" value={provider} required empty="Choisir" options={TND_PAYMENT_PROVIDERS.map((value) => ({ value, label: PAYMENT_PROVIDER_LABELS[value] }))}/>
          <Select label="Environnement" name="paymentMode" value={settings?.paymentMode ?? "sandbox"} required empty="Choisir" options={[{value:"sandbox",label:"Sandbox · test"},{value:"live",label:"Live · réel"}]}/>
          <Field label="Devise" name="currency" value="TND · Dinar tunisien" disabled />
        </div>
        <Field label="Clé publique / identifiant API (Flouci et ClickToPay)" name="paymentPublicKey" value={settings?.paymentPublicKey} maxLength={500} autoComplete="off"/>
        <Field label="Receiver Wallet ID / Terminal marchand (Konnect ou ClickToPay)" name="paymentMerchantId" value={settings?.paymentMerchantId} maxLength={500} autoComplete="off"/>
        <Field label={settings?.paymentSecretEncrypted ? "Clé secrète / API · laisser vide pour conserver l’actuelle" : "Clé secrète / API"} name="paymentSecret" type="password" required={!settings?.paymentSecretEncrypted} maxLength={1000} autoComplete="new-password"/>
        <Field label="URL API personnalisée (contrat ClickToPay)" name="paymentApiBaseUrl" value={settings?.paymentApiBaseUrl} placeholder="https://…" maxLength={500} autoComplete="off"/>
        <p className="text-xs leading-5 text-stone">Les secrets sont chiffrés avant stockage et ne sont jamais réaffichés. Flouci et Konnect utilisent automatiquement leurs URL officielles si le champ URL est vide.</p>
        <div><SubmitButton>Enregistrer la passerelle TND</SubmitButton></div>
      </ActionForm>

      <ActionForm action={testPaymentGatewayAction} className="mt-5 grid gap-3 border-t border-line pt-5">
        <p className="text-xs text-stone">La vérification contrôle les paramètres requis sans déclencher de débit.</p>
        <div><SubmitButton disabled={!configured || provider === "CLICKTOPAY"}>Vérifier la configuration</SubmitButton></div>
      </ActionForm>
    </section>
  </AdminShell>;
}
