"use client";

import { useActionState, useState } from "react";

export type SmtpProvider = "gmail" | "microsoft365" | "custom";
export type SmtpActionState = { ok?: boolean; error?: string; message?: string };
type SmtpFormAction = (prevState: SmtpActionState, formData: FormData) => Promise<SmtpActionState>;

type Props = {
  action: SmtpFormAction;
  initialProvider: SmtpProvider | null;
  initialHost: string;
  initialPort: number;
  initialSecure: boolean;
  initialUser: string;
  initialFromEmail: string;
  initialFromName: string;
  passwordConfigured: boolean;
  testAction: () => Promise<SmtpActionState>;
};

const DEFAULTS: Record<Exclude<SmtpProvider, "custom">, { host: string; port: number; secure: boolean }> = {
  gmail: { host: "smtp.gmail.com", port: 587, secure: false },
  microsoft365: { host: "smtp.office365.com", port: 587, secure: false },
};

export default function SmtpSettingsForm(props: Props) {
  const [state, formAction, pending] = useActionState(props.action, {});
  const [provider, setProvider] = useState<SmtpProvider>(props.initialProvider ?? "gmail");
  const [host, setHost] = useState(props.initialHost);
  const [port, setPort] = useState(String(props.initialPort || 587));
  const [secure, setSecure] = useState(props.initialSecure);
  const [user, setUser] = useState(props.initialUser);
  const [testState, setTestState] = useState<SmtpActionState>({});
  const [testing, setTesting] = useState(false);

  const isPreset = provider !== "custom";
  const currentDefaults = isPreset ? DEFAULTS[provider] : null;

  function handleProviderChange(value: SmtpProvider) {
    setProvider(value);
    if (value !== "custom") {
      const next = DEFAULTS[value];
      setHost(next.host);
      setPort(String(next.port));
      setSecure(next.secure);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestState({});
    try {
      setTestState(await props.testAction());
    } catch (error) {
      setTestState({ error: error instanceof Error ? error.message : "Échec du test SMTP." });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div>
        <p className="eyebrow text-red">Administration</p>
        <h2 className="font-display mt-1 text-xl">Envoi d&apos;e-mails</h2>
        <p className="mt-1 text-sm text-stone">
          Utilisé pour les e-mails « mot de passe oublié ». Les identifiants restent privés et le mot de passe SMTP est chiffré en base.
        </p>
      </div>

      <form action={formAction} className="mt-5 grid gap-4">
        <div>
          <label className="text-sm font-medium" htmlFor="smtpProvider">Fournisseur</label>
          <select
            id="smtpProvider"
            name="smtpProvider"
            value={provider}
            onChange={(event) => handleProviderChange(event.target.value as SmtpProvider)}
            className="mt-1.5 min-h-11 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-red"
          >
            <option value="gmail">Gmail / Google Workspace</option>
            <option value="microsoft365">Microsoft 365 / Outlook professionnel</option>
            <option value="custom">Autre hébergeur</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="smtpUser">Adresse / compte SMTP</label>
            <input id="smtpUser" name="smtpUser" type="email" required value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" placeholder="admin@infrared.tn" className="mt-1.5 min-h-11 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="smtpPassword">Mot de passe SMTP</label>
            <input id="smtpPassword" name="smtpPassword" type="password" autoComplete="new-password" placeholder={props.passwordConfigured ? "Laisser vide pour conserver le mot de passe" : "Mot de passe / mot de passe d’application"} className="mt-1.5 min-h-11 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="smtpFromEmail">Adresse d&apos;expédition</label>
            <input id="smtpFromEmail" name="smtpFromEmail" type="email" defaultValue={props.initialFromEmail || props.initialUser} placeholder="Même adresse que le compte SMTP" className="mt-1.5 min-h-11 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="smtpFromName">Nom d&apos;expéditeur</label>
            <input id="smtpFromName" name="smtpFromName" defaultValue={props.initialFromName || "InfraRed Optic-Store"} className="mt-1.5 min-h-11 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_120px_1fr]">
          <div>
            <label className="text-sm font-medium" htmlFor="smtpHost">Serveur SMTP</label>
            <input id="smtpHost" name="smtpHost" value={host} onChange={(e) => setHost(e.target.value)} readOnly={isPreset} required={!isPreset} className="mt-1.5 min-h-11 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red read-only:bg-mist" />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="smtpPort">Port</label>
            <input id="smtpPort" name="smtpPort" type="number" min={1} max={65535} value={port} onChange={(e) => setPort(e.target.value)} readOnly={isPreset} required={!isPreset} className="mt-1.5 min-h-11 w-full rounded-lg border border-line px-3.5 py-2.5 text-sm outline-none focus:border-red read-only:bg-mist" />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium">
            <input type="checkbox" name="smtpSecure" checked={secure} onChange={(e) => setSecure(e.target.checked)} disabled={isPreset} />
            SSL direct (465)
          </label>
        </div>

        {currentDefaults && (
          <p className="rounded-xl bg-mist p-3 text-xs text-stone">
            Configuration automatique : <strong>{currentDefaults.host}</strong> · port <strong>{currentDefaults.port}</strong> · TLS/STARTTLS.
            Pour Gmail, utilise de préférence un mot de passe d&apos;application lorsque ton compte Google l&apos;exige. Pour Microsoft 365, l&apos;authentification SMTP doit être autorisée sur le compte/tenant selon la configuration Microsoft.
          </p>
        )}
        {provider === "custom" && (
          <p className="rounded-xl bg-mist p-3 text-xs text-stone">
            Pour un hébergeur de domaine classique, demande simplement son serveur SMTP, port et méthode TLS. Le champ SSL direct sert surtout aux configurations en port 465 ; le port 587 utilise normalement STARTTLS.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="min-h-11 rounded-full bg-red px-5 text-sm font-medium text-white hover:bg-red-dark disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer la configuration"}</button>
          <button type="button" onClick={handleTest} disabled={testing} className="min-h-11 rounded-full border border-line px-5 text-sm font-medium hover:border-red hover:text-red disabled:opacity-60">
            {testing ? "Test…" : "Envoyer un e-mail de test"}
          </button>
        </div>
        {state.message && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.message}</p>}
        {state.error && <p role="alert" className="rounded-lg bg-red-soft px-3 py-2 text-sm text-red">{state.error}</p>}
        {testState.message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{testState.message}</p>}
        {testState.error && <p className="rounded-lg bg-red-soft px-3 py-2 text-sm text-red">{testState.error}</p>}
      </form>
    </div>
  );
}
