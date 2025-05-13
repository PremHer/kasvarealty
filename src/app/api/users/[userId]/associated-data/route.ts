import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener proyectos asociados
    const proyectos = await prisma.proyecto.findMany({
      where: {
        OR: [
          { gerenteId: params.userId },
          { miembros: { some: { id: params.userId } } }
        ]
      },
      select: {
        nombre: true
      }
    })

    // Obtener ventas asociadas
    const ventas = await prisma.venta.findMany({
      where: {
        unidadInmobiliaria: {
          proyecto: {
            OR: [
              { gerenteId: params.userId },
              { miembros: { some: { id: params.userId } } }
            ]
          }
        }
      },
      select: {
        id: true,
        fechaVenta: true,
        precioVenta: true,
        unidadInmobiliaria: {
          select: {
            tipo: true,
            proyecto: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    })

    // Obtener actividades asociadas
    const actividades = await prisma.actividad.findMany({
      where: {
        usuarioId: params.userId
      },
      select: {
        tipo: true,
        descripcion: true,
        proyecto: {
          select: {
            nombre: true
          }
        }
      }
    })

    // Formatear la información
    const ventasFormateadas = ventas.map(venta => 
      `Venta #${venta.id} - ${new Date(venta.fechaVenta).toLocaleDateString()} - $${venta.precioVenta} - ${venta.unidadInmobiliaria.tipo} - ${venta.unidadInmobiliaria.proyecto.nombre}`
    )

    const actividadesFormateadas = actividades.map(actividad =>
      `${actividad.tipo} - ${actividad.descripcion} - ${actividad.proyecto.nombre}`
    )

    return NextResponse.json({
      proyectos: proyectos.length,
      proyectosList: proyectos.map(p => p.nombre),
      ventas: ventas.length,
      ventasList: ventasFormateadas,
      actividades: actividades.length,
      actividadesList: actividadesFormateadas
    })
  } catch (error) {
    console.error('Error al obtener datos asociados:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos asociados' },
      { status: 500 }
    )
  }
} 