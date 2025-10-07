/*
  Warnings:

  - You are about to drop the column `area_geometrica` on the `lotes` table. All the data in the column will be lost.
  - You are about to drop the column `centro` on the `lotes` table. All the data in the column will be lost.
  - You are about to drop the column `geometria` on the `lotes` table. All the data in the column will be lost.
  - You are about to drop the column `perimetroGeometrico` on the `lotes` table. All the data in the column will be lost.
  - You are about to drop the column `area_geometrica` on the `manzanas` table. All the data in the column will be lost.
  - You are about to drop the column `centro` on the `manzanas` table. All the data in the column will be lost.
  - You are about to drop the column `geometria` on the `manzanas` table. All the data in the column will be lost.
  - You are about to drop the column `perimetroGeometrico` on the `manzanas` table. All the data in the column will be lost.
  - You are about to drop the column `area_geometrica` on the `pabellones` table. All the data in the column will be lost.
  - You are about to drop the column `centro` on the `pabellones` table. All the data in the column will be lost.
  - You are about to drop the column `geometria` on the `pabellones` table. All the data in the column will be lost.
  - You are about to drop the column `perimetro` on the `pabellones` table. All the data in the column will be lost.
  - You are about to drop the column `area_geometrica` on the `proyectos` table. All the data in the column will be lost.
  - You are about to drop the column `centro` on the `proyectos` table. All the data in the column will be lost.
  - You are about to drop the column `geometria` on the `proyectos` table. All the data in the column will be lost.
  - You are about to drop the column `perimetro` on the `proyectos` table. All the data in the column will be lost.
  - You are about to drop the column `area_geometrica` on the `unidades_cementerio` table. All the data in the column will be lost.
  - You are about to drop the column `centro` on the `unidades_cementerio` table. All the data in the column will be lost.
  - You are about to drop the column `geometria` on the `unidades_cementerio` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "lotes" DROP COLUMN "area_geometrica",
DROP COLUMN "centro",
DROP COLUMN "geometria",
DROP COLUMN "perimetroGeometrico";

-- AlterTable
ALTER TABLE "manzanas" DROP COLUMN "area_geometrica",
DROP COLUMN "centro",
DROP COLUMN "geometria",
DROP COLUMN "perimetroGeometrico";

-- AlterTable
ALTER TABLE "pabellones" DROP COLUMN "area_geometrica",
DROP COLUMN "centro",
DROP COLUMN "geometria",
DROP COLUMN "perimetro";

-- AlterTable
ALTER TABLE "proyectos" DROP COLUMN "area_geometrica",
DROP COLUMN "centro",
DROP COLUMN "geometria",
DROP COLUMN "perimetro";

-- AlterTable
ALTER TABLE "unidades_cementerio" DROP COLUMN "area_geometrica",
DROP COLUMN "centro",
DROP COLUMN "geometria";

-- CreateTable
CREATE TABLE "reprogramaciones_cuotas" (
    "id" TEXT NOT NULL,
    "ventaLoteId" TEXT,
    "ventaUnidadCementerioId" TEXT,
    "motivo" TEXT NOT NULL,
    "cambiosPlan" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "reprogramaciones_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuentos_cuotas" (
    "id" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "reprogramacionId" TEXT NOT NULL,
    "montoDescuento" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "descuentos_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modificaciones_cuotas" (
    "id" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "reprogramacionId" TEXT NOT NULL,
    "montoAnterior" DOUBLE PRECISION NOT NULL,
    "montoNuevo" DOUBLE PRECISION NOT NULL,
    "fechaVencimientoAnterior" TIMESTAMP(3) NOT NULL,
    "fechaVencimientoNueva" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "modificaciones_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reprogramaciones_cuotas_ventaLoteId_idx" ON "reprogramaciones_cuotas"("ventaLoteId");

-- CreateIndex
CREATE INDEX "reprogramaciones_cuotas_ventaUnidadCementerioId_idx" ON "reprogramaciones_cuotas"("ventaUnidadCementerioId");

-- CreateIndex
CREATE INDEX "reprogramaciones_cuotas_createdBy_idx" ON "reprogramaciones_cuotas"("createdBy");

-- CreateIndex
CREATE INDEX "reprogramaciones_cuotas_updatedBy_idx" ON "reprogramaciones_cuotas"("updatedBy");

-- CreateIndex
CREATE INDEX "reprogramaciones_cuotas_createdAt_idx" ON "reprogramaciones_cuotas"("createdAt");

-- CreateIndex
CREATE INDEX "descuentos_cuotas_cuotaId_idx" ON "descuentos_cuotas"("cuotaId");

-- CreateIndex
CREATE INDEX "descuentos_cuotas_reprogramacionId_idx" ON "descuentos_cuotas"("reprogramacionId");

-- CreateIndex
CREATE INDEX "descuentos_cuotas_createdBy_idx" ON "descuentos_cuotas"("createdBy");

-- CreateIndex
CREATE INDEX "descuentos_cuotas_updatedBy_idx" ON "descuentos_cuotas"("updatedBy");

-- CreateIndex
CREATE INDEX "modificaciones_cuotas_cuotaId_idx" ON "modificaciones_cuotas"("cuotaId");

-- CreateIndex
CREATE INDEX "modificaciones_cuotas_reprogramacionId_idx" ON "modificaciones_cuotas"("reprogramacionId");

-- CreateIndex
CREATE INDEX "modificaciones_cuotas_createdBy_idx" ON "modificaciones_cuotas"("createdBy");

-- CreateIndex
CREATE INDEX "modificaciones_cuotas_updatedBy_idx" ON "modificaciones_cuotas"("updatedBy");

-- AddForeignKey
ALTER TABLE "reprogramaciones_cuotas" ADD CONSTRAINT "reprogramaciones_cuotas_ventaLoteId_fkey" FOREIGN KEY ("ventaLoteId") REFERENCES "ventas_lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reprogramaciones_cuotas" ADD CONSTRAINT "reprogramaciones_cuotas_ventaUnidadCementerioId_fkey" FOREIGN KEY ("ventaUnidadCementerioId") REFERENCES "ventas_unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reprogramaciones_cuotas" ADD CONSTRAINT "reprogramaciones_cuotas_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reprogramaciones_cuotas" ADD CONSTRAINT "reprogramaciones_cuotas_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuentos_cuotas" ADD CONSTRAINT "descuentos_cuotas_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "cuotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuentos_cuotas" ADD CONSTRAINT "descuentos_cuotas_reprogramacionId_fkey" FOREIGN KEY ("reprogramacionId") REFERENCES "reprogramaciones_cuotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuentos_cuotas" ADD CONSTRAINT "descuentos_cuotas_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuentos_cuotas" ADD CONSTRAINT "descuentos_cuotas_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificaciones_cuotas" ADD CONSTRAINT "modificaciones_cuotas_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "cuotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificaciones_cuotas" ADD CONSTRAINT "modificaciones_cuotas_reprogramacionId_fkey" FOREIGN KEY ("reprogramacionId") REFERENCES "reprogramaciones_cuotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificaciones_cuotas" ADD CONSTRAINT "modificaciones_cuotas_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificaciones_cuotas" ADD CONSTRAINT "modificaciones_cuotas_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
