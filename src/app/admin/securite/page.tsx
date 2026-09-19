import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TwoFactorSettings from "./TwoFactorSettings";
import ActionForm,{SubmitButton} from "@/components/ActionForm";
import {Field} from "@/components/AdminFields";
import {changeOwnPasswordAction} from "./actions";
export default async function SecurityPage(){const session=await getSession();if(!session)redirect("/login");const user=await prisma.user.findUniqueOrThrow({where:{id:session.userId},select:{twoFactorEnabled:true}});return <AdminShell active="/admin/securite"><div className="max-w-2xl"><p className="eyebrow text-red">Compte</p><h1 className="mt-2 text-3xl font-semibold">Sécurité du compte</h1><p className="mt-2 text-sm text-stone">Protégez votre accès et vos identifiants.</p><TwoFactorSettings enabled={user.twoFactorEnabled} required={Boolean(session.twoFactorSetupRequired)}/><section className="mt-6 rounded-xl border bg-white p-5"><h2 className="font-semibold">Changer mon mot de passe</h2><ActionForm action={changeOwnPasswordAction} className="mt-4 grid gap-4"><Field name="currentPassword" label="Mot de passe actuel" type="password" autoComplete="current-password" required/><Field name="newPassword" label="Nouveau mot de passe" type="password" autoComplete="new-password" required/><Field name="passwordConfirmation" label="Confirmer le nouveau mot de passe" type="password" autoComplete="new-password" required/><div><SubmitButton>Modifier mon mot de passe</SubmitButton></div></ActionForm></section></div></AdminShell>}
