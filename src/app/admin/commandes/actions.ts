"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/ActionForm";
import { adminError } from "@/lib/admin-errors";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const STATUSES = ["NEW","CONFIRMED","PREPARING","SHIPPED","DELIVERED","CANCELLED"];
export async function updateOrderStatusAction(orderId:string,_state:ActionResult,formData:FormData):Promise<ActionResult>{
  const actor=await requirePermission("orders.edit");
  try{const status=String(formData.get("status")??"");if(!STATUSES.includes(status))throw new Error("Statut invalide.");const before=await prisma.order.findUniqueOrThrow({where:{id:orderId},include:{items:true}});await prisma.$transaction(async tx=>{if(before.status!=="CANCELLED"&&status==="CANCELLED"){for(const item of before.items)if(item.variantId)await tx.product.update({where:{id:item.variantId},data:{stock:{increment:item.quantity}}});}if(before.status==="CANCELLED"&&status!=="CANCELLED"){for(const item of before.items)if(item.variantId){const changed=await tx.product.updateMany({where:{id:item.variantId,stock:{gte:item.quantity}},data:{stock:{decrement:item.quantity}}});if(changed.count!==1)throw new Error(`Stock insuffisant pour réactiver ${item.productName}.`);}}await tx.order.update({where:{id:orderId},data:{status}});await tx.auditLog.create({data:{actorId:actor.userId,action:"order.status.update",entityType:"Order",entityId:orderId,before:{status:before.status},after:{status,number:before.number}}});});revalidatePath("/admin/commandes");revalidatePath("/admin");return{success:"Statut enregistré."};}catch(error){return{error:adminError(error)}}
}

export async function updateOrderDeliveryAction(orderId:string,_state:ActionResult,formData:FormData):Promise<ActionResult>{
  const actor=await requirePermission("orders.edit");
  try{
    const deliveryCompanyId=String(formData.get("deliveryCompanyId")??"").trim()||null;
    const trackingNumber=String(formData.get("trackingNumber")??"").trim().slice(0,120)||null;
    if(deliveryCompanyId){
      const company=await prisma.deliveryCompany.findFirst({where:{id:deliveryCompanyId,active:true},select:{id:true}});
      if(!company)throw new Error("Société de livraison introuvable ou désactivée.");
    }
    const before=await prisma.order.findUniqueOrThrow({where:{id:orderId},select:{deliveryCompanyId:true,trackingNumber:true,number:true}});
    await prisma.$transaction([
      prisma.order.update({where:{id:orderId},data:{deliveryCompanyId,trackingNumber}}),
      prisma.auditLog.create({data:{actorId:actor.userId,action:"order.delivery.update",entityType:"Order",entityId:orderId,before:{deliveryCompanyId:before.deliveryCompanyId,trackingNumber:before.trackingNumber},after:{deliveryCompanyId,trackingNumber,number:before.number}}}),
    ]);
    revalidatePath(`/admin/commandes/${orderId}`);
    revalidatePath(`/admin/commandes/${orderId}/imprimer`);
    return{success:"Livraison affectée."};
  }catch(error){return{error:adminError(error)}}
}
