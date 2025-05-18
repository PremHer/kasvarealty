import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const projectId = params.id

    // Verificar si el proyecto existe y contar sus relaciones
    const project = await prisma.proyecto.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            actividades: true,
            comentarios: true,
            documentos: true,
            unidades: true,
            miembros: true
          }
        }
      }
    })

    if (!project) {
      return new NextResponse('Proyecto no encontrado', { status: 404 })
    }

    // Verificar relaciones activas
    const activeRelations = []

    if (project._count.actividades > 0) {
      activeRelations.push(`Actividades (${project._count.actividades})`)
    }
    if (project._count.comentarios > 0) {
      activeRelations.push(`Comentarios (${project._count.comentarios})`)
    }
    if (project._count.documentos > 0) {
      activeRelations.push(`Documentos (${project._count.documentos})`)
    }
    if (project._count.unidades > 0) {
      activeRelations.push(`Unidades inmobiliarias (${project._count.unidades})`)
    }
    if (project._count.miembros > 0) {
      activeRelations.push(`Miembros del proyecto (${project._count.miembros})`)
    }

    if (activeRelations.length > 0) {
      return new NextResponse(
        JSON.stringify({
          error: `No se puede eliminar el proyecto "${project.nombre}" porque tiene las siguientes relaciones activas:\n\n${activeRelations.join('\n')}`
        }),
        { status: 409 }
      )
    }

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Error al verificar relaciones del proyecto:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 