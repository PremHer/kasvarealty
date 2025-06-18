-- CreateEnum
CREATE TYPE "EstadoLote" AS ENUM ('DISPONIBLE', 'RESERVADO', 'VENDIDO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "EstadoVentaLote" AS ENUM ('PENDIENTE', 'APROBADA', 'CANCELADA', 'ENTREGADA');

-- CreateTable
CREATE TABLE "manzanas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "areaTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidadLotes" INTEGER NOT NULL DEFAULT 0,
    "proyectoId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "descripcion" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "manzanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "precio" DOUBLE PRECISION,
    "estado" "EstadoLote" NOT NULL DEFAULT 'DISPONIBLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "linderoFrente" TEXT,
    "linderoFondo" TEXT,
    "linderoIzquierda" TEXT,
    "linderoDerecha" TEXT,
    "dimensionFrente" DOUBLE PRECISION,
    "dimensionFondo" DOUBLE PRECISION,
    "dimensionIzquierda" DOUBLE PRECISION,
    "dimensionDerecha" DOUBLE PRECISION,
    "descripcion" TEXT,
    "observaciones" TEXT,
    "caracteristicas" TEXT,
    "tipoTerreno" TEXT,
    "servicios" TEXT,
    "manzanaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_lotes" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaVenta" TIMESTAMP(3) NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoVentaLote" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "ventas_lotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manzanas_proyectoId_idx" ON "manzanas"("proyectoId");

-- CreateIndex
CREATE INDEX "manzanas_createdBy_idx" ON "manzanas"("createdBy");

-- CreateIndex
CREATE INDEX "manzanas_updatedBy_idx" ON "manzanas"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "manzanas_codigo_proyectoId_key" ON "manzanas"("codigo", "proyectoId");

-- CreateIndex
CREATE INDEX "lotes_manzanaId_idx" ON "lotes"("manzanaId");

-- CreateIndex
CREATE INDEX "lotes_createdBy_idx" ON "lotes"("createdBy");

-- CreateIndex
CREATE INDEX "lotes_updatedBy_idx" ON "lotes"("updatedBy");

-- CreateIndex
CREATE INDEX "lotes_estado_idx" ON "lotes"("estado");

-- CreateIndex
CREATE INDEX "lotes_isActive_idx" ON "lotes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_codigo_manzanaId_key" ON "lotes"("codigo", "manzanaId");

-- CreateIndex
CREATE INDEX "ventas_lotes_loteId_idx" ON "ventas_lotes"("loteId");

-- CreateIndex
CREATE INDEX "ventas_lotes_clienteId_idx" ON "ventas_lotes"("clienteId");

-- CreateIndex
CREATE INDEX "ventas_lotes_createdBy_idx" ON "ventas_lotes"("createdBy");

-- CreateIndex
CREATE INDEX "ventas_lotes_updatedBy_idx" ON "ventas_lotes"("updatedBy");

-- AddForeignKey
ALTER TABLE "manzanas" ADD CONSTRAINT "manzanas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manzanas" ADD CONSTRAINT "manzanas_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manzanas" ADD CONSTRAINT "manzanas_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_manzanaId_fkey" FOREIGN KEY ("manzanaId") REFERENCES "manzanas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
