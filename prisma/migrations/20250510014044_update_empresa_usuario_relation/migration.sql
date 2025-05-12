/*
  Warnings:

  - You are about to drop the column `empresaDesarrolladoraId` on the `Usuario` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_empresaDesarrolladoraId_fkey";

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "empresaDesarrolladoraId";
