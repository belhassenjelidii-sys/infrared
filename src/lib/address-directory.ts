import "server-only";
import { prisma } from "@/lib/prisma";
import { TUNISIA_ADDRESSES } from "@/data/tunisia-addresses";

export type AddressDirectory = Array<{
  id: string;
  name: string;
  delegations: Array<{ id: string; name: string; localities: Array<{ id: string; name: string; postalCode: string | null }> }>;
}>;

/** Loads the initial local Tunisian reference exactly once, then uses DB edits. */
export async function ensureAddressDirectory() {
  if (await prisma.addressGovernorate.count()) return;

  await prisma.$transaction(async (tx) => {
    if (await tx.addressGovernorate.count()) return;
    await tx.addressGovernorate.createMany({ data: TUNISIA_ADDRESSES.map((entry) => ({ name: entry.name })), skipDuplicates: true });
    const governors = await tx.addressGovernorate.findMany({ select: { id: true, name: true } });
    const governorIds = new Map(governors.map((entry) => [entry.name, entry.id]));
    const delegations = TUNISIA_ADDRESSES.flatMap((governorate) => governorate.delegations.map((delegation) => ({ governorateId: governorIds.get(governorate.name)!, name: delegation.name })));
    await tx.addressDelegation.createMany({ data: delegations, skipDuplicates: true });
    const dbDelegations = await tx.addressDelegation.findMany({ include: { governorate: { select: { name: true } } } });
    const delegationIds = new Map(dbDelegations.map((entry) => [`${entry.governorate.name}\u0000${entry.name}`, entry.id]));
    const localities = TUNISIA_ADDRESSES.flatMap((governorate) => governorate.delegations.flatMap((delegation) => delegation.localities.map((locality) => ({
      delegationId: delegationIds.get(`${governorate.name}\u0000${delegation.name}`)!,
      name: locality.name,
      postalCode: locality.postalCode || null,
    }))));
    for (let index = 0; index < localities.length; index += 500) {
      await tx.addressLocality.createMany({ data: localities.slice(index, index + 500), skipDuplicates: true });
    }
  }, { timeout: 60_000 });
}

export async function getAddressDirectory(): Promise<AddressDirectory> {
  await ensureAddressDirectory();
  return prisma.addressGovernorate.findMany({
    orderBy: { name: "asc" },
    include: { delegations: { orderBy: { name: "asc" }, include: { localities: { orderBy: { name: "asc" } } } } },
  });
}

export async function resolveDirectoryAddress(input: { governorate: string; delegation: string; locality: string; postalCode?: string | null }) {
  await ensureAddressDirectory();
  const governorate = await prisma.addressGovernorate.findUnique({
    where: { name: input.governorate },
    include: { delegations: { where: { name: input.delegation }, include: { localities: true } } },
  });
  if (!governorate) throw new Error("Choisissez un gouvernorat dans les propositions.");
  const delegation = governorate.delegations[0];
  if (!delegation) throw new Error("Choisissez une délégation dans les propositions.");
  const locality = delegation.localities.find((entry) => entry.name === input.locality && (!input.postalCode || entry.postalCode === input.postalCode));
  if (!locality) throw new Error("Choisissez une localité dans les propositions.");
  return { governorate: governorate.name, delegation: delegation.name, locality: locality.name, postalCode: locality.postalCode };
}
