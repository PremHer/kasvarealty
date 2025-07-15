import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles permitidos para reportes
const REPORT_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER',
  'FINANCE_MANAGER',
  'GERENTE_GENERAL'
]

// GET /api/vendedores/reportes - Generar reportes de comisiones
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver reportes
    if (!REPORT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver reportes' }, { status: 403 })
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const vendedorId = searchParams.get('vendedorId')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const tipoReporte = searchParams.get('tipoReporte') || 'comisiones' // comisiones, ventas, resumen

    // Construir filtros de fecha
    let whereClause: any = {}
    
    if (fechaInicio && fechaFin) {
      whereClause.fechaVenta = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    }

    if (vendedorId) {
      whereClause.vendedorId = vendedorId
    }

    // Obtener ventas de lotes
    const ventasLotes = await prisma.ventaLote.findMany({
      where: whereClause,
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        lote: {
          select: {
            codigo: true
          }
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      }
    })

    // Obtener ventas de unidades de cementerio
    const ventasUnidadesCementerio = await prisma.ventaUnidadCementerio.findMany({
      where: whereClause,
      include: {
        vendedor: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        unidadCementerio: {
          select: {
            codigo: true
          }
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      }
    })

    // Combinar ventas
    const todasLasVentas = [
      ...ventasLotes.map(venta => ({
        ...venta,
        tipoVenta: 'LOTE',
        unidadCodigo: venta.lote.codigo
      })),
      ...ventasUnidadesCementerio.map(venta => ({
        ...venta,
        tipoVenta: 'UNIDAD_CEMENTERIO',
        unidadCodigo: venta.unidadCementerio.codigo
      }))
    ]

    // Calcular comisiones por vendedor
    const comisionesPorVendedor = new Map()

    todasLasVentas.forEach(venta => {
      const vendedorId = venta.vendedor.id
      const vendedorNombre = venta.vendedor.nombre
      
      if (!comisionesPorVendedor.has(vendedorId)) {
        comisionesPorVendedor.set(vendedorId, {
          vendedorId,
          vendedorNombre,
          totalVentas: 0,
          totalComisiones: 0,
          cantidadVentas: 0,
          ventas: []
        })
      }

      const vendedorData = comisionesPorVendedor.get(vendedorId)
      vendedorData.totalVentas += venta.precioVenta
      vendedorData.totalComisiones += venta.comisionVendedor || 0
      vendedorData.cantidadVentas += 1
      vendedorData.ventas.push({
        id: venta.id,
        fechaVenta: venta.fechaVenta,
        tipoVenta: venta.tipoVenta,
        unidadCodigo: venta.unidadCodigo,
        precioVenta: venta.precioVenta,
        comisionVendedor: venta.comisionVendedor || 0,
        cliente: `${venta.cliente.nombre} ${venta.cliente.apellido || ''}`.trim()
      })
    })

    // Obtener perfiles de vendedores para información adicional
    const perfilesVendedores = await prisma.perfilVendedor.findMany({
      where: vendedorId ? { usuarioId: vendedorId } : {},
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    // Enriquecer datos con información de perfiles
    const reporteCompleto = Array.from(comisionesPorVendedor.values()).map(vendedor => {
      const perfil = perfilesVendedores.find(p => p.usuarioId === vendedor.vendedorId)
      return {
        ...vendedor,
        perfil: perfil ? {
          codigoVendedor: perfil.codigoVendedor,
          especialidad: perfil.especialidad,
          comisionBase: perfil.comisionBase,
          comisionPorcentaje: perfil.comisionPorcentaje,
          comisionMinima: perfil.comisionMinima,
          comisionMaxima: perfil.comisionMaxima,
          metaMensual: perfil.metaMensual,
          metaAnual: perfil.metaAnual
        } : null
      }
    })

    // Calcular totales generales
    const totalesGenerales = {
      totalVentas: reporteCompleto.reduce((sum, v) => sum + v.totalVentas, 0),
      totalComisiones: reporteCompleto.reduce((sum, v) => sum + v.totalComisiones, 0),
      cantidadVentas: reporteCompleto.reduce((sum, v) => sum + v.cantidadVentas, 0),
      cantidadVendedores: reporteCompleto.length
    }

    // Ordenar por total de comisiones (descendente)
    reporteCompleto.sort((a, b) => b.totalComisiones - a.totalComisiones)

    return NextResponse.json({
      reporte: reporteCompleto,
      totales: totalesGenerales,
      filtros: {
        vendedorId,
        fechaInicio,
        fechaFin,
        tipoReporte
      }
    })

  } catch (error) {
    console.error('Error al generar reporte:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 