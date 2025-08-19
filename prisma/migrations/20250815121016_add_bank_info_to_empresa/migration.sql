-- AlterTable
ALTER TABLE "cuotas" ADD COLUMN     "diasVencidos" INTEGER DEFAULT 0,
ADD COLUMN     "interesMora" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "empresas_desarrolladoras" ADD COLUMN     "bancoPrincipal" TEXT,
ADD COLUMN     "cci" TEXT,
ADD COLUMN     "emailPagos" TEXT,
ADD COLUMN     "numeroCuenta" TEXT,
ADD COLUMN     "tipoCuenta" TEXT,
ADD COLUMN     "titularCuenta" TEXT;

-- AlterTable
ALTER TABLE "ventas_lotes" ADD COLUMN     "tasaMora" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "ventas_unidades_cementerio" ADD COLUMN     "tasaMora" DOUBLE PRECISION DEFAULT 0;
