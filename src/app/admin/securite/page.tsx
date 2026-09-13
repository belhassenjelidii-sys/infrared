import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TwoFactorSettings from "./TwoFactorSettings";
export default async function SecurityPage(){const session=await getSession();if(!session)redirect("/login");const user=await prisma.user.findUniqueOrThrow({where:{id:session.userId},select:{twoFactorEnabled:true}});return <AdminShell active="/admin/securite"><div className="max-w-2xl"><p className="eyebrow text-red">Compte</p><h1 className="mt-2 text-3xl font-semibold">Sécurité du compte</h1><p className="mt-2 text-sm text-stone">Protégez votre accès avec une application Authenticator compatible TOTP.</p><TwoFactorSettings enabled={user.twoFactorEnabled} required={Boolean(session.twoFactorSetupRequired)}/></div></AdminShell>}