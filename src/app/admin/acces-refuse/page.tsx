import Link from "next/link";
import {getSession} from "@/lib/auth";
import {redirect} from "next/navigation";
export default async function Denied(){if(!await getSession())redirect("/login");return <main className="mx-auto max-w-xl p-10"><h1 className="text-2xl font-semibold">Accès non autorisé</h1><p className="mt-3 text-stone">Votre compte n’a pas la permission nécessaire pour cette page.</p><Link href="/admin" className="mt-6 inline-block text-red">Retour au dashboard</Link></main>;}
