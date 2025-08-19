-- CreateTable
CREATE TABLE "caracteristicas_proyecto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "proyectoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caracteristicas_proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "caracteristicas_proyecto_proyectoId_idx" ON "caracteristicas_proyecto"("proyectoId");

-- CreateIndex
CREATE INDEX "caracteristicas_proyecto_orden_idx" ON "caracteristicas_proyecto"("orden");

-- AddForeignKey
ALTER TABLE "caracteristicas_proyecto" ADD CONSTRAINT "caracteristicas_proyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
