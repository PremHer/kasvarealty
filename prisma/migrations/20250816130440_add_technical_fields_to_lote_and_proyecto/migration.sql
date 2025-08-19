-- AlterTable
ALTER TABLE "lotes" ADD COLUMN     "perimetro" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "proyectos" ADD COLUMN     "extensionTotal" DOUBLE PRECISION,
ADD COLUMN     "partidaRegistral" TEXT,
ADD COLUMN     "plazoIndependizacion" INTEGER,
ADD COLUMN     "unidadCatastral" TEXT;
