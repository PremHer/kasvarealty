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
export const getDashboardStats = async (empresaId: string | null) => {
  const cacheKey = `dashboard_stats_${empresaId || 'all'}`
  
  return getCachedData(cacheKey, async () => {
    // Construir filtro de empresa
    const empresaFilter = empresaId ? { empresaDesarrolladoraId: empresaId } : {}
    
    const [
      proyectosActivos,
      unidadesDisponibles,
      ventasMes,
      ingresosMes,
      proyectosCementerio,
      unidadesCementerioDisponibles
    ] = await Promise.all([
      // Proyectos activos (lotización)
      prisma.proyecto.count({
        where: {
          ...empresaFilter,
          tipo: 'LOTIZACION'
        }
      }),
      
      // Unidades disponibles (lotes)
      prisma.lote.count({
        where: {
          estado: 'DISPONIBLE',
          manzana: {
            proyecto: empresaFilter
          }
        }
      }),
      
      // Ventas del mes (lotes)
      prisma.ventaLote.count({
        where: {
          fechaVenta: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          },
          lote: {
            manzana: {
              proyecto: empresaFilter
            }
          }
        }
      }),
      
      // Ingresos del mes (lotes)
      prisma.ventaLote.aggregate({
        where: {
          fechaVenta: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          },
          estado: 'APROBADA',
          lote: {
            manzana: {
              proyecto: empresaFilter
            }
          }
        },
        _sum: {
          precioVenta: true
        }
      }),

      // Proyectos de cementerio activos
      prisma.proyecto.count({
        where: {
          ...empresaFilter,
          tipo: 'CEMENTERIO'
        }
      }),

      // Unidades de cementerio disponibles
      prisma.unidadCementerio.count({
        where: {
          estado: 'DISPONIBLE',
          pabellon: {
            proyecto: empresaFilter
          }
        }
      })
    ])

    return {
      proyectosActivos: proyectosActivos + proyectosCementerio,
      unidadesDisponibles: unidadesDisponibles + unidadesCementerioDisponibles,
      ventasMes,
      ingresosMes: ingresosMes._sum?.precioVenta || 0,
      proyectosLotizacion: proyectosActivos,
      proyectosCementerio,
      lotesDisponibles: unidadesDisponibles,
      unidadesCementerioDisponibles
    }
  })
}

// Tipos para actividades
interface Activity {
  id: string
  tipo: string
  descripcion: string
  proyecto: string
  cliente?: string
  fecha: Date
  monto?: number
}

// Consulta optimizada para actividad reciente
export const getRecentActivity = async (empresaId: string | null): Promise<Activity[]> => {
  const cacheKey = `recent_activity_${empresaId || 'all'}`
  
  return getCachedData(cacheKey, async () => {
    // Construir filtro de empresa
    const empresaFilter = empresaId ? { empresaDesarrolladoraId: empresaId } : {}
    
    const ventasLotes = await prisma.ventaLote.findMany({
      where: {
        lote: {
          manzana: {
            proyecto: empresaFilter
          }
        }
      },
      include: {
        lote: {
          include: {
            manzana: {
              include: {
                proyecto: true
              }
            }
          }
        },
        cliente: true
      },
      orderBy: {
        fechaVenta: 'desc'
      },
      take: 5
    })

    // También obtener actividad de proyectos recientes
    const proyectosRecientes = await prisma.proyecto.findMany({
      where: empresaFilter,
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    const actividades: Activity[] = []

    // Agregar ventas de lotes
    ventasLotes.forEach(venta => {
      actividades.push({
        id: venta.id,
        tipo: 'VENTA_LOTE',
        descripcion: `Venta de lote ${venta.lote.codigo}`,
        proyecto: venta.lote.manzana.proyecto.nombre,
        cliente: venta.cliente.nombre || undefined,
        fecha: venta.fechaVenta,
        monto: venta.precioVenta
      })
    })

    // Agregar proyectos recientes
    proyectosRecientes.forEach(proyecto => {
      actividades.push({
        id: proyecto.id,
        tipo: 'PROYECTO_CREADO',
        descripcion: `Proyecto ${proyecto.tipo.toLowerCase()} creado`,
        proyecto: proyecto.nombre,
        fecha: proyecto.createdAt
      })
    })

    // Si es SUPER_ADMIN, agregar más actividad del sistema
    if (!empresaId) {
      // Usuarios recientes
      const usuariosRecientes = await prisma.usuario.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 2
      })

      usuariosRecientes.forEach(usuario => {
        actividades.push({
          id: usuario.id,
          tipo: 'USUARIO_CREADO',
          descripcion: `Usuario ${usuario.nombre} registrado`,
          proyecto: 'Sistema',
          fecha: usuario.createdAt
        })
      })

      // Empresas recientes
      const empresasRecientes = await prisma.empresaDesarrolladora.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 2
      })

      empresasRecientes.forEach(empresa => {
        actividades.push({
          id: empresa.id,
          tipo: 'EMPRESA_CREADA',
          descripcion: `Empresa ${empresa.nombre} registrada`,
          proyecto: 'Sistema',
          fecha: empresa.createdAt
        })
      })
    }

    // Ordenar por fecha y tomar los 5 más recientes
    return actividades
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5)
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
      cliente: venta.cliente.nombre || undefined,
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

