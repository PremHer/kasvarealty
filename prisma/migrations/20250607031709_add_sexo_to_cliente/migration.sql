/*
  Warnings:

  - You are about to drop the column `direccion` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `empresaId` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `Cliente` table. All the data in the column will be lost.
  - The `estadoCivil` column on the `Cliente` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `tipo` on the `Cliente` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMENINO');

-- CreateEnum
CREATE TYPE "TipoDireccion" AS ENUM ('NACIONAL', 'EXTRANJERA');

-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_creadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_empresaId_fkey";

-- DropIndex
DROP INDEX "Cliente_dni_key";

-- DropIndex
DROP INDEX "Cliente_empresaId_idx";

-- DropIndex
DROP INDEX "Cliente_ruc_key";

-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "direccion",
DROP COLUMN "empresaId",
DROP COLUMN "estado",
ADD COLUMN     "sexo" "Sexo",
ALTER COLUMN "tipo" TYPE "TipoCliente" USING tipo::text::"TipoCliente",
ALTER COLUMN "estadoCivil" TYPE "EstadoCivil" USING "estadoCivil"::text::"EstadoCivil",
ALTER COLUMN "creadoPorId" DROP NOT NULL;

-- DropEnum
DROP TYPE "EstadoCliente";

-- CreateTable
CREATE TABLE "Direccion" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDireccion" NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "referencia" TEXT,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Direccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Direccion_clienteId_idx" ON "Direccion"("clienteId");

-- CreateIndex
CREATE INDEX "Cliente_email_idx" ON "Cliente"("email");

-- CreateIndex
CREATE INDEX "Cliente_ruc_idx" ON "Cliente"("ruc");

-- CreateIndex
CREATE INDEX "Cliente_dni_idx" ON "Cliente"("dni");

-- AddForeignKey
ALTER TABLE "Direccion" ADD CONSTRAINT "Direccion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
