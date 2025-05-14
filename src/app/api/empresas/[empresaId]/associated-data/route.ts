import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { empresaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener proyectos asociados
    const proyectos = await prisma.proyecto.findMany({
      where: {
        empresaDesarrolladoraId: params.empresaId
      },
      select: {
        id: true,
        nombre: true,
        estado: true
      }
    })

    // Formatear la información
    const proyectosFormateados = proyectos.map(proyecto => 
      `${proyecto.nombre} (${proyecto.estado})`
    )

    return NextResponse.json({
      proyectos: proyectos.length,
      proyectosList: proyectosFormateados
    })
  } catch (error) {
    console.error('Error al obtener datos asociados:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos asociados' },
      { status: 500 }
    )
  }
} 