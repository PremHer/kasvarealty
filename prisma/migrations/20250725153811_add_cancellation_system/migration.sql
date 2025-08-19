-- CreateEnum
CREATE TYPE "TipoCancelacion" AS ENUM ('SOLICITUD_CLIENTE', 'INCUMPLIMIENTO_CLIENTE', 'PROBLEMAS_FINANCIEROS', 'CAMBIO_PLANES', 'PROBLEMAS_LEGALES', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoDevolucion" AS ENUM ('DEVOLUCION_COMPLETA', 'DEVOLUCION_PARCIAL', 'SIN_DEVOLUCION', 'CREDITO_FUTURO', 'CAMBIO_PRODUCTO');

-- CreateEnum
CREATE TYPE "EstadoCancelacion" AS ENUM ('SOLICITADA', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'COMPLETADA');

-- AlterEnum
ALTER TYPE "EstadoVentaLote" ADD VALUE 'EN_PROCESO_CANCELACION';

-- AlterEnum
ALTER TYPE "EstadoVentaUnidadCementerio" ADD VALUE 'EN_PROCESO_CANCELACION';

-- CreateTable
CREATE TABLE "cancelaciones_ventas" (
    "id" TEXT NOT NULL,
    "ventaLoteId" TEXT,
    "ventaUnidadCementerioId" TEXT,
    "tipoCancelacion" "TipoCancelacion" NOT NULL,
    "motivoCancelacion" TEXT NOT NULL,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" TIMESTAMP(3),
    "fechaCompletada" TIMESTAMP(3),
    "tipoDevolucion" "TipoDevolucion" NOT NULL,
    "montoDevolucion" DOUBLE PRECISION DEFAULT 0,
    "porcentajeDevolucion" DOUBLE PRECISION DEFAULT 0,
    "motivoDevolucion" TEXT,
    "observaciones" TEXT,
    "documentosRequeridos" TEXT,
    "condicionesEspeciales" TEXT,
    "estado" "EstadoCancelacion" NOT NULL DEFAULT 'SOLICITADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "aprobadoPor" TEXT,

    CONSTRAINT "cancelaciones_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cancelaciones_ventas_ventaLoteId_idx" ON "cancelaciones_ventas"("ventaLoteId");

-- CreateIndex
CREATE INDEX "cancelaciones_ventas_ventaUnidadCementerioId_idx" ON "cancelaciones_ventas"("ventaUnidadCementerioId");

-- CreateIndex
CREATE INDEX "cancelaciones_ventas_tipoCancelacion_idx" ON "cancelaciones_ventas"("tipoCancelacion");

-- CreateIndex
CREATE INDEX "cancelaciones_ventas_tipoDevolucion_idx" ON "cancelaciones_ventas"("tipoDevolucion");

-- CreateIndex
CREATE INDEX "cancelaciones_ventas_estado_idx" ON "cancelaciones_ventas"("estado");

-- CreateIndex
CREATE INDEX "cancelaciones_ventas_createdBy_idx" ON "cancelaciones_ventas"("createdBy");

-- CreateIndex
CREATE INDEX "cancelaciones_ventas_updatedBy_idx" ON "cancelaciones_ventas"("updatedBy");

-- CreateIndex
CREATE INDEX "cancelaciones_ventas_aprobadoPor_idx" ON "cancelaciones_ventas"("aprobadoPor");

-- AddForeignKey
ALTER TABLE "cancelaciones_ventas" ADD CONSTRAINT "cancelaciones_ventas_ventaLoteId_fkey" FOREIGN KEY ("ventaLoteId") REFERENCES "ventas_lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelaciones_ventas" ADD CONSTRAINT "cancelaciones_ventas_ventaUnidadCementerioId_fkey" FOREIGN KEY ("ventaUnidadCementerioId") REFERENCES "ventas_unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelaciones_ventas" ADD CONSTRAINT "cancelaciones_ventas_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelaciones_ventas" ADD CONSTRAINT "cancelaciones_ventas_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancelaciones_ventas" ADD CONSTRAINT "cancelaciones_ventas_aprobadoPor_fkey" FOREIGN KEY ("aprobadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
