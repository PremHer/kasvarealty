-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_empresaDesarrolladoraId_fkey";

-- AlterTable
ALTER TABLE "EmpresaDesarrolladora" ALTER COLUMN "bancos" DROP DEFAULT,
ALTER COLUMN "billeterasVirtuales" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaDesarrolladoraId_fkey" FOREIGN KEY ("empresaDesarrolladoraId") REFERENCES "EmpresaDesarrolladora"("id") ON DELETE SET NULL ON UPDATE CASCADE;
