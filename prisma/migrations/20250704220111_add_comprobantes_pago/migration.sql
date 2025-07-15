-- CreateTable
CREATE TABLE "comprobantes_pago" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "nombreArchivo" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "driveFileUrl" TEXT NOT NULL,
    "driveDownloadUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "ventaLoteId" TEXT,
    "ventaUnidadCementerioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "comprobantes_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comprobantes_pago_ventaLoteId_idx" ON "comprobantes_pago"("ventaLoteId");

-- CreateIndex
CREATE INDEX "comprobantes_pago_ventaUnidadCementerioId_idx" ON "comprobantes_pago"("ventaUnidadCementerioId");

-- CreateIndex
CREATE INDEX "comprobantes_pago_tipo_idx" ON "comprobantes_pago"("tipo");

-- CreateIndex
CREATE INDEX "comprobantes_pago_fecha_idx" ON "comprobantes_pago"("fecha");

-- CreateIndex
CREATE INDEX "comprobantes_pago_createdBy_idx" ON "comprobantes_pago"("createdBy");

-- CreateIndex
CREATE INDEX "comprobantes_pago_updatedBy_idx" ON "comprobantes_pago"("updatedBy");

-- AddForeignKey
ALTER TABLE "comprobantes_pago" ADD CONSTRAINT "comprobantes_pago_ventaLoteId_fkey" FOREIGN KEY ("ventaLoteId") REFERENCES "ventas_lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes_pago" ADD CONSTRAINT "comprobantes_pago_ventaUnidadCementerioId_fkey" FOREIGN KEY ("ventaUnidadCementerioId") REFERENCES "ventas_unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
