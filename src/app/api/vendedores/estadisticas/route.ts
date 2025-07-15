import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles permitidos para gestión de vendedores
const VENDOR_MANAGEMENT_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER',
  'GERENTE_GENERAL'
]

// GET /api/vendedores/estadisticas - Obtener estadísticas detalladas de vendedores
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver estadísticas de vendedores
    if (!VENDOR_MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver estadísticas de vendedores' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const vendedorId = searchParams.get('vendedorId')
    const empresaId = searchParams.get('empresaId')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    // Construir filtros
    const whereVentas: any = {}
    if (vendedorId) {
      whereVentas.vendedorId = vendedorId
    }
    if (fechaInicio && fechaFin) {
      whereVentas.fechaVenta = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    }

    // Obtener vendedores con estadísticas
    const vendedores = await prisma.perfilVendedor.findMany({
      where: {
        estado: 'ACTIVO'
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            isActive: true
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      },
      orderBy: {
        usuario: {
          nombre: 'asc'
        }
      }
    })

    // Obtener estadísticas para cada vendedor
    const estadisticasVendedores = await Promise.all(
      vendedores.map(async (vendedor) => {
        // Ventas de lotes (todas para contar total)
        const ventasLotes = await prisma.ventaLote.findMany({
          where: {
            ...whereVentas,
            vendedorId: vendedor.usuarioId
          },
          select: {
            id: true,
            precioVenta: true,
            estado: true,
            fechaVenta: true,
            comisionVendedor: true
          }
        })

        // Ventas de unidades de cementerio (todas para contar total)
        const ventasUnidades = await prisma.ventaUnidadCementerio.findMany({
          where: {
            ...whereVentas,
            vendedorId: vendedor.usuarioId
          },
          select: {
            id: true,
            precioVenta: true,
            estado: true,
            fechaVenta: true,
            comisionVendedor: true
          }
        })

        // Filtrar solo ventas aprobadas para ingresos y comisiones
        const ventasLotesAprobadas = ventasLotes.filter(venta => venta.estado === 'APROBADA')
        const ventasUnidadesAprobadas = ventasUnidades.filter(venta => venta.estado === 'APROBADA')

        // Calcular estadísticas
        const totalVentas = ventasLotes.length + ventasUnidades.length
        const totalVentasLotes = ventasLotes.length
        const totalVentasUnidades = ventasUnidades.length
        
        // Solo considerar ventas aprobadas para ingresos
        const totalIngresos = ventasLotesAprobadas.reduce((sum, venta) => sum + venta.precioVenta, 0) +
                             ventasUnidadesAprobadas.reduce((sum, venta) => sum + venta.precioVenta, 0)

        // Solo considerar ventas aprobadas para comisiones
        const comisionTotal = ventasLotesAprobadas.reduce((sum, venta) => sum + (venta.comisionVendedor || 0), 0) +
                             ventasUnidadesAprobadas.reduce((sum, venta) => sum + (venta.comisionVendedor || 0), 0)

        // Organizar ventas por tipo de proyecto (solo aprobadas para ingresos y comisiones)
        const ventasPorTipoProyecto = {
          lotizacion: {
            nombre: 'Lotes',
            tipo: 'LOTIZACIÓN',
            cantidad: totalVentasLotes,
            ingresos: ventasLotesAprobadas.reduce((sum, venta) => sum + venta.precioVenta, 0),
            comisiones: ventasLotesAprobadas.reduce((sum, venta) => sum + (venta.comisionVendedor || 0), 0),
            color: 'blue'
          },
          cementerio: {
            nombre: 'Unidades',
            tipo: 'CEMENTERIO',
            cantidad: totalVentasUnidades,
            ingresos: ventasUnidadesAprobadas.reduce((sum, venta) => sum + venta.precioVenta, 0),
            comisiones: ventasUnidadesAprobadas.reduce((sum, venta) => sum + (venta.comisionVendedor || 0), 0),
            color: 'purple'
          }
          // Aquí se pueden agregar más tipos de proyectos dinámicamente
          // ejemplo:
          // edificio: {
          //   nombre: 'Departamentos',
          //   tipo: 'EDIFICIO',
          //   cantidad: totalVentasDepartamentos,
          //   ingresos: ventasDepartamentosAprobadas.reduce((sum, venta) => sum + venta.precioVenta, 0),
          //   comisiones: ventasDepartamentosAprobadas.reduce((sum, venta) => sum + (venta.comisionVendedor || 0), 0),
          //   color: 'orange'
          // }
        }

        // Calcular estadísticas detalladas de comisiones (solo ventas aprobadas)
        const todasLasVentasAprobadas = [...ventasLotesAprobadas, ...ventasUnidadesAprobadas]
        const comisiones = todasLasVentasAprobadas
          .map(venta => venta.comisionVendedor || 0)
          .filter(comision => comision > 0)
        
        const porcentajesComision = todasLasVentasAprobadas
          .map(venta => venta.precioVenta > 0 ? ((venta.comisionVendedor || 0) / venta.precioVenta) * 100 : 0)
          .filter(porcentaje => porcentaje > 0)

        const estadisticasComision = {
          comisionTotal,
          comisionPromedio: comisiones.length > 0 ? comisiones.reduce((sum, comision) => sum + comision, 0) / comisiones.length : 0,
          comisionMinima: comisiones.length > 0 ? Math.min(...comisiones) : 0,
          comisionMaxima: comisiones.length > 0 ? Math.max(...comisiones) : 0,
          porcentajePromedio: porcentajesComision.length > 0 ? porcentajesComision.reduce((sum, porcentaje) => sum + porcentaje, 0) / porcentajesComision.length : 0,
          porcentajeMinimo: porcentajesComision.length > 0 ? Math.min(...porcentajesComision) : 0,
          porcentajeMaximo: porcentajesComision.length > 0 ? Math.max(...porcentajesComision) : 0,
          ventasConComision: comisiones.length,
          totalVentas: todasLasVentasAprobadas.length
        }

        // Calcular ventas por mes (últimos 12 meses) - todas las ventas para el gráfico
        const ventasPorMes = new Array(12).fill(0)
        const fechaActual = new Date()
        
        ;[...ventasLotes, ...ventasUnidades].forEach(venta => {
          const fechaVenta = new Date(venta.fechaVenta)
          const mesesAtras = fechaActual.getMonth() - fechaVenta.getMonth() + 
                           (fechaActual.getFullYear() - fechaVenta.getFullYear()) * 12
          
          if (mesesAtras >= 0 && mesesAtras < 12) {
            ventasPorMes[mesesAtras] += 1
          }
        })

        // Calcular métricas de rendimiento
        const ventasAprobadas = [...ventasLotes, ...ventasUnidades].filter(
          venta => venta.estado === 'APROBADA'
        ).length

        const ventasPendientes = [...ventasLotes, ...ventasUnidades].filter(
          venta => venta.estado === 'PENDIENTE'
        ).length

        const ventasRechazadas = [...ventasLotes, ...ventasUnidades].filter(
          venta => venta.estado === 'DESAPROBADA'
        ).length

        return {
          vendedor,
          estadisticas: {
            totalVentas,
            totalVentasLotes,
            totalVentasUnidades,
            totalIngresos,
            comisionTotal,
            comisionPorcentaje: estadisticasComision.porcentajePromedio,
            ventasAprobadas,
            ventasPendientes,
            ventasRechazadas,
            ventasPorMes: ventasPorMes.reverse(), // Más reciente primero
            promedioVentasPorMes: totalVentas / 12,
            rendimiento: totalVentas > 0 ? (ventasAprobadas / totalVentas) * 100 : 0,
            estadisticasComision,
            ventasPorTipoProyecto
          }
        }
      })
    )

    return NextResponse.json({
      estadisticas: estadisticasVendedores
    })

  } catch (error) {
    console.error('Error al obtener estadísticas de vendedores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
 