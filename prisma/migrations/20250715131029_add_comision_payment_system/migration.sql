-- CreateEnum
CREATE TYPE "TipoPagoComision" AS ENUM ('PARCIAL', 'COMPLETO');

-- CreateTable
CREATE TABLE "pagos_comisiones" (
    "id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "formaPago" "FormaPago" NOT NULL,
    "tipoPago" "TipoPagoComision" NOT NULL DEFAULT 'PARCIAL',
    "observaciones" TEXT,
    "ventaLoteId" TEXT,
    "ventaUnidadCementerioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "pagos_comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ComprobantePagoToPagoComision" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "pagos_comisiones_ventaLoteId_idx" ON "pagos_comisiones"("ventaLoteId");

-- CreateIndex
CREATE INDEX "pagos_comisiones_ventaUnidadCementerioId_idx" ON "pagos_comisiones"("ventaUnidadCementerioId");

-- CreateIndex
CREATE INDEX "pagos_comisiones_fechaPago_idx" ON "pagos_comisiones"("fechaPago");

-- CreateIndex
CREATE INDEX "pagos_comisiones_tipoPago_idx" ON "pagos_comisiones"("tipoPago");

-- CreateIndex
CREATE INDEX "pagos_comisiones_createdBy_idx" ON "pagos_comisiones"("createdBy");

-- CreateIndex
CREATE INDEX "pagos_comisiones_updatedBy_idx" ON "pagos_comisiones"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "_ComprobantePagoToPagoComision_AB_unique" ON "_ComprobantePagoToPagoComision"("A", "B");

-- CreateIndex
CREATE INDEX "_ComprobantePagoToPagoComision_B_index" ON "_ComprobantePagoToPagoComision"("B");

-- AddForeignKey
ALTER TABLE "pagos_comisiones" ADD CONSTRAINT "pagos_comisiones_ventaLoteId_fkey" FOREIGN KEY ("ventaLoteId") REFERENCES "ventas_lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_comisiones" ADD CONSTRAINT "pagos_comisiones_ventaUnidadCementerioId_fkey" FOREIGN KEY ("ventaUnidadCementerioId") REFERENCES "ventas_unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_comisiones" ADD CONSTRAINT "pagos_comisiones_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_comisiones" ADD CONSTRAINT "pagos_comisiones_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComprobantePagoToPagoComision" ADD CONSTRAINT "_ComprobantePagoToPagoComision_A_fkey" FOREIGN KEY ("A") REFERENCES "comprobantes_pago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComprobantePagoToPagoComision" ADD CONSTRAINT "_ComprobantePagoToPagoComision_B_fkey" FOREIGN KEY ("B") REFERENCES "pagos_comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
