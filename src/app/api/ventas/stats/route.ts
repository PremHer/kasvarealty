import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles permitidos para ver estadísticas de ventas
const SALES_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER', 
  'SALES_REP',
  'SALES_ASSISTANT',
  'GERENTE_GENERAL'
]

// GET /api/ventas/stats - Obtener estadísticas de ventas
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver estadísticas de ventas
    if (!SALES_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver estadísticas de ventas' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const proyectoId = searchParams.get('proyectoId')

    // Construir filtros según el rol del usuario
    let whereClause: any = {}

    // Filtrar por proyecto si se especifica
    if (proyectoId) {
      whereClause.proyectoId = proyectoId
    }

    if (userRole === 'SALES_REP') {
      // Sales Rep solo ve sus propias ventas
      whereClause.vendedorId = session.user.id
    } else if (userRole === 'GERENTE_GENERAL') {
      // Si se especifica un proyectoId, verificar que el gerente general tenga acceso a ese proyecto
      if (proyectoId) {
        // Verificar que el proyecto pertenezca a una empresa donde el gerente es representante legal
        const proyecto = await prisma.proyecto.findFirst({
          where: {
            id: proyectoId,
            empresaDesarrolladora: {
              representanteLegalId: session.user.id
            }
          }
        })
        
        if (!proyecto) {
          return NextResponse.json({ error: 'No tienes permisos para ver las estadísticas de este proyecto' }, { status: 403 })
        }
        
        // Si tiene acceso, usar el proyectoId especificado
        whereClause.proyectoId = proyectoId
      } else {
        // Si no se especifica proyectoId, filtrar por todos los proyectos del gerente general
        const empresasGerente = await prisma.empresaDesarrolladora.findMany({
          where: {
            representanteLegalId: session.user.id
          },
          select: {
            id: true
          }
        })
        
        const empresaIds = empresasGerente.map(e => e.id)
        if (empresaIds.length > 0) {
          // Obtener proyectos de estas empresas
          const proyectosGerente = await prisma.proyecto.findMany({
            where: {
              empresaDesarrolladoraId: {
                in: empresaIds
              }
            },
            select: {
              id: true
            }
          })
          
          const proyectoIds = proyectosGerente.map(p => p.id)
          if (proyectoIds.length > 0) {
            whereClause.proyectoId = {
              in: proyectoIds
            }
          } else {
            // Si no tiene proyectos en sus empresas, retornar estadísticas vacías
            return NextResponse.json({
              totalVentas: 0,
              ventasPendientes: 0,
              ventasAprobadas: 0,
              montoTotal: 0,
              ventasCuotas: 0,
              cuotasPendientes: 0,
              cuotasVencidas: 0,
              detalles: {
                lotes: { total: 0, pendientes: 0, aprobadas: 0, monto: 0 },
                unidadesCementerio: { total: 0, pendientes: 0, aprobadas: 0, monto: 0 }
              }
            })
          }
        } else {
          // Si no tiene empresas como representante legal, retornar estadísticas vacías
          return NextResponse.json({
            totalVentas: 0,
            ventasPendientes: 0,
            ventasAprobadas: 0,
            montoTotal: 0,
            ventasCuotas: 0,
            cuotasPendientes: 0,
            cuotasVencidas: 0,
            detalles: {
              lotes: { total: 0, pendientes: 0, aprobadas: 0, monto: 0 },
              unidadesCementerio: { total: 0, pendientes: 0, aprobadas: 0, monto: 0 }
            }
          })
        }
      }
    }
    // SUPER_ADMIN, SALES_MANAGER y SALES_ASSISTANT ven todas las ventas

    // Obtener estadísticas de ventas de lotes
    const [
      totalVentasLotes,
      ventasPendientesLotes,
      ventasAprobadasLotes,
      montoTotalLotes
    ] = await Promise.all([
      prisma.ventaLote.count({ where: whereClause }),
      prisma.ventaLote.count({ where: { ...whereClause, estado: 'PENDIENTE' } }),
      prisma.ventaLote.count({ where: { ...whereClause, estado: 'APROBADA' } }),
      prisma.ventaLote.aggregate({
        where: { ...whereClause, estado: 'APROBADA' },
        _sum: { precioVenta: true }
      })
    ])

    // Obtener estadísticas de ventas de unidades de cementerio
    const [
      totalVentasUnidades,
      ventasPendientesUnidades,
      ventasAprobadasUnidades,
      montoTotalUnidades
    ] = await Promise.all([
      prisma.ventaUnidadCementerio.count({ where: whereClause }),
      prisma.ventaUnidadCementerio.count({ where: { ...whereClause, estado: 'PENDIENTE' } }),
      prisma.ventaUnidadCementerio.count({ where: { ...whereClause, estado: 'APROBADA' } }),
      prisma.ventaUnidadCementerio.aggregate({
        where: { ...whereClause, estado: 'APROBADA' },
        _sum: { precioVenta: true }
      })
    ])

    // Calcular totales
    const totalVentas = totalVentasLotes + totalVentasUnidades
    const ventasPendientes = ventasPendientesLotes + ventasPendientesUnidades
    const ventasAprobadas = ventasAprobadasLotes + ventasAprobadasUnidades
    const montoTotal = (montoTotalLotes._sum.precioVenta || 0) + (montoTotalUnidades._sum.precioVenta || 0)

    // Obtener estadísticas de cuotas
    const [
      ventasCuotasLotes,
      ventasCuotasUnidades,
      cuotasPendientesLotes,
      cuotasPendientesUnidades,
      cuotasVencidasLotes,
      cuotasVencidasUnidades
    ] = await Promise.all([
      // Ventas a cuotas (lotes)
      prisma.ventaLote.count({
        where: {
          ...whereClause,
          tipoVenta: 'CUOTAS'
        }
      }),
      // Ventas a cuotas (unidades cementerio)
      prisma.ventaUnidadCementerio.count({
        where: {
          ...whereClause,
          tipoVenta: 'CUOTAS'
        }
      }),
      // Cuotas pendientes (lotes)
      prisma.cuota.count({
        where: {
          estado: 'PENDIENTE',
          ventaLote: whereClause
        }
      }),
      // Cuotas pendientes (unidades cementerio)
      prisma.cuota.count({
        where: {
          estado: 'PENDIENTE',
          ventaUnidadCementerio: whereClause
        }
      }),
      // Cuotas vencidas (lotes)
      prisma.cuota.count({
        where: {
          estado: 'VENCIDA',
          ventaLote: whereClause
        }
      }),
      // Cuotas vencidas (unidades cementerio)
      prisma.cuota.count({
        where: {
          estado: 'VENCIDA',
          ventaUnidadCementerio: whereClause
        }
      })
    ])

    // Calcular totales de cuotas
    const ventasCuotas = ventasCuotasLotes + ventasCuotasUnidades
    const cuotasPendientes = cuotasPendientesLotes + cuotasPendientesUnidades
    const cuotasVencidas = cuotasVencidasLotes + cuotasVencidasUnidades

    return NextResponse.json({
      totalVentas,
      ventasPendientes,
      ventasAprobadas,
      montoTotal,
      ventasCuotas,
      cuotasPendientes,
      cuotasVencidas,
      detalles: {
        lotes: {
          total: totalVentasLotes,
          pendientes: ventasPendientesLotes,
          aprobadas: ventasAprobadasLotes,
          monto: montoTotalLotes._sum.precioVenta || 0
        },
        unidadesCementerio: {
          total: totalVentasUnidades,
          pendientes: ventasPendientesUnidades,
          aprobadas: ventasAprobadasUnidades,
          monto: montoTotalUnidades._sum.precioVenta || 0
        }
      }
    })

  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 