-- CreateTable
CREATE TABLE "recibos_pago" (
    "id" TEXT NOT NULL,
    "numeroRecibo" TEXT NOT NULL,
    "empresaDesarrolladoraId" TEXT NOT NULL,
    "ventaId" TEXT,
    "cuotaId" TEXT,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "montoPagado" DECIMAL(10,2) NOT NULL,
    "formaPago" "FormaPago" NOT NULL,
    "metodoPago" TEXT,
    "concepto" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "comprobantePagoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "recibos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recibos_pago_numeroRecibo_key" ON "recibos_pago"("numeroRecibo");

-- CreateIndex
CREATE INDEX "recibos_pago_empresaDesarrolladoraId_idx" ON "recibos_pago"("empresaDesarrolladoraId");

-- CreateIndex
CREATE INDEX "recibos_pago_ventaId_idx" ON "recibos_pago"("ventaId");

-- CreateIndex
CREATE INDEX "recibos_pago_cuotaId_idx" ON "recibos_pago"("cuotaId");

-- CreateIndex
CREATE INDEX "recibos_pago_clienteId_idx" ON "recibos_pago"("clienteId");

-- CreateIndex
CREATE INDEX "recibos_pago_vendedorId_idx" ON "recibos_pago"("vendedorId");

-- CreateIndex
CREATE INDEX "recibos_pago_fechaPago_idx" ON "recibos_pago"("fechaPago");

-- CreateIndex
CREATE INDEX "recibos_pago_createdBy_idx" ON "recibos_pago"("createdBy");

-- CreateIndex
CREATE INDEX "recibos_pago_updatedBy_idx" ON "recibos_pago"("updatedBy");

-- AddForeignKey
ALTER TABLE "recibos_pago" ADD CONSTRAINT "recibos_pago_empresaDesarrolladoraId_fkey" FOREIGN KEY ("empresaDesarrolladoraId") REFERENCES "empresas_desarrolladoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_pago" ADD CONSTRAINT "recibos_pago_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas_lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_pago" ADD CONSTRAINT "recibos_pago_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "cuotas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_pago" ADD CONSTRAINT "recibos_pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_pago" ADD CONSTRAINT "recibos_pago_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_pago" ADD CONSTRAINT "recibos_pago_comprobantePagoId_fkey" FOREIGN KEY ("comprobantePagoId") REFERENCES "comprobantes_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_pago" ADD CONSTRAINT "recibos_pago_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos_pago" ADD CONSTRAINT "recibos_pago_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
