import AdminShell from "@/components/AdminShell";
import ModelForm from "@/components/ModelForm";
import {prisma} from "@/lib/prisma";
import {requirePagePermission} from "@/lib/authz";
export default async function NewModel(){await requirePagePermission("models.create");const brands=await prisma.brand.findMany({orderBy:{name:"asc"},select:{id:true,name:true}});return <AdminShell active="/admin/modeles"><h1 className="mb-6 text-3xl font-semibold">Créer un modèle</h1><ModelForm brands={brands}/></AdminShell>;}

