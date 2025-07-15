import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles permitidos para notificaciones
const NOTIFICATION_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER',
  'FINANCE_MANAGER',
  'SALES_REP',
  'GERENTE_GENERAL'
]

// GET /api/notificaciones - Obtener notificaciones del usuario
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    const userId = session.user.id
    
    // Verificar si el usuario tiene permisos para ver notificaciones
    if (!NOTIFICATION_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver notificaciones' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // ventas_pendientes, metas_vendedores, general
    const leidas = searchParams.get('leidas') // true, false, todas

    // Construir filtros base
    let whereClause: any = {}

    // Filtrar por tipo de notificación
    if (tipo) {
      whereClause.tipo = tipo
    }

    // Filtrar por estado de lectura
    if (leidas === 'true') {
      whereClause.leida = true
    } else if (leidas === 'false') {
      whereClause.leida = false
    }

    // Obtener notificaciones del usuario
    const notificaciones = await prisma.notificacion.findMany({
      where: {
        ...whereClause,
        OR: [
          { usuarioId: userId },
          { 
            tipo: 'SISTEMA',
            destinatarios: {
              has: userRole
            }
          }
        ]
      },
      orderBy: {
        fecha: 'desc'
      },
      take: 50
    })

    // Generar notificaciones dinámicas según el rol
    const notificacionesDinamicas = await generarNotificacionesDinamicas(userRole, userId)

    return NextResponse.json({
      notificaciones: [...notificacionesDinamicas, ...notificaciones],
      total: notificacionesDinamicas.length + notificaciones.length,
      noLeidas: notificacionesDinamicas.filter(n => !n.leida).length + 
                notificaciones.filter(n => !n.leida).length
    })

  } catch (error) {
    console.error('Error al obtener notificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/notificaciones - Crear nueva notificación
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para crear notificaciones
    if (!['SUPER_ADMIN', 'SALES_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para crear notificaciones' }, { status: 403 })
    }

    const body = await request.json()
    const { titulo, mensaje, tipo, usuarioId, destinatarios } = body

    if (!titulo || !mensaje || !tipo) {
      return NextResponse.json({ error: 'Título, mensaje y tipo son requeridos' }, { status: 400 })
    }

    // Crear notificación
    const notificacion = await prisma.notificacion.create({
      data: {
        titulo,
        mensaje,
        tipo,
        usuarioId: usuarioId || null,
        destinatarios: destinatarios || [],
        creadoPorId: session.user.id
      }
    })

    return NextResponse.json({
      notificacion,
      message: 'Notificación creada correctamente'
    })

  } catch (error) {
    console.error('Error al crear notificación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para generar notificaciones dinámicas
async function generarNotificacionesDinamicas(userRole: Rol, userId: string) {
  const notificaciones: any[] = []

  // Notificaciones para managers sobre ventas pendientes
  if (['SUPER_ADMIN', 'SALES_MANAGER'].includes(userRole)) {
    const ventasPendientesLotes = await prisma.ventaLote.count({
      where: { estado: 'PENDIENTE' }
    })
    const ventasPendientesUnidades = await prisma.ventaUnidadCementerio.count({
      where: { estado: 'PENDIENTE' }
    })
    const ventasPendientes = ventasPendientesLotes + ventasPendientesUnidades

    if (ventasPendientes > 0) {
      notificaciones.push({
        id: 'ventas_pendientes',
        titulo: 'Ventas Pendientes',
        mensaje: `Hay ${ventasPendientes} ventas pendientes de aprobación`,
        tipo: 'VENTAS_PENDIENTES',
        leida: false,
        fecha: new Date(),
        esDinamica: true
      })
    }
  }

  // Notificaciones para vendedores sobre metas
  if (userRole === 'SALES_REP') {
    const perfilVendedor = await prisma.perfilVendedor.findFirst({
      where: { usuarioId: userId }
    })

    if (perfilVendedor) {
      const ahora = new Date()
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      
      // Calcular ventas del mes actual
      const ventasMesLotes = await prisma.ventaLote.aggregate({
        where: {
          vendedorId: userId,
          fechaVenta: {
            gte: inicioMes,
            lte: ahora
          }
        },
        _sum: {
          precioVenta: true
        }
      })
      
      const ventasMesUnidades = await prisma.ventaUnidadCementerio.aggregate({
        where: {
          vendedorId: userId,
          fechaVenta: {
            gte: inicioMes,
            lte: ahora
          }
        },
        _sum: {
          precioVenta: true
        }
      })

      const totalVentasMes = (ventasMesLotes._sum?.precioVenta || 0) + (ventasMesUnidades._sum?.precioVenta || 0)
      
      if (perfilVendedor.metaMensual && totalVentasMes < perfilVendedor.metaMensual * 0.5) {
        const porcentaje = Math.round((totalVentasMes / perfilVendedor.metaMensual) * 100)
        notificaciones.push({
          id: 'meta_mensual_baja',
          titulo: 'Meta Mensual',
          mensaje: `Has alcanzado solo el ${porcentaje}% de tu meta mensual`,
          tipo: 'META_VENDEDOR',
          leida: false,
          fecha: new Date(),
          esDinamica: true
        })
      }
    }
  }

  // Notificaciones sobre comisiones pendientes
  if (['SUPER_ADMIN', 'FINANCE_MANAGER'].includes(userRole)) {
    const comisionesPendientesLotes = await prisma.ventaLote.aggregate({
      where: {
        estado: 'APROBADA',
        comisionVendedor: {
          gt: 0
        }
      },
      _sum: {
        comisionVendedor: true
      }
    })
    
    const comisionesPendientesUnidades = await prisma.ventaUnidadCementerio.aggregate({
      where: {
        estado: 'APROBADA',
        comisionVendedor: {
          gt: 0
        }
      },
      _sum: {
        comisionVendedor: true
      }
    })

    const totalComisiones = (comisionesPendientesLotes._sum?.comisionVendedor || 0) + (comisionesPendientesUnidades._sum?.comisionVendedor || 0)
    
    if (totalComisiones > 0) {
      notificaciones.push({
        id: 'comisiones_pendientes',
        titulo: 'Comisiones Pendientes',
        mensaje: `Hay ${totalComisiones.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })} en comisiones por pagar`,
        tipo: 'COMISIONES',
        leida: false,
        fecha: new Date(),
        esDinamica: true
      })
    }
  }

  // Notificaciones para gerente general
  if (userRole === 'GERENTE_GENERAL') {
    // Proyectos pendientes de asignación
    const proyectosPendientesAsignacion = await prisma.proyecto.count({
      where: {
        estado: 'PENDING_ASSIGNMENT',
        empresaDesarrolladora: {
          representanteLegalId: userId
        }
      }
    })

    if (proyectosPendientesAsignacion > 0) {
      notificaciones.push({
        id: 'proyectos_pendientes_asignacion',
        titulo: 'Proyectos Pendientes',
        mensaje: `Hay ${proyectosPendientesAsignacion} proyecto(s) pendientes de asignación de Project Manager`,
        tipo: 'PROYECTOS_PENDIENTES',
        leida: false,
        fecha: new Date(),
        esDinamica: true
      })
    }

    // Proyectos pendientes de aprobación
    const proyectosPendientesAprobacion = await prisma.proyecto.count({
      where: {
        estado: 'PENDING_APPROVAL',
        empresaDesarrolladora: {
          representanteLegalId: userId
        }
      }
    })

    if (proyectosPendientesAprobacion > 0) {
      notificaciones.push({
        id: 'proyectos_pendientes_aprobacion',
        titulo: 'Proyectos por Aprobar',
        mensaje: `Hay ${proyectosPendientesAprobacion} proyecto(s) pendientes de tu aprobación`,
        tipo: 'PROYECTOS_POR_APROBAR',
        leida: false,
        fecha: new Date(),
        esDinamica: true
      })
    }

    // Ventas pendientes de aprobación en sus proyectos
    const ventasPendientesGerente = await prisma.ventaLote.count({
      where: {
        estado: 'PENDIENTE',
        lote: {
          manzana: {
            proyecto: {
              empresaDesarrolladora: {
                representanteLegalId: userId
              }
            }
          }
        }
      }
    })

    const ventasUnidadesPendientesGerente = await prisma.ventaUnidadCementerio.count({
      where: {
        estado: 'PENDIENTE',
        unidadCementerio: {
          pabellon: {
            proyecto: {
              empresaDesarrolladora: {
                representanteLegalId: userId
              }
            }
          }
        }
      }
    })

    const totalVentasPendientes = ventasPendientesGerente + ventasUnidadesPendientesGerente

    if (totalVentasPendientes > 0) {
      notificaciones.push({
        id: 'ventas_pendientes_gerente',
        titulo: 'Ventas Pendientes',
        mensaje: `Hay ${totalVentasPendientes} venta(s) pendientes de aprobación en tus proyectos`,
        tipo: 'VENTAS_PENDIENTES_GERENTE',
        leida: false,
        fecha: new Date(),
        esDinamica: true
      })
    }
  }

  return notificaciones
} 