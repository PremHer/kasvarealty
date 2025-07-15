-- CreateEnum
CREATE TYPE "EstadoCuota" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'CANCELADA', 'PARCIAL');

-- CreateTable
CREATE TABLE "cuotas" (
    "id" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" "EstadoCuota" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "ventaLoteId" TEXT,
    "ventaUnidadCementerioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cuotas_ventaLoteId_idx" ON "cuotas"("ventaLoteId");

-- CreateIndex
CREATE INDEX "cuotas_ventaUnidadCementerioId_idx" ON "cuotas"("ventaUnidadCementerioId");

-- CreateIndex
CREATE INDEX "cuotas_estado_idx" ON "cuotas"("estado");

-- CreateIndex
CREATE INDEX "cuotas_fechaVencimiento_idx" ON "cuotas"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "cuotas_createdBy_idx" ON "cuotas"("createdBy");

-- CreateIndex
CREATE INDEX "cuotas_updatedBy_idx" ON "cuotas"("updatedBy");

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_ventaLoteId_fkey" FOREIGN KEY ("ventaLoteId") REFERENCES "ventas_lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_ventaUnidadCementerioId_fkey" FOREIGN KEY ("ventaUnidadCementerioId") REFERENCES "ventas_unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
