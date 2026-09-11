"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authz";
import { can } from "@/lib/permissions";
import { adminError } from "@/lib/admin-errors";
import { parseSize, validEan, optionalNumber, SHAPES, MATERIALS, FRAME_TYPES } from "@/lib/catalogue-fields";
import { getRequiredText, getOptionalText, parseMoney, validateStoredAssetUrl, getTarget } from "@/lib/validation";
import { revalidateProductViews } from "@/lib/revalidate";
import { deleteUploadedImageIfUnreferenced } from "@/lib/uploads";
import type { ActionResult } from "@/components/ActionForm";
import { COMMERCIAL_SIZES, FRAME_COLORS, commercialSizeFor } from "@/lib/catalogue-options";

const text=(f:FormData,k:string,max=200)=>getOptionalText(f,k,max);
const required=(f:FormData,k:string,label:string,max=100)=>getRequiredText(f,k,label,max);
const choice=(f:FormData,k:string,values:readonly string[])=>{const v=text(f,k);if(v&&!values.includes(v))throw new Error(`Valeur invalide : ${k}.`);return v;};
const bool=(f:FormData,k:string)=>{const v=f.get(k);if(v===null||v==="")return null;if(v!=="true"&&v!=="false")throw new Error("Choix invalide.");return v==="true";};
const slugify=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const refresh=(slug?:string)=>{revalidatePath("/admin","layout");revalidateProductViews(slug);};

export async function saveModelAction(id:string|null,_state:ActionResult,f:FormData):Promise<ActionResult>{
  const user=await requirePermission(id?"models.edit":"models.create");let savedId=id;
  try {
    const brandId=required(f,"brandId","Marque"),type=required(f,"type","Type");
    if(type!=="SUNGLASSES"&&type!=="OPTICAL")throw new Error("Choisissez Solaire ou Optique.");
    const [brand,category,current]=await Promise.all([
      prisma.brand.findUnique({where:{id:brandId}}),
      prisma.category.findFirst({where:{slug:type==="SUNGLASSES"?"solaires":"optiques"}}),
      id?prisma.productModel.findUnique({where:{id},include:{_count:{select:{variants:true}}}}):Promise.resolve(null),
    ]);
    if(!brand||!category)throw new Error("La marque ou la catégorie choisie n’existe pas.");
    if(id&&!current)throw new Error("Modèle introuvable.");
    if(current&&current._count.variants>0&&(current.brandId!==brandId||current.type!==type))throw new Error("Un modèle avec des variantes doit conserver sa marque et son type.");
    const data={brandId,categoryId:category.id,type,code:required(f,"code","Code modèle",80).toUpperCase(),name:required(f,"name","Nom modèle",160),collection:text(f,"collection"),shape:choice(f,"shape",SHAPES),materialLabel:choice(f,"materialLabel",MATERIALS),materialFamily:text(f,"materialFamily"),gender:getTarget(f.get("gender")),frameType:choice(f,"frameType",FRAME_TYPES),style:text(f,"style"),description:text(f,"description",5000),active:f.get("active")==="on"} satisfies Prisma.ProductModelUncheckedCreateInput;
    const saved=await prisma.$transaction(async(tx)=>{const model=id?await tx.productModel.update({where:{id},data}):await tx.productModel.create({data});await tx.auditLog.create({data:{actorId:user.userId,action:id?"model.update":"model.create",entityType:"ProductModel",entityId:model.id,after:{code:model.code,name:model.name}}});return model;});savedId=saved.id;
    refresh();
  }catch(error){return {error:adminError(error)};}
  if(!id)redirect(`/admin/modeles/${savedId}`);
  return {success:"Modèle enregistré. Les variantes utilisent ses caractéristiques par défaut."};
}

