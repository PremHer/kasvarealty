-- CreateTable
CREATE TABLE "pagos_cuotas" (
    "id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "formaPago" "FormaPago",
    "voucherPago" TEXT,
    "observaciones" TEXT,
    "cuotaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "pagos_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagos_cuotas_cuotaId_idx" ON "pagos_cuotas"("cuotaId");

-- CreateIndex
CREATE INDEX "pagos_cuotas_fechaPago_idx" ON "pagos_cuotas"("fechaPago");

-- CreateIndex
CREATE INDEX "pagos_cuotas_createdBy_idx" ON "pagos_cuotas"("createdBy");

-- CreateIndex
CREATE INDEX "pagos_cuotas_updatedBy_idx" ON "pagos_cuotas"("updatedBy");

-- AddForeignKey
ALTER TABLE "pagos_cuotas" ADD CONSTRAINT "pagos_cuotas_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "cuotas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuotas" ADD CONSTRAINT "pagos_cuotas_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cuotas" ADD CONSTRAINT "pagos_cuotas_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
