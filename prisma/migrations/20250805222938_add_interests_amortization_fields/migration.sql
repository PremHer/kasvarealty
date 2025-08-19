-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoVentaLote" ADD VALUE 'VIGENTE';
ALTER TYPE "EstadoVentaLote" ADD VALUE 'FINALIZADA';
ALTER TYPE "EstadoVentaLote" ADD VALUE 'REVERTIDA';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoVentaUnidadCementerio" ADD VALUE 'VIGENTE';
ALTER TYPE "EstadoVentaUnidadCementerio" ADD VALUE 'FINALIZADA';
ALTER TYPE "EstadoVentaUnidadCementerio" ADD VALUE 'REVERTIDA';

-- AlterTable
ALTER TABLE "cuotas" ADD COLUMN     "montoCapital" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "montoInteres" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "saldoCapitalAnterior" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "saldoCapitalPosterior" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "ventas_lotes" ADD COLUMN     "montoCapital" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "montoIntereses" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "saldoCapital" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tasaInteres" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "ventas_unidades_cementerio" ADD COLUMN     "montoCapital" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "montoIntereses" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "saldoCapital" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tasaInteres" DOUBLE PRECISION DEFAULT 0;
