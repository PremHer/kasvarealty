-- AlterTable
ALTER TABLE "pagos_cuotas" ADD COLUMN     "comprobanteId" TEXT;

-- CreateIndex
CREATE INDEX "pagos_cuotas_comprobanteId_idx" ON "pagos_cuotas"("comprobanteId");

-- AddForeignKey
ALTER TABLE "pagos_cuotas" ADD CONSTRAINT "pagos_cuotas_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "comprobantes_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
