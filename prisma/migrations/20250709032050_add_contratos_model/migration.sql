/*
  Warnings:

  - You are about to drop the column `comprobanteId` on the `pagos_cuotas` table. All the data in the column will be lost.
  - You are about to drop the column `formaPago` on the `pagos_cuotas` table. All the data in the column will be lost.
  - You are about to drop the column `voucherPago` on the `pagos_cuotas` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('COMPRA_VENTA_LOTE', 'COMPRA_VENTA_UNIDAD_CEMENTERIO', 'PROMESA_COMPRA_VENTA', 'CONTRATO_ARRIENDO', 'CONTRATO_ADMINISTRACION');

-- CreateEnum
CREATE TYPE "EstadoContrato" AS ENUM ('BORRADOR', 'EN_REVISION', 'APROBADO', 'FIRMADO', 'ENTREGADO', 'ANULADO');

-- DropForeignKey
ALTER TABLE "pagos_cuotas" DROP CONSTRAINT "pagos_cuotas_comprobanteId_fkey";

-- DropIndex
DROP INDEX "pagos_cuotas_comprobanteId_idx";

-- DropIndex
DROP INDEX "pagos_cuotas_fechaPago_idx";

-- AlterTable
ALTER TABLE "pagos_cuotas" DROP COLUMN "comprobanteId",
DROP COLUMN "formaPago",
DROP COLUMN "voucherPago",
ADD COLUMN     "comprobantePagoId" TEXT,
ADD COLUMN     "metodoPago" TEXT;

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "numeroContrato" TEXT NOT NULL,
    "tipoContrato" "TipoContrato" NOT NULL,
    "estado" "EstadoContrato" NOT NULL DEFAULT 'BORRADOR',
    "ventaLoteId" TEXT,
    "ventaUnidadCementerioId" TEXT,
    "fechaContrato" TIMESTAMP(3) NOT NULL,
    "fechaFirma" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "lugarFirma" TEXT,
    "notario" TEXT,
    "registroPublico" TEXT,
    "numeroEscritura" TEXT,
    "fechaInscripcion" TIMESTAMP(3),
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "montoInicial" DOUBLE PRECISION,
    "saldoPendiente" DOUBLE PRECISION,
    "numeroCuotas" INTEGER,
    "montoCuota" DOUBLE PRECISION,
    "frecuenciaCuota" "FrecuenciaCuota",
    "condicionesEspeciales" TEXT,
    "observaciones" TEXT,
    "contratoPDF" TEXT,
    "contratoWord" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numeroContrato_key" ON "contratos"("numeroContrato");

-- CreateIndex
CREATE INDEX "contratos_ventaLoteId_idx" ON "contratos"("ventaLoteId");

-- CreateIndex
CREATE INDEX "contratos_ventaUnidadCementerioId_idx" ON "contratos"("ventaUnidadCementerioId");

-- CreateIndex
CREATE INDEX "contratos_tipoContrato_idx" ON "contratos"("tipoContrato");

-- CreateIndex
CREATE INDEX "contratos_estado_idx" ON "contratos"("estado");

-- CreateIndex
CREATE INDEX "contratos_createdBy_idx" ON "contratos"("createdBy");

-- CreateIndex
CREATE INDEX "contratos_updatedBy_idx" ON "contratos"("updatedBy");

-- CreateIndex
CREATE INDEX "pagos_cuotas_comprobantePagoId_idx" ON "pagos_cuotas"("comprobantePagoId");

-- AddForeignKey
ALTER TABLE "pagos_cuotas" ADD CONSTRAINT "pagos_cuotas_comprobantePagoId_fkey" FOREIGN KEY ("comprobantePagoId") REFERENCES "comprobantes_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_ventaLoteId_fkey" FOREIGN KEY ("ventaLoteId") REFERENCES "ventas_lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_ventaUnidadCementerioId_fkey" FOREIGN KEY ("ventaUnidadCementerioId") REFERENCES "ventas_unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
