ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "heroWomenImage" TEXT;
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "heroMenImage" TEXT;
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "heroWomenTitle" TEXT;
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "heroMenTitle" TEXT;
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "heroWomenText" TEXT;
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "heroMenText" TEXT;

UPDATE "brands" SET "heroWomenImage" = CASE "slug"
  WHEN 'carrera' THEN '/images/brand-campaigns/carrera-women.jpg'
  WHEN 'ray-ban' THEN '/images/brand-campaigns/ray-ban-women.jpg'
  WHEN 'vogue' THEN '/images/brand-campaigns/vogue-women.jpg'
  WHEN 'emporio-armani' THEN '/images/brand-campaigns/emporio-armani-women.jpg'
  WHEN 'miu-miu' THEN '/images/brand-campaigns/miu-miu-women.jpg'
  WHEN 'prada' THEN '/images/brand-campaigns/prada-women.jpg'
  WHEN 'gucci' THEN '/images/brand-campaigns/gucci-women.jpg'
  WHEN 'saint-laurent' THEN '/images/brand-campaigns/saint-laurent-women.jpg'
  WHEN 'oliver-peoples' THEN '/images/brand-campaigns/oliver-peoples-women.jpg'
  WHEN 'polaroid' THEN '/images/brand-editorials/polaroid.jpg'
  ELSE "heroWomenImage" END
WHERE "heroWomenImage" IS NULL;

UPDATE "brands" SET "heroMenImage" = CASE "slug"
  WHEN 'carrera' THEN '/images/brand-editorials/carrera.jpg'
  WHEN 'ray-ban' THEN '/images/brand-editorials/ray-ban.jpg'
  WHEN 'vogue' THEN '/images/brand-editorials/vogue-eyewear.jpg'
  WHEN 'emporio-armani' THEN '/images/brand-editorials/emporio-armani.jpg'
  WHEN 'miu-miu' THEN '/images/brand-editorials/miu-miu.jpg'
  WHEN 'prada' THEN '/images/brand-editorials/prada.jpg'
  WHEN 'gucci' THEN '/images/brand-editorials/gucci.jpg'
  WHEN 'saint-laurent' THEN '/images/brand-campaigns/saint-laurent-men.jpg'
  WHEN 'oliver-peoples' THEN '/images/brand-editorials/oliver-peoples.jpg'
  WHEN 'polaroid' THEN '/images/brand-editorials/polaroid.jpg'
  ELSE "heroWomenImage" END
WHERE "heroMenImage" IS NULL;