export async function saveVariantAction(id:string|null,_state:ActionResult,f:FormData):Promise<ActionResult>{
  const user=await requirePermission(id?"products.view":"products.create");let savedId=id;
  try{
    const current=id?await prisma.product.findUnique({where:{id},include:{images:true,productModel:true}}):null;
    if(id&&!current)throw new Error("Article introuvable.");
    if(id&&!can(user,"products.edit")&&!can(user,"content.manage")&&!can(user,"seo.manage")&&!can(user,"prices.edit")&&!can(user,"stock.edit")&&!can(user,"images.manage"))throw new Error("Vous ne pouvez pas modifier cet article.");
    const modelId=f.has("productModelId")?text(f,"productModelId",100):current?.productModelId;
    const model=modelId?await prisma.productModel.findUnique({where:{id:modelId},include:{brand:true}}):null;
    if(modelId&&!model)throw new Error("Modèle introuvable.");
    if(!current&&!model)throw new Error("Choisissez d’abord un modèle.");
    if(!current&&!model?.active)throw new Error("Ce modèle est inactif.");
    const data:Prisma.ProductUncheckedUpdateInput={};
    if(can(user,"products.edit")||!id){
      const variantRef=required(f,"variantReference","Référence",80);
      const measures=parseSize(required(f,"size","Taille",20));
      const detailed={lensWidth:optionalNumber(f.get("lensWidth"),"Largeur du verre",20,100),bridgeWidth:optionalNumber(f.get("bridgeWidth"),"Pont",5,40),templeLength:optionalNumber(f.get("templeLength"),"Branche",80,180)};
      for(const key of ["lensWidth","bridgeWidth","templeLength"] as const) if(detailed[key]!==null){if(measures[key]!==null&&measures[key]!==detailed[key])throw new Error("La taille et les dimensions détaillées ne correspondent pas.");measures[key]=detailed[key];}
      if(measures.lensWidth!==null&&measures.bridgeWidth!==null)measures.size=[measures.lensWidth,measures.bridgeWidth,measures.templeLength].filter(v=>v!==null).join("-");
      const ean=text(f,"ean",13);if(ean&&!validEan(ean))throw new Error("EAN-13 invalide : vérifiez les 13 chiffres et la clé de contrôle.");
      const allowedColors=FRAME_COLORS.map((color)=>color.label);
      const frameColorFamily=required(f,"frameColorFamily","Couleur monture",80);
      const lensColorFamily=required(f,"lensColorFamily","Couleur verre",80);
      if(!allowedColors.includes(frameColorFamily)||!allowedColors.includes(lensColorFamily))throw new Error("Choisissez les couleurs dans la palette proposée.");
      const frameColorLabel=text(f,"frameColorLabel",80);
      const lensColorLabel=text(f,"lensColorLabel",80);
      const commercialSize=choice(f,"commercialSize",COMMERCIAL_SIZES)||commercialSizeFor(measures.size!);
      Object.assign(data,{productModelId:model?.id??null,type:model?.type??current?.type,variantReference:variantRef,
        reference:current?.reference??[model!.code,variantRef,measures.size].filter(Boolean).join(" "),
        name:current?.name??[model!.brand.name,model!.name,model!.code,variantRef].join(" "),
        brandId:model?.brandId??current!.brandId,categoryId:model?.categoryId??current!.categoryId,
        frameColorLabel,frameColorFamily,lensColorLabel,lensColorFamily,color:frameColorFamily,
        ...measures,lensHeight:optionalNumber(f.get("lensHeight"),"Hauteur verre",1,100),totalWidth:optionalNumber(f.get("totalWidth"),"Largeur totale",50,250),commercialSize,
        sku:text(f,"sku",80)??current?.sku??`IRV-${crypto.randomUUID()}`,ean,solarIndex:optionalNumber(f.get("solarIndex"),"Indice solaire",0,4),polarized:bool(f,"polarized"),gradient:bool(f,"gradient"),photochromic:bool(f,"photochromic"),mirrored:bool(f,"mirrored"),prescriptionCompatible:bool(f,"prescriptionCompatible"),weight:optionalNumber(f.get("weight"),"Poids",1,1000,false),
        shapeOverride:choice(f,"shapeOverride",SHAPES),materialOverride:choice(f,"materialOverride",MATERIALS),materialFamilyOverride:text(f,"materialFamilyOverride"),genderOverride:f.get("genderOverride")?getTarget(f.get("genderOverride")):null,frameTypeOverride:choice(f,"frameTypeOverride",FRAME_TYPES),styleOverride:text(f,"styleOverride",120),published:f.get("published")==="on",
      });
    } else if(f.has("variantReference")||f.has("productModelId"))throw new Error("Vous ne pouvez pas modifier les caractéristiques de l’article.");
    if(can(user,"products.edit")||can(user,"content.manage")){
      if(f.has("description"))data.description=text(f,"description",5000)??"";
      if(f.has("contentFlags")){data.featured=f.get("featured")==="on";data.isNew=f.get("isNew")==="on";}
    }
    if(can(user,"seo.manage")){for(const key of ["metaTitle","metaDescription","tags","whatsappTitle"] as const)if(f.has(key))data[key]=text(f,key,key==="metaTitle"?180:500);}
    if(f.has("price")){
      if(!can(user,"prices.edit"))throw new Error("Vous ne pouvez pas modifier les prix.");
      const price=parseMoney(f.get("price"),"Prix",{allowZero:true})!;const oldPrice=parseMoney(f.get("oldPrice"),"Ancien prix",{required:false});
      if(oldPrice!==null&&(price===0||oldPrice<=price))throw new Error("L’ancien prix doit être supérieur au prix actuel, qui doit être positif.");
      Object.assign(data,{price,oldPrice,discount:oldPrice?Math.round((oldPrice-price)/oldPrice*100):null,isPromotion:oldPrice!==null});
    }
    if(f.has("stock")){
      if(!can(user,"stock.edit"))throw new Error("Vous ne pouvez pas modifier le stock.");
      const stock=optionalNumber(f.get("stock"),"Stock",0,1000000);data.stock=stock;data.available=stock===null?(f.get("available")==="on"):stock>0;
    }
    const imagesRaw=f.get("images");let images:{id?:string;url:string;alt:string}[]|null=null;
    if(imagesRaw!==null){
      if(!can(user,"images.manage"))throw new Error("Vous ne pouvez pas modifier les images.");
      const parsed:unknown=JSON.parse(String(imagesRaw));if(!Array.isArray(parsed)||parsed.length>30)throw new Error("30 images maximum par article.");
      images=parsed.map((entry:unknown)=>{if(!entry||typeof entry!=="object")throw new Error("Image invalide.");const item=entry as Record<string,unknown>;const imageId=typeof item.id==="string"?item.id:undefined;if(imageId&&!current?.images.some(im=>im.id===imageId))throw new Error("Cette image n’appartient pas à cet article.");return {id:imageId,url:validateStoredAssetUrl(String(item.url??"")),alt:String(item.alt??"").slice(0,300)};});
      if(new Set(images.filter(i=>i.id).map(i=>i.id)).size!==images.filter(i=>i.id).length)throw new Error("Une image est présente plusieurs fois.");
    }
    const enteredSlug=text(f,"slug",180);
    if(enteredSlug&&current&&enteredSlug!==current.slug)throw new Error("L’URL existante est conservée pour protéger les liens et le référencement.");
    const generatedSlug=enteredSlug||`${slugify(String(data.name??"article"))}-${crypto.randomUUID().slice(0,8)}`;
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(current?.slug??generatedSlug))throw new Error("URL invalide : utilisez des lettres minuscules, chiffres et tirets.");
    const saved=await prisma.$transaction(async(tx)=>{
      const product=current?await tx.product.update({where:{id:current.id},data}):await tx.product.create({data:{...data,slug:generatedSlug,description:data.description??model?.description??"",price:data.price??0,available:data.available??false,published:data.published??false} as Prisma.ProductUncheckedCreateInput});
      if(images){const keep=images.flatMap(im=>im.id?[im.id]:[]);await tx.productImage.deleteMany({where:{productId:product.id,id:{notIn:keep}}});for(const [sortOrder,im]of images.entries()){if(im.id)await tx.productImage.update({where:{id:im.id},data:{url:im.url,alt:im.alt,sortOrder}});else await tx.productImage.create({data:{productId:product.id,url:im.url,alt:im.alt||product.name,sortOrder}});}}
      await tx.auditLog.create({data:{actorId:user.userId,action:current?"variant.update":"variant.create",entityType:"Product",entityId:product.id,before:current?{price:String(current.price),stock:current.stock,reference:current.reference}:undefined,after:{price:String(product.price),stock:product.stock,reference:product.reference}}});return product;
    });
    if (images && current) {
      const retainedIds = new Set(images.flatMap((image) => image.id ? [image.id] : []));
      for (const removed of current.images.filter((image) => !retainedIds.has(image.id))) {
        await deleteUploadedImageIfUnreferenced(removed.url).catch(() => undefined);
      }
    }
    savedId=saved.id;refresh(saved.slug);
  }catch(error){return {error:adminError(error)};}
  if(!id)redirect(`/admin/produits/${savedId}`);
  return {success:"Article enregistré."};
}

