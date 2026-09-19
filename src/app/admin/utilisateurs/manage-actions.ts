"use server";
import bcrypt from "bcryptjs";
import {Prisma,type Role} from "@prisma/client";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {requirePermission} from "@/lib/authz";
import {PERMISSIONS,can,isSystemAdmin,ROLE_LABELS,type Permission} from "@/lib/permissions";
import {getRequiredText,validateEmail,validatePassword} from "@/lib/validation";
import {adminError} from "@/lib/admin-errors";
import type {ActionResult} from "@/components/ActionForm";
export async function saveStaffAction(id:string|null,_state:ActionResult,f:FormData):Promise<ActionResult>{
 const actor=await requirePermission(id?"users.edit":"users.create");
 try{
  const role=String(f.get("role")??"COMMERCIAL") as Role;
  if(!(role in ROLE_LABELS))throw new Error("Rôle invalide.");
  const target=id?await prisma.user.findUnique({where:{id}}):null;
  if(id&&!target)throw new Error("Utilisateur introuvable.");
  if(target?.role==="SUPER_ADMIN")throw new Error("Un compte Super Admin ne peut pas être modifié depuis la gestion des utilisateurs.");
  if(isSystemAdmin({role})&&!isSystemAdmin(actor))throw new Error("Seul un Super Admin peut créer ce compte.");
  const active=f.get("active")==="on";
  if(target?.id===actor.userId&&(!active||role!==target.role))throw new Error("Vous ne pouvez pas désactiver votre propre accès ni changer votre rôle.");
  const name=getRequiredText(f,"name","Nom",120),email=validateEmail(f.get("email"));
  const rawPassword=String(f.get("password")??"");const passwordHash=rawPassword?await bcrypt.hash(validatePassword(rawPassword),12):undefined;
  if(!target&&!passwordHash)throw new Error("Un mot de passe est obligatoire.");
  await prisma.$transaction(async(tx)=>{
   if(target?.role==="SUPER_ADMIN"&&(!active||role!=="SUPER_ADMIN")){const roots=await tx.user.count({where:{active:true,role:"SUPER_ADMIN"}});if(roots<=1)throw new Error("Conservez au moins un Super Admin actif.");}
   const data={name,email,role,active,...(passwordHash?{passwordHash}:{})};
   const saved=target?await tx.user.update({where:{id:target.id},data:{...data,authVersion:{increment:1}}}):await tx.user.create({data:{...data,passwordHash:passwordHash!}});
   await tx.auditLog.create({data:{actorId:actor.userId,action:target?"user.update":"user.create",entityType:"User",entityId:saved.id,before:target?{name:target.name,role:target.role,active:target.active}:undefined,after:{name,role,active}}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  revalidatePath("/admin/utilisateurs");return {success:"Utilisateur enregistré. Les droits prennent effet immédiatement."};
 }catch(e){return {error:adminError(e)};}
}
export async function saveRolePolicyAction(role:Role,_state:ActionResult,f:FormData):Promise<ActionResult>{
 const actor=await requirePermission("roles.manage");
 try{
  if(!(role in ROLE_LABELS)||isSystemAdmin({role}))throw new Error("Les permissions système du Super Admin sont protégées.");
  const values=f.getAll("permissions").map(String);if(values.some(p=>!PERMISSIONS.includes(p as Permission)))throw new Error("Permission inconnue.");
  if(!isSystemAdmin(actor)&&values.some(p=>!can(actor,p as Permission)))throw new Error("Vous ne pouvez pas attribuer une permission que vous ne possédez pas.");
  await prisma.$transaction(async(tx)=>{const old=await tx.rolePolicy.findUnique({where:{role}});await tx.rolePolicy.upsert({where:{role},create:{role,permissions:values},update:{permissions:values}});await tx.auditLog.create({data:{actorId:actor.userId,action:"role.permissions.update",entityType:"Role",entityId:role,before:{permissions:old?.permissions??[]},after:{permissions:values}}});});
  revalidatePath("/admin","layout");return {success:"Permissions du rôle enregistrées."};
 }catch(e){return {error:adminError(e)};}
}
export async function saveUserPermissionsAction(id:string,_state:ActionResult,f:FormData):Promise<ActionResult>{
 const actor=await requirePermission("roles.manage");
 try{
  const target=await prisma.user.findUnique({where:{id}});if(!target||isSystemAdmin(target))throw new Error("Ce compte est protégé.");
  const overrides:Record<string,boolean>={};for(const p of PERMISSIONS){const value=f.get(p);if(value==="allow")overrides[p]=true;else if(value==="deny")overrides[p]=false;else if(value!=="inherit"&&value!==null)throw new Error("Choix de permission invalide.");}
  if(!isSystemAdmin(actor)&&Object.entries(overrides).some(([p,v])=>v&&!can(actor,p as Permission)))throw new Error("Attribution non autorisée.");
  await prisma.$transaction(async(tx)=>{await tx.user.update({where:{id},data:{permissionOverrides:overrides,authVersion:{increment:1}}});await tx.auditLog.create({data:{actorId:actor.userId,action:"user.permissions.update",entityType:"User",entityId:id,after:overrides}});});revalidatePath("/admin/utilisateurs");return {success:"Permissions individuelles enregistrées."};
 }catch(e){return {error:adminError(e)};}
}

export async function deleteStaffAction(id:string,_state:ActionResult):Promise<ActionResult>{
 void _state;
 const actor=await requirePermission("users.delete");
 try{
  const target=await prisma.user.findUnique({where:{id}});if(!target)throw new Error("Utilisateur introuvable.");
  if(target.id===actor.userId)throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  if(target.role==="SUPER_ADMIN")throw new Error("Un compte Super Admin ne peut pas être supprimé.");
  await prisma.$transaction(async(tx)=>{await tx.auditLog.create({data:{actorId:actor.userId,action:"user.delete",entityType:"User",entityId:id,before:{name:target.name,email:target.email,role:target.role}}});await tx.user.delete({where:{id}});});
  revalidatePath("/admin/utilisateurs");return {success:"Utilisateur supprimé."};
 }catch(e){return {error:adminError(e)};}
}
