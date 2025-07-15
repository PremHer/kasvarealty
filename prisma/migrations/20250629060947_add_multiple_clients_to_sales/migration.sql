-- CreateTable
CREATE TABLE "ventas_lotes_clientes" (
    "id" TEXT NOT NULL,
    "ventaLoteId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_lotes_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_unidades_cementerio_clientes" (
    "id" TEXT NOT NULL,
    "ventaUnidadCementerioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_unidades_cementerio_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ventas_lotes_clientes_ventaLoteId_idx" ON "ventas_lotes_clientes"("ventaLoteId");

-- CreateIndex
CREATE INDEX "ventas_lotes_clientes_clienteId_idx" ON "ventas_lotes_clientes"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_lotes_clientes_ventaLoteId_clienteId_key" ON "ventas_lotes_clientes"("ventaLoteId", "clienteId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_clientes_ventaUnidadCementerioId_idx" ON "ventas_unidades_cementerio_clientes"("ventaUnidadCementerioId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_clientes_clienteId_idx" ON "ventas_unidades_cementerio_clientes"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_unidades_cementerio_clientes_ventaUnidadCementerioId_key" ON "ventas_unidades_cementerio_clientes"("ventaUnidadCementerioId", "clienteId");

-- AddForeignKey
ALTER TABLE "ventas_lotes_clientes" ADD CONSTRAINT "ventas_lotes_clientes_ventaLoteId_fkey" FOREIGN KEY ("ventaLoteId") REFERENCES "ventas_lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes_clientes" ADD CONSTRAINT "ventas_lotes_clientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio_clientes" ADD CONSTRAINT "ventas_unidades_cementerio_clientes_ventaUnidadCementerioI_fkey" FOREIGN KEY ("ventaUnidadCementerioId") REFERENCES "ventas_unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio_clientes" ADD CONSTRAINT "ventas_unidades_cementerio_clientes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
