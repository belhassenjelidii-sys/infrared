"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/ActionForm";
import { adminError } from "@/lib/admin-errors";
import { requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { revalidateProductViews } from "@/lib/revalidate";
import { parseMoney } from "@/lib/validation";

const allowedPercentages = new Set(Array.from({length:18},(_,index)=>(index+1)*5));

export async function savePromotionAction(_state:ActionResult,formData:FormData):Promise<ActionResult>{
  await requirePermission("promotions.manage");
  try{
    const productId=String(formData.get("productId")??"").trim();
    const mode=String(formData.get("mode")??"percentage");
    if(!productId)throw new Error("Choisissez un article.");
    const product=await prisma.product.findUnique({where:{id:productId}});
    if(!product||product.archived)throw new Error("Article introuvable.");
    const basePrice=Number(product.oldPrice??product.price);
    let price:number;let discount:number;
    if(mode==="percentage"){
      discount=Number(formData.get("percentage"));
      if(!allowedPercentages.has(discount))throw new Error("Choisissez une réduction entre 5 % et 90 %.");
      price=Math.round(basePrice*(1-discount/100)*1000)/1000;
    }else if(mode==="price"){
      const parsed=parseMoney(formData.get("promoPrice"),"Prix promotionnel");
      if(parsed===null||parsed<=0||parsed>=basePrice)throw new Error("Le prix promotionnel doit être positif et inférieur au prix normal.");
      price=parsed;
      discount=Math.max(1,Math.round(((basePrice-price)/basePrice)*100));
    }else throw new Error("Mode de remise invalide.");
    const updated=await prisma.product.update({where:{id:productId},data:{oldPrice:basePrice,price,discount,isPromotion:true}});
    revalidatePath("/admin/promotions");revalidatePath("/admin");revalidateProductViews(updated.slug);
    return{success:"Promotion enregistrée."};
  }catch(error){return{error:adminError(error)}}
}

export async function removePromotionAction(productId:string){
  await requirePermission("promotions.manage");
  try{
    const product=await prisma.product.findUniqueOrThrow({where:{id:productId}});
    const updated=await prisma.product.update({where:{id:productId},data:{price:product.oldPrice??product.price,oldPrice:null,discount:null,isPromotion:false}});
    revalidatePath("/admin/promotions");revalidatePath("/admin");revalidateProductViews(updated.slug);
  }catch(error){throw new Error(adminError(error))}
}