export async function deleteVariantAction(id:string,_state:ActionResult,f:FormData):Promise<ActionResult>{
  const actor=await requirePermission("products.delete");let slug:string|undefined;let imageUrls:string[]=[];
  try{
    if(String(f.get("confirmation")??"")!=="SUPPRIMER")throw new Error("Tapez SUPPRIMER pour confirmer la suppression définitive.");
    const current=await prisma.product.findUnique({where:{id},include:{images:true,_count:{select:{cartItems:true,orderItems:true}}}});
    if(!current)throw new Error("Article introuvable.");
    if(current._count.cartItems>0||current._count.orderItems>0)throw new Error("Cet article est lié à un panier ou une commande. Archivez-le afin de préserver l’historique.");
    slug=current.slug;imageUrls=current.images.map(image=>image.url);
    await prisma.$transaction(async(tx)=>{await tx.auditLog.create({data:{actorId:actor.userId,action:"variant.delete",entityType:"Product",entityId:id,before:{name:current.name,reference:current.reference,slug:current.slug}}});await tx.product.delete({where:{id}});});
    for(const url of imageUrls)await deleteUploadedImageIfUnreferenced(url).catch(()=>undefined);
    refresh(slug);
  }catch(error){return {error:adminError(error)};}
  redirect("/admin/articles");
}

