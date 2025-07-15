import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

// Función helper para registrar eventos de auditoría
export async function registrarEvento(
  tipo: string,
  accion: string,
  detalles?: string,
  entidad?: string,
  entidadId?: string,
  ip?: string,
  userAgent?: string
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return

    await prisma.auditoria.create({
      data: {
        tipo,
        accion,
        detalles: detalles || null,
        entidad: entidad || null,
        entidadId: entidadId || null,
        ip: ip || null,
        userAgent: userAgent || null,
        usuarioId: session.user.id,
        fecha: new Date()
      }
    })
  } catch (error) {
    console.error('Error al registrar evento de auditoría:', error)
  }
} 