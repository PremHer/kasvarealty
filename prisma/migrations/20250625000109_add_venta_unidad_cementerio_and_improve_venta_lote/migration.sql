/*
  Warnings:

  - You are about to drop the column `createdBy` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the `Actividad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comentario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Direccion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Documento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Proyecto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UnidadInmobiliaria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Venta` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `manzanaId` to the `ventas_lotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proyectoId` to the `ventas_lotes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendedorId` to the `ventas_lotes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoVentaUnidadCementerio" AS ENUM ('PENDIENTE', 'APROBADA', 'CANCELADA', 'ENTREGADA');

-- DropForeignKey
ALTER TABLE "Actividad" DROP CONSTRAINT "Actividad_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "Actividad" DROP CONSTRAINT "Actividad_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_creadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Comentario" DROP CONSTRAINT "Comentario_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "Comentario" DROP CONSTRAINT "Comentario_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Direccion" DROP CONSTRAINT "Direccion_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Documento" DROP CONSTRAINT "Documento_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "Documento" DROP CONSTRAINT "Documento_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Proyecto" DROP CONSTRAINT "Proyecto_aprobadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Proyecto" DROP CONSTRAINT "Proyecto_creadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Proyecto" DROP CONSTRAINT "Proyecto_empresaDesarrolladoraId_fkey";

-- DropForeignKey
ALTER TABLE "Proyecto" DROP CONSTRAINT "Proyecto_gerenteId_fkey";

-- DropForeignKey
ALTER TABLE "UnidadInmobiliaria" DROP CONSTRAINT "UnidadInmobiliaria_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_unidadInmobiliariaId_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectMembers" DROP CONSTRAINT "_ProjectMembers_A_fkey";

-- DropForeignKey
ALTER TABLE "manzanas" DROP CONSTRAINT "manzanas_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "pabellones" DROP CONSTRAINT "pabellones_proyectoId_fkey";

-- DropForeignKey
ALTER TABLE "ventas_lotes" DROP CONSTRAINT "ventas_lotes_clienteId_fkey";

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "createdBy",
DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry",
DROP COLUMN "updatedBy",
ALTER COLUMN "rol" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ventas_lotes" ADD COLUMN     "aprobadorId" TEXT,
ADD COLUMN     "fechaAprobacion" TIMESTAMP(3),
ADD COLUMN     "manzanaId" TEXT NOT NULL,
ADD COLUMN     "metodoPago" TEXT,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "proyectoId" TEXT NOT NULL,
ADD COLUMN     "vendedorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Actividad";

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "Comentario";

-- DropTable
DROP TABLE "Direccion";

-- DropTable
DROP TABLE "Documento";

-- DropTable
DROP TABLE "Proyecto";

-- DropTable
DROP TABLE "UnidadInmobiliaria";

-- DropTable
DROP TABLE "Venta";

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProyecto" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "empresaDesarrolladoraId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'DRAFT',
    "gerenteId" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "aprobadoPorId" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "razonRechazo" TEXT,
    "areaTotal" DOUBLE PRECISION,
    "areaUtil" DOUBLE PRECISION,
    "cantidadUnidades" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departamento" TEXT,
    "distrito" TEXT,
    "inversion_actual" DOUBLE PRECISION,
    "inversion_inicial" DOUBLE PRECISION,
    "inversion_total" DOUBLE PRECISION,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "precio_terreno" DOUBLE PRECISION,
    "provincia" TEXT,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_inmobiliarias" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" "EstadoUnidad" NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_inmobiliarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "unidadInmobiliariaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "fechaVenta" TIMESTAMP(3) NOT NULL,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoVenta" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direcciones" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDireccion" NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "referencia" TEXT,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "dni" TEXT,
    "ruc" TEXT,
    "tipoCliente" "TipoCliente" NOT NULL DEFAULT 'INDIVIDUAL',
    "estadoCivil" "EstadoCivil",
    "sexo" "Sexo",
    "fechaNacimiento" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_unidades_cementerio" (
    "id" TEXT NOT NULL,
    "unidadCementerioId" TEXT NOT NULL,
    "pabellonId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "aprobadorId" TEXT,
    "fechaVenta" TIMESTAMP(3) NOT NULL,
    "fechaAprobacion" TIMESTAMP(3),
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoVentaUnidadCementerio" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "ventas_unidades_cementerio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proyectos_latitud_longitud_idx" ON "proyectos"("latitud", "longitud");

-- CreateIndex
CREATE INDEX "proyectos_empresaDesarrolladoraId_idx" ON "proyectos"("empresaDesarrolladoraId");

-- CreateIndex
CREATE INDEX "proyectos_creadoPorId_idx" ON "proyectos"("creadoPorId");

-- CreateIndex
CREATE INDEX "proyectos_aprobadoPorId_idx" ON "proyectos"("aprobadoPorId");

-- CreateIndex
CREATE INDEX "proyectos_gerenteId_idx" ON "proyectos"("gerenteId");

-- CreateIndex
CREATE INDEX "proyectos_tipo_idx" ON "proyectos"("tipo");

-- CreateIndex
CREATE INDEX "proyectos_estado_idx" ON "proyectos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_inmobiliarias_codigo_key" ON "unidades_inmobiliarias"("codigo");

-- CreateIndex
CREATE INDEX "unidades_inmobiliarias_proyectoId_idx" ON "unidades_inmobiliarias"("proyectoId");

-- CreateIndex
CREATE INDEX "ventas_clienteId_idx" ON "ventas"("clienteId");

-- CreateIndex
CREATE INDEX "ventas_unidadInmobiliariaId_idx" ON "ventas"("unidadInmobiliariaId");

-- CreateIndex
CREATE INDEX "ventas_estado_idx" ON "ventas"("estado");

-- CreateIndex
CREATE INDEX "ventas_fechaVenta_idx" ON "ventas"("fechaVenta");

-- CreateIndex
CREATE INDEX "direcciones_clienteId_idx" ON "direcciones"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_dni_key" ON "clientes"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_ruc_key" ON "clientes"("ruc");

-- CreateIndex
CREATE INDEX "clientes_createdBy_idx" ON "clientes"("createdBy");

-- CreateIndex
CREATE INDEX "clientes_updatedBy_idx" ON "clientes"("updatedBy");

-- CreateIndex
CREATE INDEX "clientes_isActive_idx" ON "clientes"("isActive");

-- CreateIndex
CREATE INDEX "clientes_email_idx" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "clientes_dni_idx" ON "clientes"("dni");

-- CreateIndex
CREATE INDEX "clientes_ruc_idx" ON "clientes"("ruc");

-- CreateIndex
CREATE INDEX "actividades_proyectoId_idx" ON "actividades"("proyectoId");

-- CreateIndex
CREATE INDEX "actividades_usuarioId_idx" ON "actividades"("usuarioId");

-- CreateIndex
CREATE INDEX "comentarios_proyectoId_idx" ON "comentarios"("proyectoId");

-- CreateIndex
CREATE INDEX "comentarios_usuarioId_idx" ON "comentarios"("usuarioId");

-- CreateIndex
CREATE INDEX "documentos_proyectoId_idx" ON "documentos"("proyectoId");

-- CreateIndex
CREATE INDEX "documentos_usuarioId_idx" ON "documentos"("usuarioId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_unidadCementerioId_idx" ON "ventas_unidades_cementerio"("unidadCementerioId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_pabellonId_idx" ON "ventas_unidades_cementerio"("pabellonId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_proyectoId_idx" ON "ventas_unidades_cementerio"("proyectoId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_clienteId_idx" ON "ventas_unidades_cementerio"("clienteId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_vendedorId_idx" ON "ventas_unidades_cementerio"("vendedorId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_aprobadorId_idx" ON "ventas_unidades_cementerio"("aprobadorId");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_createdBy_idx" ON "ventas_unidades_cementerio"("createdBy");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_updatedBy_idx" ON "ventas_unidades_cementerio"("updatedBy");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_estado_idx" ON "ventas_unidades_cementerio"("estado");

-- CreateIndex
CREATE INDEX "ventas_unidades_cementerio_fechaVenta_idx" ON "ventas_unidades_cementerio"("fechaVenta");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_empresaDesarrolladoraId_idx" ON "usuarios"("empresaDesarrolladoraId");

-- CreateIndex
CREATE INDEX "usuarios_isActive_idx" ON "usuarios"("isActive");

-- CreateIndex
CREATE INDEX "ventas_lotes_manzanaId_idx" ON "ventas_lotes"("manzanaId");

-- CreateIndex
CREATE INDEX "ventas_lotes_proyectoId_idx" ON "ventas_lotes"("proyectoId");

-- CreateIndex
CREATE INDEX "ventas_lotes_vendedorId_idx" ON "ventas_lotes"("vendedorId");

-- CreateIndex
CREATE INDEX "ventas_lotes_aprobadorId_idx" ON "ventas_lotes"("aprobadorId");

-- CreateIndex
CREATE INDEX "ventas_lotes_estado_idx" ON "ventas_lotes"("estado");

-- CreateIndex
CREATE INDEX "ventas_lotes_fechaVenta_idx" ON "ventas_lotes"("fechaVenta");

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_empresaDesarrolladoraId_fkey" FOREIGN KEY ("empresaDesarrolladoraId") REFERENCES "empresas_desarrolladoras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_gerenteId_fkey" FOREIGN KEY ("gerenteId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "unidades_inmobiliarias" ADD CONSTRAINT "unidades_inmobiliarias_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_unidadInmobiliariaId_fkey" FOREIGN KEY ("unidadInmobiliariaId") REFERENCES "unidades_inmobiliarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manzanas" ADD CONSTRAINT "manzanas_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_manzanaId_fkey" FOREIGN KEY ("manzanaId") REFERENCES "manzanas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_lotes" ADD CONSTRAINT "ventas_lotes_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio" ADD CONSTRAINT "ventas_unidades_cementerio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio" ADD CONSTRAINT "ventas_unidades_cementerio_unidadCementerioId_fkey" FOREIGN KEY ("unidadCementerioId") REFERENCES "unidades_cementerio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio" ADD CONSTRAINT "ventas_unidades_cementerio_pabellonId_fkey" FOREIGN KEY ("pabellonId") REFERENCES "pabellones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio" ADD CONSTRAINT "ventas_unidades_cementerio_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio" ADD CONSTRAINT "ventas_unidades_cementerio_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio" ADD CONSTRAINT "ventas_unidades_cementerio_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio" ADD CONSTRAINT "ventas_unidades_cementerio_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_unidades_cementerio" ADD CONSTRAINT "ventas_unidades_cementerio_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pabellones" ADD CONSTRAINT "pabellones_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectMembers" ADD CONSTRAINT "_ProjectMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
