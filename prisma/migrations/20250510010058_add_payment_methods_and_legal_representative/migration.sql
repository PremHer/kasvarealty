/*
  Warnings:

  - You are about to drop the column `representanteLegal` on the `EmpresaDesarrolladora` table. All the data in the column will be lost.
  - Added the required column `representanteLegalId` to the `EmpresaDesarrolladora` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoBanco" AS ENUM ('BCP', 'BBVA', 'INTERBANK', 'SCOTIABANK', 'BANBIF', 'MIBANCO', 'BANCO_PICHINCHA', 'BANCO_GNB', 'BANCO_FALABELLA', 'BANCO_RIPLEY');

-- CreateEnum
CREATE TYPE "TipoBilleteraVirtual" AS ENUM ('YAPE', 'PLIN', 'TUNKI', 'AGRARIO', 'BIM');

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "empresaDesarrolladoraId" DROP NOT NULL;

-- Actualizar la tabla EmpresaDesarrolladora
ALTER TABLE "EmpresaDesarrolladora" 
ADD COLUMN "bancos" "TipoBanco"[] DEFAULT '{}',
ADD COLUMN "billeterasVirtuales" "TipoBilleteraVirtual"[] DEFAULT '{}',
ADD COLUMN "numeroProyectos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "representanteLegalId" TEXT;

-- Crear un usuario temporal como representante legal y actualizar la empresa
WITH temp_user AS (
  INSERT INTO "Usuario" (
    id, 
    nombre, 
    email, 
    password, 
    rol,
    "createdAt", 
    "updatedAt", 
    "isActive"
  )
  VALUES (
    'temp_rep_legal',
    'Representante Legal Temporal',
    'temp_rep_legal@temp.com',
    'temp_password',
    'GERENTE_GENERAL',
    NOW(),
    NOW(),
    true
  )
  RETURNING id
)
UPDATE "EmpresaDesarrolladora"
SET "representanteLegalId" = 'temp_rep_legal';

-- Hacer la columna NOT NULL después de asignar el valor
ALTER TABLE "EmpresaDesarrolladora" 
ALTER COLUMN "representanteLegalId" SET NOT NULL;

-- Eliminar la columna representanteLegal
ALTER TABLE "EmpresaDesarrolladora" DROP COLUMN "representanteLegal";

-- AddForeignKey
ALTER TABLE "EmpresaDesarrolladora" ADD CONSTRAINT "EmpresaDesarrolladora_representanteLegalId_fkey" FOREIGN KEY ("representanteLegalId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
