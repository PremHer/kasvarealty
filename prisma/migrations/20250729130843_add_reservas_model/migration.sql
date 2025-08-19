/*
  Warnings:

  - You are about to drop the column `fechaEntrega` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `fechaFirma` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `fechaInscripcion` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `lugarFirma` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `notario` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `numeroEscritura` on the `contratos` table. All the data in the column will be lost.
  - You are about to drop the column `registroPublico` on the `contratos` table. All the data in the column will be lost.
  - You are about to alter the column `precioTotal` on the `contratos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `montoInicial` on the `contratos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `saldoPendiente` on the `contratos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `montoCuota` on the `contratos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `fechaNacimiento` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `sexo` on the `usuarios` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'CONVERTIDA', 'EXPIRADA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "contratos" DROP CONSTRAINT "contratos_ventaLoteId_fkey";

-- DropForeignKey
ALTER TABLE "contratos" DROP CONSTRAINT "contratos_ventaUnidadCementerioId_fkey";

-- DropIndex
DROP INDEX "contratos_createdBy_idx";

-- DropIndex
DROP INDEX "contratos_estado_idx";

-- DropIndex
DROP INDEX "contratos_tipoContrato_idx";

-- DropIndex
DROP INDEX "contratos_updatedBy_idx";

-- DropIndex
DROP INDEX "contratos_ventaLoteId_idx";

-- DropIndex
DROP INDEX "contratos_ventaUnidadCementerioId_idx";

-- AlterTable
ALTER TABLE "contratos" DROP COLUMN "fechaEntrega",
DROP COLUMN "fechaFirma",
DROP COLUMN "fechaInscripcion",
DROP COLUMN "lugarFirma",
DROP COLUMN "notario",
DROP COLUMN "numeroEscritura",
DROP COLUMN "registroPublico",
ALTER COLUMN "fechaContrato" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "precioTotal" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "montoInicial" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "saldoPendiente" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "montoCuota" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "fechaNacimiento",
DROP COLUMN "sexo";

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "numeroReserva" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "loteId" TEXT,
    "unidadCementerioId" TEXT,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "montoReserva" DECIMAL(10,2) NOT NULL,
    "fechaReserva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "ventaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservas_numeroReserva_key" ON "reservas"("numeroReserva");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_ventaLoteId_fkey" FOREIGN KEY ("ventaLoteId") REFERENCES "ventas_lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_ventaUnidadCementerioId_fkey" FOREIGN KEY ("ventaUnidadCementerioId") REFERENCES "ventas_unidades_cementerio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_unidadCementerioId_fkey" FOREIGN KEY ("unidadCementerioId") REFERENCES "unidades_cementerio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas_lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
