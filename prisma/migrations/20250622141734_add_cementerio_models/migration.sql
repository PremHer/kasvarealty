-- CreateEnum
CREATE TYPE "TipoUnidadCementerio" AS ENUM ('PARCELA', 'NICHO', 'MAUSOLEO');

-- CreateEnum
CREATE TYPE "EstadoUnidadCementerio" AS ENUM ('DISPONIBLE', 'RESERVADO', 'VENDIDO', 'OCUPADO', 'INACTIVO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "TipoTerreno" AS ENUM ('TIERRA', 'CEMENTO', 'JARDIN', 'CESPED');

-- CreateEnum
CREATE TYPE "MaterialNicho" AS ENUM ('CONCRETO', 'MARMOL', 'OTROS');

-- CreateEnum
CREATE TYPE "MaterialMausoleo" AS ENUM ('LADRILLO', 'CONCRETO', 'GRANITO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoConstruccionMausoleo" AS ENUM ('FAMILIAR', 'COLECTIVO', 'OTRO');

-- CreateTable
CREATE TABLE "pabellones" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "areaTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidadUnidades" INTEGER NOT NULL DEFAULT 0,
    "proyectoId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "descripcion" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "pabellones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_cementerio" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipoUnidad" "TipoUnidadCementerio" NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoUnidadCementerio" NOT NULL DEFAULT 'DISPONIBLE',
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "descripcion" TEXT,
    "observaciones" TEXT,
    "pabellonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "unidades_cementerio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas" (
    "id" TEXT NOT NULL,
    "unidadCementerioId" TEXT NOT NULL,
    "dimensionLargo" DOUBLE PRECISION NOT NULL,
    "dimensionAncho" DOUBLE PRECISION NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "tipoTerreno" "TipoTerreno" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nichos" (
    "id" TEXT NOT NULL,
    "unidadCementerioId" TEXT NOT NULL,
    "nivelVertical" INTEGER NOT NULL,
    "capacidadUrnas" INTEGER NOT NULL,
    "material" "MaterialNicho" NOT NULL,
    "medidaAlto" DOUBLE PRECISION NOT NULL,
    "medidaAncho" DOUBLE PRECISION NOT NULL,
    "medidaProfundidad" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nichos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mausoleos" (
    "id" TEXT NOT NULL,
    "unidadCementerioId" TEXT NOT NULL,
    "dimensionLargo" DOUBLE PRECISION NOT NULL,
    "dimensionAncho" DOUBLE PRECISION NOT NULL,
    "capacidadPersonas" INTEGER NOT NULL,
    "tipoConstruccion" "TipoConstruccionMausoleo" NOT NULL,
    "material" "MaterialMausoleo" NOT NULL,
    "niveles" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mausoleos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pabellones_proyectoId_idx" ON "pabellones"("proyectoId");

-- CreateIndex
CREATE INDEX "pabellones_createdBy_idx" ON "pabellones"("createdBy");

-- CreateIndex
CREATE INDEX "pabellones_updatedBy_idx" ON "pabellones"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "pabellones_codigo_proyectoId_key" ON "pabellones"("codigo", "proyectoId");

-- CreateIndex
CREATE INDEX "unidades_cementerio_pabellonId_idx" ON "unidades_cementerio"("pabellonId");

-- CreateIndex
CREATE INDEX "unidades_cementerio_createdBy_idx" ON "unidades_cementerio"("createdBy");

-- CreateIndex
CREATE INDEX "unidades_cementerio_updatedBy_idx" ON "unidades_cementerio"("updatedBy");

-- CreateIndex
CREATE INDEX "unidades_cementerio_estado_idx" ON "unidades_cementerio"("estado");

-- CreateIndex
CREATE INDEX "unidades_cementerio_tipoUnidad_idx" ON "unidades_cementerio"("tipoUnidad");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_cementerio_codigo_pabellonId_key" ON "unidades_cementerio"("codigo", "pabellonId");

-- CreateIndex
CREATE UNIQUE INDEX "parcelas_unidadCementerioId_key" ON "parcelas"("unidadCementerioId");

-- CreateIndex
CREATE UNIQUE INDEX "nichos_unidadCementerioId_key" ON "nichos"("unidadCementerioId");

-- CreateIndex
CREATE UNIQUE INDEX "mausoleos_unidadCementerioId_key" ON "mausoleos"("unidadCementerioId");

-- AddForeignKey
ALTER TABLE "pabellones" ADD CONSTRAINT "pabellones_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pabellones" ADD CONSTRAINT "pabellones_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pabellones" ADD CONSTRAINT "pabellones_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_cementerio" ADD CONSTRAINT "unidades_cementerio_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_cementerio" ADD CONSTRAINT "unidades_cementerio_pabellonId_fkey" FOREIGN KEY ("pabellonId") REFERENCES "pabellones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_cementerio" ADD CONSTRAINT "unidades_cementerio_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_unidadCementerioId_fkey" FOREIGN KEY ("unidadCementerioId") REFERENCES "unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nichos" ADD CONSTRAINT "nichos_unidadCementerioId_fkey" FOREIGN KEY ("unidadCementerioId") REFERENCES "unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mausoleos" ADD CONSTRAINT "mausoleos_unidadCementerioId_fkey" FOREIGN KEY ("unidadCementerioId") REFERENCES "unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
