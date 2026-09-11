import test from "node:test";
import assert from "node:assert/strict";
import {PrismaClient,Prisma} from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

const connection=process.env.DATABASE_URL;
test("création marque, modèle, variante, coloris, taille et archivage restent transactionnels",{skip:!connection},async()=>{
 const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:connection!})});
 const rollback=new Error("ROLLBACK_TEST");
 try{
  await prisma.$transaction(async tx=>{
   const stamp=Date.now().toString(36);const category=await tx.category.findFirst({where:{slug:"solaires"}});assert.ok(category);
   const brand=await tx.brand.create({data:{name:`Test ${stamp}`,slug:`test-${stamp}`}});
   const model=await tx.productModel.create({data:{brandId:brand.id,categoryId:category.id,type:"SUNGLASSES",code:`T${stamp}`,name:"Modèle test",shape:"Aviateur",materialLabel:"Métal"}});
   const base={productModelId:model.id,type:"SUNGLASSES" as const,name:"Test",description:"",brandId:brand.id,categoryId:category.id,price:new Prisma.Decimal("450.125"),published:false};
   const first=await tx.product.create({data:{...base,slug:`test-${stamp}-black`,reference:`T${stamp} 001 58-14`,variantReference:"001",frameColorLabel:"Noir",size:"58-14",lensWidth:58,bridgeWidth:14,templeLength:null,stock:5}});
   const color=await tx.product.create({data:{...base,slug:`test-${stamp}-gold`,reference:`T${stamp} 002 58-14`,variantReference:"002",frameColorLabel:"Or",size:"58-14",lensWidth:58,bridgeWidth:14,stock:2}});
   const size=await tx.product.create({data:{...base,slug:`test-${stamp}-62`,reference:`T${stamp} 001 62-14-140`,variantReference:"001",frameColorLabel:"Noir",size:"62-14-140",lensWidth:62,bridgeWidth:14,templeLength:140,stock:1}});
   assert.equal((await tx.productModel.findUniqueOrThrow({where:{id:model.id},include:{_count:{select:{variants:true}}}}))._count.variants,3);
   assert.notEqual(first.id,color.id);assert.equal(size.templeLength,140);
   await tx.product.update({where:{id:first.id},data:{archived:true}});assert.ok((await tx.product.findUniqueOrThrow({where:{id:first.id}})).archived);
   throw rollback;
  });
 }catch(error){if(error!==rollback)throw error;}finally{await prisma.$disconnect();}
});
