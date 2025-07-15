-- AlterTable
ALTER TABLE "comprobantes_pago" ADD COLUMN     "guardadoLocal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "localFilePath" TEXT,
ALTER COLUMN "driveFileId" DROP NOT NULL,
ALTER COLUMN "driveFileUrl" DROP NOT NULL;
