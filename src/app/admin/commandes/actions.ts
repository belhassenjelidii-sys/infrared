"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/ActionForm";
import { adminError } from "@/lib/admin-errors";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { assertOrderStatusTransition } from "@/lib/order-status";
import { writeAuditLog } from "@/lib/audit-log";
import { canChangePreparationStore, sendPreparationStoreEmail, shouldNotifyPreparationStore } from "@/lib/order-preparation";

export async function updateOrderStatusAction(orderId:string,_state:ActionResult,formData:FormData):Promise<ActionResult>{
  const actor=await requirePermission("orders.edit");
  try{const status=String(formData.get("status")??"");const before=await prisma.order.findUniqueOrThrow({where:{id:orderId},include:{items:true}});assertOrderStatusTransition(before.status,status);await prisma.$transaction(async tx=>{if(before.status!=="CANCELLED"&&status==="CANCELLED"){for(const item of before.items)if(item.variantId)await tx.product.update({where:{id:item.variantId},data:{stock:{increment:item.quantity}}});}await tx.order.update({where:{id:orderId},data:{status}});await writeAuditLog(tx,{actor,category:"ORDERS",action:"order.status.update",entityType:"Order",entityId:orderId,before:{status:before.status},after:{status,number:before.number}});});if (shouldNotifyPreparationStore(status as typeof before.status)) await sendPreparationStoreEmail(orderId,actor);revalidatePath("/admin/commandes");revalidatePath(`/admin/commandes/${orderId}`);revalidatePath(`/admin/commandes/${orderId}/imprimer`);revalidatePath("/admin");return{success:"Statut enregistré."};}catch(error){return{error:adminError(error)}}
}

export async function updateOrderDeliveryAction(orderId:string,_state:ActionResult,formData:FormData):Promise<ActionResult>{
  const actor=await requirePermission("orders.edit");
  try{
    const provider=String(formData.get("deliveryProvider")??"").trim();
    const deliveryCompanyId=provider&&provider!=="manual"?provider:null;
    const manualDeliveryFirstName=provider==="manual"?String(formData.get("manualDeliveryFirstName")??"").trim().slice(0,80):null;
    const manualDeliveryLastName=provider==="manual"?String(formData.get("manualDeliveryLastName")??"").trim().slice(0,80):null;
    const manualDeliveryPhone=provider==="manual"?String(formData.get("manualDeliveryPhone")??"").trim().slice(0,40):null;
    const trackingNumber=String(formData.get("trackingNumber")??"").trim().slice(0,120)||null;
    if(provider==="manual"&&(!manualDeliveryFirstName||!manualDeliveryLastName||!manualDeliveryPhone))throw new Error("Renseignez le prénom, le nom et le téléphone du livreur.");
    if(manualDeliveryPhone&&!/^\+?[0-9 ()-]{6,40}$/.test(manualDeliveryPhone))throw new Error("Téléphone du livreur invalide.");
    if(deliveryCompanyId){
      const company=await prisma.deliveryCompany.findFirst({where:{id:deliveryCompanyId,active:true},select:{id:true}});
      if(!company)throw new Error("Société de livraison introuvable ou désactivée.");
    }
    const before=await prisma.order.findUniqueOrThrow({where:{id:orderId},select:{status:true,deliveryCompanyId:true,manualDeliveryFirstName:true,manualDeliveryLastName:true,manualDeliveryPhone:true,trackingNumber:true,number:true}});
    if (!canChangePreparationStore(before.status)) throw new Error("La livraison ne peut plus être modifiée après expédition ou clôture.");
    await prisma.$transaction(async(tx)=>{
      await tx.order.update({where:{id:orderId},data:{deliveryCompanyId,manualDeliveryFirstName,manualDeliveryLastName,manualDeliveryPhone,trackingNumber}});
      await writeAuditLog(tx,{actor,category:"ORDERS",action:"order.delivery.update",entityType:"Order",entityId:orderId,before:{deliveryCompanyId:before.deliveryCompanyId,manualDeliveryFirstName:before.manualDeliveryFirstName,manualDeliveryLastName:before.manualDeliveryLastName,manualDeliveryPhone:before.manualDeliveryPhone,trackingNumber:before.trackingNumber},after:{deliveryCompanyId,manualDeliveryFirstName,manualDeliveryLastName,manualDeliveryPhone,trackingNumber,number:before.number}});
    });
    revalidatePath(`/admin/commandes/${orderId}`);
    revalidatePath(`/admin/commandes/${orderId}/imprimer`);
    return{success:"Livraison affectée."};
  }catch(error){return{error:adminError(error)}}
}

/** V1 assignment only: Store is a preparation source, never a stock location. */
export async function updateOrderPreparationStoreAction(orderId:string,_state:ActionResult,formData:FormData):Promise<ActionResult>{
  const actor=await requirePermission("orders.edit");
  try {
    const requestedStoreId=String(formData.get("preparationStoreId")??"").trim();
    const preparationStoreId=requestedStoreId||null;
    const before=await prisma.order.findUniqueOrThrow({where:{id:orderId},include:{preparationStore:{select:{id:true,name:true}}}});
    if (!canChangePreparationStore(before.status)) throw new Error("La boutique de préparation ne peut plus être modifiée après expédition ou clôture.");
    const store=preparationStoreId ? await prisma.store.findFirst({where:{id:preparationStoreId,active:true},select:{id:true,name:true}}) : null;
    if (preparationStoreId && !store) throw new Error("Boutique de préparation introuvable ou inactive.");
    const changed = before.preparationStoreId !== preparationStoreId;
    await prisma.$transaction(async(tx)=>{
      await tx.order.update({where:{id:orderId},data:{preparationStoreId,...(changed?{preparationEmailSentAt:null,preparationEmailClaimedAt:null}:{})}});
      await writeAuditLog(tx,{actor,category:"ORDERS",action:"order.preparation_store.update",entityType:"Order",entityId:orderId,storeId:preparationStoreId,before:{preparationStoreId:before.preparationStoreId,preparationStoreName:before.preparationStore?.name??null},after:{preparationStoreId,preparationStoreName:store?.name??null,number:before.number}});
    });
    if (shouldNotifyPreparationStore(before.status)) await sendPreparationStoreEmail(orderId,actor);
    revalidatePath(`/admin/commandes/${orderId}`);
    revalidatePath(`/admin/commandes/${orderId}/imprimer`);
    return {success:"Boutique de préparation enregistrée."};
  } catch(error) { return {error:adminError(error)}; }
}
