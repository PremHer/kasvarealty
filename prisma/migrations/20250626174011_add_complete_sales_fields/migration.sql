/*
  Warnings:

  - Added the required column `precioOriginal` to the `ventas_lotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precioOriginal` to the `ventas_unidades_cementerio` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoVenta" AS ENUM ('CONTADO', 'CUOTAS');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO', 'CHEQUE', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'YAPE', 'PLIN', 'OTRO');

-- CreateEnum
CREATE TYPE "FrecuenciaCuota" AS ENUM ('MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "EstadoDocumentacion" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETA', 'INCOMPLETA', 'VENCIDA');

-- AlterTable
ALTER TABLE "ventas_lotes" ADD COLUMN     "comisionVendedor" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "condicionesEspeciales" TEXT,
ADD COLUMN     "documentosRequeridos" TEXT,
ADD COLUMN     "estadoDocumentacion" "EstadoDocumentacion" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaEntrega" TIMESTAMP(3),
ADD COLUMN     "fechaPrimeraCuota" TIMESTAMP(3),
ADD COLUMN     "formaPago" "FormaPago",
ADD COLUMN     "frecuenciaCuota" "FrecuenciaCuota" DEFAULT 'MENSUAL',
ADD COLUMN     "montoCuota" DOUBLE PRECISION,
ADD COLUMN     "montoDescuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "montoInicial" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "motivoDescuento" TEXT,
ADD COLUMN     "numeroCuotas" INTEGER DEFAULT 1,
ADD COLUMN     "porcentajeComision" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "precioOriginal" DOUBLE PRECISION,
ADD COLUMN     "saldoPendiente" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tipoVenta" "TipoVenta" NOT NULL DEFAULT 'CONTADO';

-- Actualizar precioOriginal con el valor de precioVenta para registros existentes
UPDATE "ventas_lotes" SET "precioOriginal" = "precioVenta" WHERE "precioOriginal" IS NULL;

-- Hacer precioOriginal NOT NULL después de actualizar
ALTER TABLE "ventas_lotes" ALTER COLUMN "precioOriginal" SET NOT NULL;

-- AlterTable
ALTER TABLE "ventas_unidades_cementerio" ADD COLUMN     "comisionVendedor" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "condicionesEspeciales" TEXT,
ADD COLUMN     "documentosRequeridos" TEXT,
ADD COLUMN     "estadoDocumentacion" "EstadoDocumentacion" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fechaEntrega" TIMESTAMP(3),
ADD COLUMN     "fechaPrimeraCuota" TIMESTAMP(3),
ADD COLUMN     "formaPago" "FormaPago",
ADD COLUMN     "frecuenciaCuota" "FrecuenciaCuota" DEFAULT 'MENSUAL',
ADD COLUMN     "montoCuota" DOUBLE PRECISION,
ADD COLUMN     "montoDescuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "montoInicial" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "motivoDescuento" TEXT,
ADD COLUMN     "numeroCuotas" INTEGER DEFAULT 1,
ADD COLUMN     "porcentajeComision" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "precioOriginal" DOUBLE PRECISION,
ADD COLUMN     "saldoPendiente" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tipoVenta" "TipoVenta" NOT NULL DEFAULT 'CONTADO';

-- Actualizar precioOriginal con el valor de precioVenta para registros existentes
UPDATE "ventas_unidades_cementerio" SET "precioOriginal" = "precioVenta" WHERE "precioOriginal" IS NULL;

-- Hacer precioOriginal NOT NULL después de actualizar
ALTER TABLE "ventas_unidades_cementerio" ALTER COLUMN "precioOriginal" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ventas_lotes_tipoVenta_idx" ON "ventas_lotes"("tipoVenta");

-- CreateIndex
CREATE INDEX "ventas_lotes_estadoDocumentacion_idx" ON "ventas_lotes"("estadoDocumentacion");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_tipoVenta_idx" ON "ventas_unidades_cementerio"("tipoVenta");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_estadoDocumentacion_idx" ON "ventas_unidades_cementerio"("estadoDocumentacion");
