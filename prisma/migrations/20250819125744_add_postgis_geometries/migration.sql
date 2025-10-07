/*
  Warnings:

  - You are about to drop the column `perimetro_geometrico` on the `lotes` table. All the data in the column will be lost.
  - You are about to drop the column `perimetro_geometrico` on the `manzanas` table. All the data in the column will be lost.
  - You are about to drop the column `perimetro_geometrico` on the `pabellones` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_lotes_centro";

-- DropIndex
DROP INDEX "idx_lotes_geometria";

-- DropIndex
DROP INDEX "idx_manzanas_centro";

-- DropIndex
DROP INDEX "idx_manzanas_geometria";

-- DropIndex
DROP INDEX "idx_pabellones_centro";

-- DropIndex
DROP INDEX "idx_pabellones_geometria";

-- DropIndex
DROP INDEX "idx_proyectos_centro";

-- DropIndex
DROP INDEX "idx_proyectos_geometria";

-- DropIndex
DROP INDEX "idx_unidades_cementerio_centro";

-- DropIndex
DROP INDEX "idx_unidades_cementerio_geometria";

-- AlterTable
ALTER TABLE "lotes" DROP COLUMN "perimetro_geometrico",
ADD COLUMN     "perimetroGeometrico" geometry(LineString,4326);

-- AlterTable
ALTER TABLE "manzanas" DROP COLUMN "perimetro_geometrico",
ADD COLUMN     "perimetroGeometrico" geometry(LineString,4326);

-- AlterTable
ALTER TABLE "pabellones" DROP COLUMN "perimetro_geometrico",
ADD COLUMN     "perimetro" geometry(LineString,4326);