// Estadísticas completas del sistema para SUPER_ADMIN
export const getSystemStats = async () => {
  const cacheKey = 'system_stats'
  
  return getCachedData(cacheKey, async () => {
    const [
      totalEmpresas,
      totalUsuarios,
      totalClientes,
      totalProyectos,
      proyectosLotizacion,
      proyectosCementerio,
      totalLotes,
      lotesDisponibles,
      totalUnidadesCementerio,
      unidadesCementerioDisponibles,
      totalVentas,
      ingresosTotales,
      usuariosActivos,
      usuariosInactivos
    ] = await Promise.all([
      // Total de empresas
      prisma.empresaDesarrolladora.count(),
      
      // Total de usuarios
      prisma.usuario.count(),
      
      // Total de clientes
      prisma.cliente.count(),
      
      // Total de proyectos
      prisma.proyecto.count(),
      
      // Proyectos de lotización
      prisma.proyecto.count({
        where: { tipo: 'LOTIZACION' }
      }),
      
      // Proyectos de cementerio
      prisma.proyecto.count({
        where: { tipo: 'CEMENTERIO' }
      }),
      
      // Total de lotes
      prisma.lote.count(),
      
      // Lotes disponibles
      prisma.lote.count({
        where: { estado: 'DISPONIBLE' }
      }),
      
      // Total de unidades de cementerio
      prisma.unidadCementerio.count(),
      
      // Unidades de cementerio disponibles
      prisma.unidadCementerio.count({
        where: { estado: 'DISPONIBLE' }
      }),
      
      // Total de ventas
      prisma.ventaLote.count(),
      
      // Ingresos totales
      prisma.ventaLote.aggregate({
        where: { estado: 'APROBADA' },
        _sum: { precioVenta: true }
      }),
      
      // Usuarios activos
      prisma.usuario.count({
        where: { isActive: true }
      }),
      
      // Usuarios inactivos
      prisma.usuario.count({
        where: { isActive: false }
      })
    ])

    return {
      totalEmpresas,
      totalUsuarios,
      totalClientes,
      totalProyectos,
      proyectosLotizacion,
      proyectosCementerio,
      totalLotes,
      lotesDisponibles,
      totalUnidadesCementerio,
      unidadesCementerioDisponibles,
      totalVentas,
      ingresosTotales: ingresosTotales._sum?.precioVenta || 0,
      usuariosActivos,
      usuariosInactivos,
      porcentajeLotesDisponibles: totalLotes > 0 ? Math.round((lotesDisponibles / totalLotes) * 100) : 0,
      porcentajeUnidadesCementerioDisponibles: totalUnidadesCementerio > 0 ? Math.round((unidadesCementerioDisponibles / totalUnidadesCementerio) * 100) : 0,
      porcentajeUsuariosActivos: totalUsuarios > 0 ? Math.round((usuariosActivos / totalUsuarios) * 100) : 0
    }
  })
}

