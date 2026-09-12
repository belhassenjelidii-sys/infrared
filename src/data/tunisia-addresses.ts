import data from "./tunisia-addresses.json";

export type TunisiaLocality = {
  name: string;
  postalCode: string;
};

export type TunisiaDelegation = {
  name: string;
  localities: TunisiaLocality[];
};

export type TunisiaGovernorate = {
  name: string;
  delegations: TunisiaDelegation[];
};

export const TUNISIA_ADDRESSES = data as TunisiaGovernorate[];

export function getGovernorates() {
  return TUNISIA_ADDRESSES.map((g) => g.name);
}

export function getDelegations(governorate: string) {
  return (
    TUNISIA_ADDRESSES.find((g) => g.name === governorate)?.delegations ?? []
  );
}

export function getLocalities(governorate: string, delegation: string) {
  return (
    getDelegations(governorate).find((d) => d.name === delegation)?.localities ?? []
  );
}
