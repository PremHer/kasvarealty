import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

// Cache para consultas frecuentes
const queryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// Función para limpiar el caché
const clearCache = () => {
  const now = Date.now()
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      queryCache.delete(key)
    }
  }
}

// Función para obtener datos con caché
export const getCachedData = async <T>(
  key: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  clearCache()
  
  const cached = queryCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const data = await queryFn()
  queryCache.set(key, { data, timestamp: Date.now() })
  return data
}

// Consultas optimizadas para el dashboard
export const getDashboardStats = async (empresaId: string) => {
  const cacheKey = `dashboard_stats_${empresaId}`
  
  return getCachedData(cacheKey, async () => {
    const [
      proyectosActivos,
      unidadesDisponibles,
      ventasMes,
      ingresosMes
    ] = await Promise.all([
      // Proyectos activos
      prisma.proyecto.count({
        where: {
          empresaDesarrolladoraId: empresaId
        }
      }),
      
      // Unidades disponibles
      prisma.unidadInmobiliaria.count({
        where: {
          estado: 'DISPONIBLE',
          proyecto: {
            empresaDesarrolladoraId: empresaId
          }
        }
      }),
      
      // Ventas del mes
      prisma.venta.count({
        where: {
          fechaVenta: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          },
          unidadInmobiliaria: {
            proyecto: {
              empresaDesarrolladoraId: empresaId
            }
          }
        }
      }),
      
      // Ingresos del mes
      prisma.venta.aggregate({
        where: {
          fechaVenta: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          },
          estado: 'APROBADA',
          unidadInmobiliaria: {
            proyecto: {
              empresaDesarrolladoraId: empresaId
            }
          }
        },
        _sum: {
          precioVenta: true
        }
      })
    ])

    return {
      proyectosActivos,
      unidadesDisponibles,
      ventasMes,
      ingresosMes: ingresosMes._sum.precioVenta || 0
    }
  })
}

// Consulta optimizada para actividad reciente
export const getRecentActivity = async (empresaId: string) => {
  const cacheKey = `recent_activity_${empresaId}`
  
  return getCachedData(cacheKey, async () => {
    const ventas = await prisma.venta.findMany({
      where: {
        unidadInmobiliaria: {
          proyecto: {
            empresaDesarrolladoraId: empresaId
          }
        }
      },
      include: {
        unidadInmobiliaria: {
          include: {
            proyecto: true
          }
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      },
      take: 5
    })

    return ventas.map(venta => ({
      id: venta.id,
      tipo: 'VENTA',
      descripcion: `Venta de ${venta.unidadInmobiliaria.tipo}`,
      proyecto: venta.unidadInmobiliaria.proyecto.nombre,
      fecha: venta.fechaVenta
    }))
  })
}

// Consulta optimizada para próximos vencimientos
export const getUpcomingDeadlines = async (empresaId: string) => {
  const cacheKey = `upcoming_deadlines_${empresaId}`
  
  return getCachedData(cacheKey, async () => {
    const hoy = new Date()
    const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)

    const ventas = await prisma.venta.findMany({
      where: {
        estado: 'APROBADA',
        unidadInmobiliaria: {
          proyecto: {
            empresaDesarrolladoraId: empresaId
          }
        },
        fechaVenta: {
          gte: hoy,
          lte: treintaDias
        }
      },
      include: {
        unidadInmobiliaria: {
          include: {
            proyecto: true
          }
        },
        cliente: true
      },
      orderBy: {
        fechaVenta: 'asc'
      }
    })

    return ventas.map(venta => ({
      id: venta.id,
      tipo: 'ENTREGA',
      descripcion: `Entrega de ${venta.unidadInmobiliaria.tipo}`,
      proyecto: venta.unidadInmobiliaria.proyecto.nombre,
      cliente: venta.cliente.nombre,
      fecha: venta.fechaVenta
    }))
  })
}

// Función para invalidar el caché
export const invalidateCache = (pattern: string) => {
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key)
    }
  }
} 