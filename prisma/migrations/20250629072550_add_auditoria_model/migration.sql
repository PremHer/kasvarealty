-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalles" TEXT,
    "entidad" TEXT,
    "entidadId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaLectura" TIMESTAMP(3),
    "usuarioId" TEXT NOT NULL,
    "creadoPorId" TEXT,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Auditoria_fecha_idx" ON "Auditoria"("fecha");

-- CreateIndex
CREATE INDEX "Auditoria_tipo_idx" ON "Auditoria"("tipo");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_idx" ON "Auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "Auditoria_entidad_entidadId_idx" ON "Auditoria"("entidad", "entidadId");

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
