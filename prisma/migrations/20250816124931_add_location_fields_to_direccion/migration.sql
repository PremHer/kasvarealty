/*
  Warnings:

  - You are about to drop the column `ciudad` on the `direcciones` table. All the data in the column will be lost.
  - Added the required column `departamento` to the `direcciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distrito` to the `direcciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provincia` to the `direcciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Primero agregar las columnas con valores por defecto
ALTER TABLE "direcciones" ADD COLUMN "departamento" TEXT DEFAULT 'Lima';
ALTER TABLE "direcciones" ADD COLUMN "distrito" TEXT DEFAULT 'Lima';
ALTER TABLE "direcciones" ADD COLUMN "provincia" TEXT DEFAULT 'Lima';

-- Hacer las columnas NOT NULL después de llenarlas
ALTER TABLE "direcciones" ALTER COLUMN "departamento" SET NOT NULL;
ALTER TABLE "direcciones" ALTER COLUMN "distrito" SET NOT NULL;
ALTER TABLE "direcciones" ALTER COLUMN "provincia" SET NOT NULL;

-- Remover los valores por defecto
ALTER TABLE "direcciones" ALTER COLUMN "departamento" DROP DEFAULT;
ALTER TABLE "direcciones" ALTER COLUMN "distrito" DROP DEFAULT;
ALTER TABLE "direcciones" ALTER COLUMN "provincia" DROP DEFAULT;

-- Finalmente eliminar la columna ciudad
ALTER TABLE "direcciones" DROP COLUMN "ciudad";
