import path from "node:path";
import { config } from "dotenv";

const envFileArg = process.argv.find((arg) => arg.startsWith("--env-file="));
const envFile = envFileArg?.slice("--env-file=".length) || ".env";
config({ path: path.resolve(process.cwd(), envFile) });

const errors: string[] = [];
const warnings: string[] = [];
const value = (name: string) => process.env[name]?.trim() || "";

function requireValue(name: string) {
  if (!value(name)) errors.push(`${name} est absent.`);
}

requireValue("DATABASE_URL");
requireValue("NEXT_PUBLIC_SITE_URL");
requireValue("AUTH_SECRET");
requireValue("NEXT_PUBLIC_SUPABASE_URL");
requireValue("SUPABASE_SERVICE_ROLE_KEY");
requireValue("SUPABASE_STORAGE_BUCKET");

const siteUrl = value("NEXT_PUBLIC_SITE_URL");
try {
  const parsed = new URL(siteUrl);
  if (parsed.protocol !== "https:") errors.push("NEXT_PUBLIC_SITE_URL doit utiliser https en production.");
  if (parsed.hostname === "localhost" || parsed.hostname === "example.com") errors.push("NEXT_PUBLIC_SITE_URL doit contenir le domaine final.");
} catch {
  errors.push("NEXT_PUBLIC_SITE_URL doit etre une URL valide.");
}

const databaseUrl = value("DATABASE_URL");
if (/localhost|127\.0\.0\.1|infrared_dev_password/i.test(databaseUrl)) {
  errors.push("DATABASE_URL pointe encore vers une base locale ou utilise un mot de passe de developpement.");
}

const authSecret = value("AUTH_SECRET");
if (authSecret.length < 32) errors.push("AUTH_SECRET doit contenir au moins 32 caracteres.");
if (/change-this|dev-only|insecure/i.test(authSecret)) errors.push("AUTH_SECRET utilise encore une valeur de developpement.");

const storageUrl = value("NEXT_PUBLIC_SUPABASE_URL");
try {
  if (new URL(storageUrl).protocol !== "https:") errors.push("NEXT_PUBLIC_SUPABASE_URL doit utiliser https.");
} catch {
  errors.push("NEXT_PUBLIC_SUPABASE_URL doit etre une URL valide.");
}

const storageBucket = value("SUPABASE_STORAGE_BUCKET");
if (storageBucket && !/^[a-z0-9][a-z0-9._-]{1,62}$/i.test(storageBucket)) {
  errors.push("SUPABASE_STORAGE_BUCKET contient un nom de bucket invalide.");
}

for (const name of ["SEED_ADMIN_PASSWORD", "SEED_COMMERCIAL_PASSWORD", "SEED_DEVELOPER_PASSWORD"]) {
  const password = value(name);
  if (!password) warnings.push(`${name} est vide : ne relancez pas le seed en production sans mot de passe defini.`);
  else if (password.length < 12) warnings.push(`${name} devrait contenir au moins 12 caracteres.`);
}

if (!value("SMTP_HOST") && !value("SMTP_USER")) {
  warnings.push("SMTP n'est pas configure dans ce fichier. Il peut aussi etre configure depuis Admin > Parametres > E-mails.");
}
if (!value("GOOGLE_SITE_VERIFICATION")) {
  warnings.push("GOOGLE_SITE_VERIFICATION est vide : ajoutez le code Search Console avant l'indexation.");
}

for (const message of warnings) console.warn(`AVERTISSEMENT: ${message}`);
for (const message of errors) console.error(`ERREUR: ${message}`);

if (errors.length > 0) {
  console.error(`\nVerification echouee: ${errors.length} point(s) a corriger.`);
  process.exit(1);
}

console.log("Verification production reussie.");