export async function deleteModelAction(id:string,_state:ActionResult,f:FormData):Promise<ActionResult>{
  const actor=await requirePermission("models.delete");
  try{
    if(String(f.get("confirmation")??"")!=="SUPPRIMER")throw new Error("Tapez SUPPRIMER pour confirmer la suppression définitive.");
    const current=await prisma.productModel.findUnique({where:{id},include:{_count:{select:{variants:true}}}});
    if(!current)throw new Error("Modèle introuvable.");
    if(current._count.variants>0)throw new Error("Ce modèle possède des variantes. Archivez les articles ou rattachez-les avant de supprimer le modèle.");
    await prisma.$transaction(async(tx)=>{await tx.auditLog.create({data:{actorId:actor.userId,action:"model.delete",entityType:"ProductModel",entityId:id,before:{code:current.code,name:current.name}}});await tx.productModel.delete({where:{id}});});
    refresh();
  }catch(error){return {error:adminError(error)};}
  redirect("/admin/modeles");
}

export async function archiveVariantAction(id:string,_state:ActionResult,f:FormData):Promise<ActionResult>{
  const user=await requirePermission("products.archive");
  try{const p=await prisma.$transaction(async(tx)=>{const current=await tx.product.findUniqueOrThrow({where:{id}});const archived=f.get("restore")!=="yes";const row=await tx.product.update({where:{id},data:{archived}});await tx.auditLog.create({data:{actorId:user.userId,action:archived?"variant.archive":"variant.restore",entityType:"Product",entityId:id,before:{archived:current.archived},after:{archived}}});return row;});refresh(p.slug);return {success:p.archived?"Article archivé.":"Article restauré."};}catch(e){return {error:adminError(e)};}
}

export async function updateStockAction(id:string,_state:ActionResult,f:FormData):Promise<ActionResult>{
  const user=await requirePermission("stock.edit");
  try{const stock=optionalNumber(f.get("stock"),"Stock",0,1000000);const row=await prisma.$transaction(async(tx)=>{const old=await tx.product.findUniqueOrThrow({where:{id}});const next=await tx.product.update({where:{id},data:{stock,...(stock!==null?{available:stock>0}:{})}});await tx.auditLog.create({data:{actorId:user.userId,action:"stock.update",entityType:"Product",entityId:id,before:{stock:old.stock},after:{stock}}});return next;});refresh(row.slug);return {success:"Stock enregistré."};}catch(e){return {error:adminError(e)};}
}