// Datos para gráficos del dashboard
export const getChartData = async (empresaId: string | null) => {
  const cacheKey = `chart_data_${empresaId || 'all'}`
  
  return getCachedData(cacheKey, async () => {
    // Construir filtro de empresa
    const empresaFilter = empresaId ? { empresaDesarrolladoraId: empresaId } : {}
    
    // Datos para gráfico de proyectos por tipo
    const proyectosPorTipo = await prisma.proyecto.groupBy({
      by: ['tipo'],
      where: empresaFilter,
      _count: {
        tipo: true
      }
    })

    // Datos para gráfico de unidades disponibles vs vendidas
    const lotesDisponibles = await prisma.lote.count({
      where: {
        estado: 'DISPONIBLE',
        manzana: {
          proyecto: empresaFilter
        }
      }
    })

    const lotesVendidos = await prisma.lote.count({
      where: {
        estado: 'VENDIDO',
        manzana: {
          proyecto: empresaFilter
        }
      }
    })

    const unidadesCementerioDisponibles = await prisma.unidadCementerio.count({
      where: {
        estado: 'DISPONIBLE',
        pabellon: {
          proyecto: empresaFilter
        }
      }
    })

    const unidadesCementerioVendidas = await prisma.unidadCementerio.count({
      where: {
        estado: 'VENDIDO',
        pabellon: {
          proyecto: empresaFilter
        }
      }
    })

    // Datos para gráfico de ventas mensuales (últimos 6 meses)
    const ventasMensuales = []
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - i)
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)

      const ventasMes = await prisma.ventaLote.count({
        where: {
          fechaVenta: {
            gte: inicioMes,
            lte: finMes
          },
          lote: {
            manzana: {
              proyecto: empresaFilter
            }
          }
        }
      })

      const ingresosMes = await prisma.ventaLote.aggregate({
        where: {
          fechaVenta: {
            gte: inicioMes,
            lte: finMes
          },
          estado: 'APROBADA',
          lote: {
            manzana: {
              proyecto: empresaFilter
            }
          }
        },
        _sum: {
          precioVenta: true
        }
      })

      ventasMensuales.push({
        mes: fecha.toLocaleDateString('es-ES', { month: 'short' }),
        ventas: ventasMes,
        ingresos: ingresosMes._sum?.precioVenta || 0
      })
    }

    // Datos para gráfico de tendencias (últimos 12 meses)
    const tendencias = []
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - i)
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)

      const proyectosMes = await prisma.proyecto.count({
        where: {
          ...empresaFilter,
          createdAt: {
            gte: inicioMes,
            lte: finMes
          }
        }
      })

      const unidadesMes = await prisma.lote.count({
        where: {
          manzana: {
            proyecto: empresaFilter
          },
          createdAt: {
            gte: inicioMes,
            lte: finMes
          }
        }
      })

      tendencias.push({
        periodo: fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        proyectos: proyectosMes,
        unidades: unidadesMes
      })
    }

    // Datos para gráfico de empresas (solo para SUPER_ADMIN)
    let empresasData: any[] = []
    if (!empresaId) {
      const empresas = await prisma.empresaDesarrolladora.findMany({
        include: {
          _count: {
            select: {
              proyectos: true
            }
          }
        }
      })

      empresasData = empresas.map(empresa => ({
        empresa: empresa.nombre,
        proyectos: empresa._count.proyectos,
        ventas: 0 // Esto se puede calcular si es necesario
      }))
    }

    // Datos para gráfico de usuarios (solo para SUPER_ADMIN)
    let usuariosData: any[] = []
    if (!empresaId) {
      const usuariosActivos = await prisma.usuario.count({
        where: { isActive: true }
      })
      const usuariosInactivos = await prisma.usuario.count({
        where: { isActive: false }
      })

      usuariosData = [
        { name: 'Activos', value: usuariosActivos },
        { name: 'Inactivos', value: usuariosInactivos }
      ]
    }

    return {
      proyectosPorTipo: proyectosPorTipo.map(item => ({
        name: item.tipo === 'LOTIZACION' ? 'Lotización' : 'Cementerio',
        lotizacion: item.tipo === 'LOTIZACION' ? item._count.tipo : 0,
        cementerio: item.tipo === 'CEMENTERIO' ? item._count.tipo : 0
      })),
      unidadesDistribucion: [
        { name: 'Lotes Disponibles', value: lotesDisponibles },
        { name: 'Lotes Vendidos', value: lotesVendidos },
        { name: 'Unidades Cementerio Disponibles', value: unidadesCementerioDisponibles },
        { name: 'Unidades Cementerio Vendidas', value: unidadesCementerioVendidas }
      ],
      ventasMensuales,
      tendencias,
      empresasData,
      usuariosData
    }
  })
} 