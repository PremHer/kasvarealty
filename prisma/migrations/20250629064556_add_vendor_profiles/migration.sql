-- CreateEnum
CREATE TYPE "EstadoVendedor" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateTable
CREATE TABLE "perfiles_vendedores" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "codigoVendedor" TEXT NOT NULL,
    "especialidad" TEXT,
    "experienciaAnos" INTEGER DEFAULT 0,
    "telefono" TEXT,
    "direccion" TEXT,
    "fechaContratacion" TIMESTAMP(3),
    "fechaTerminacion" TIMESTAMP(3),
    "estado" "EstadoVendedor" NOT NULL DEFAULT 'ACTIVO',
    "comisionBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionMinima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comisionMaxima" DOUBLE PRECISION,
    "metaMensual" DOUBLE PRECISION,
    "metaAnual" DOUBLE PRECISION,
    "observaciones" TEXT,
    "habilidades" TEXT,
    "certificaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "perfiles_vendedores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_vendedores_usuarioId_key" ON "perfiles_vendedores"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "perfiles_vendedores_codigoVendedor_key" ON "perfiles_vendedores"("codigoVendedor");

-- CreateIndex
CREATE INDEX "perfiles_vendedores_usuarioId_idx" ON "perfiles_vendedores"("usuarioId");

-- CreateIndex
CREATE INDEX "perfiles_vendedores_codigoVendedor_idx" ON "perfiles_vendedores"("codigoVendedor");

-- CreateIndex
CREATE INDEX "perfiles_vendedores_estado_idx" ON "perfiles_vendedores"("estado");

-- CreateIndex
CREATE INDEX "perfiles_vendedores_createdBy_idx" ON "perfiles_vendedores"("createdBy");

-- CreateIndex
CREATE INDEX "perfiles_vendedores_updatedBy_idx" ON "perfiles_vendedores"("updatedBy");

-- AddForeignKey
ALTER TABLE "perfiles_vendedores" ADD CONSTRAINT "perfiles_vendedores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_vendedores" ADD CONSTRAINT "perfiles_vendedores_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_vendedores" ADD CONSTRAINT "perfiles_vendedores_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
