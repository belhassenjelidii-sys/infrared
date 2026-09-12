import postalData from "@/data/tunisia-postal-codes.json";

export type TunisianLocality = { name: string; postalCode: string | null };
export type TunisianDelegation = { name: string; localities: TunisianLocality[] };
export type TunisianGovernorate = { name: string; delegations: TunisianDelegation[] };

export const TUNISIAN_ADDRESS_SOURCE = postalData.source;
export const TUNISIAN_GOVERNORATES = postalData.governorates as TunisianGovernorate[];

function normalized(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleUpperCase("fr-TN");
}

export function displayTunisianPlace(value: string) {
  return value.toLocaleLowerCase("fr-TN").replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("fr-TN"));
}

export function findGovernorate(value: string) {
  const key = normalized(value);
  return TUNISIAN_GOVERNORATES.find((governorate) => normalized(governorate.name) === key) ?? null;
}

export function findDelegation(governorate: TunisianGovernorate | null, value: string) {
  if (!governorate) return null;
  const key = normalized(value);
  return governorate.delegations.find((delegation) => normalized(delegation.name) === key) ?? null;
}

export function localityChoice(locality: TunisianLocality) {
  const name = displayTunisianPlace(locality.name);
  return locality.postalCode ? `${name} · ${locality.postalCode}` : name;
}

export function resolveTunisianAddress(input: { governorate: string; delegation: string; locality: string; postalCode?: string | null }) {
  const governorate = findGovernorate(input.governorate);
  if (!governorate) throw new Error("Choisissez un gouvernorat dans les propositions.");
  const delegation = findDelegation(governorate, input.delegation);
  if (!delegation) throw new Error("Choisissez une zone ou délégation dans les propositions.");
  const localityKey = normalized(input.locality);
  const postalCode = String(input.postalCode ?? "").trim();
  const locality = delegation.localities.find((entry) => normalized(entry.name) === localityKey && (!postalCode || entry.postalCode === postalCode));
  if (!locality) throw new Error("Choisissez une localité ou un quartier dans les propositions.");
  return {
    governorate: governorate.name,
    delegation: delegation.name,
    locality: locality.name,
    postalCode: locality.postalCode,
  };
}
