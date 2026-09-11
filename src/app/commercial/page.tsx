import {redirect} from "next/navigation";
import {requirePagePermission} from "@/lib/authz";
export default async function Commercial(){await requirePagePermission("products.view");redirect("/admin/articles");}
