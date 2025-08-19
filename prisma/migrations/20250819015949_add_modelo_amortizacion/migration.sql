-- CreateEnum
CREATE TYPE "ModeloAmortizacion" AS ENUM ('FRANCES', 'ALEMAN', 'JAPONES');

-- AlterTable
ALTER TABLE "ventas_lotes" ADD COLUMN     "modeloAmortizacion" "ModeloAmortizacion" DEFAULT 'FRANCES';

-- AlterTable
ALTER TABLE "ventas_unidades_cementerio" ADD COLUMN     "modeloAmortizacion" "ModeloAmortizacion" DEFAULT 'FRANCES';
