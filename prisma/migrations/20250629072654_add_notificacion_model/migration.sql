-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fechaLectura" TIMESTAMP(3),
    "destinatarios" TEXT[],
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT,
    "creadoPorId" TEXT,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacion_fecha_idx" ON "Notificacion"("fecha");

-- CreateIndex
CREATE INDEX "Notificacion_tipo_idx" ON "Notificacion"("tipo");

-- CreateIndex
CREATE INDEX "Notificacion_usuarioId_idx" ON "Notificacion"("usuarioId");

-- CreateIndex
CREATE INDEX "Notificacion_leida_idx" ON "Notificacion"("leida");

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
