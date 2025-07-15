import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol, EstadoVentaLote, EstadoVentaUnidadCementerio } from '@prisma/client'

// PUT /api/ventas/[id]/approve - Aprobar o rechazar venta
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Buscar la venta en ambas tablas
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: params.id },
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
        cliente: true,
        vendedor: true
      }
    })

    let ventaUnidadCementerio = await prisma.ventaUnidadCementerio.findUnique({
      where: { id: params.id },
      include: {
        unidadCementerio: {
          include: {
            pabellon: {
              include: {
                proyecto: true
              }
            }
          }
        },
        cliente: true,
        vendedor: true
      }
    })

    if (!ventaLote && !ventaUnidadCementerio) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Verificar permisos para aprobar ventas
    const canApproveByRole = ['SUPER_ADMIN', 'GERENTE_GENERAL', 'SALES_MANAGER'].includes(userRole)
    
    // Si es PROJECT_MANAGER, verificar que sea el gerente asignado al proyecto
    let canApproveAsProjectManager = false
    if (userRole === 'PROJECT_MANAGER') {
      const venta = ventaLote || ventaUnidadCementerio
      if (venta) {
        const proyectoId = ventaLote 
          ? ventaLote.lote.manzana.proyecto.id 
          : ventaUnidadCementerio!.unidadCementerio.pabellon.proyecto.id
        
        const proyecto = await prisma.proyecto.findUnique({
          where: { id: proyectoId },
          select: { gerenteId: true }
        })
        
        canApproveAsProjectManager = proyecto?.gerenteId === session.user.id
      }
    }

    if (!canApproveByRole && !canApproveAsProjectManager) {
      return NextResponse.json({ error: 'No tienes permisos para aprobar ventas' }, { status: 403 })
    }

    const body = await request.json()
    const { accion, observaciones } = body // accion: 'APROBAR' | 'DESAPROBAR'

    if (!['APROBAR', 'DESAPROBAR'].includes(accion)) {
      return NextResponse.json(
        { error: 'Acción inválida. Debe ser APROBAR o DESAPROBAR' },
        { status: 400 }
      )
    }

    // Determinar el nuevo estado
    const nuevoEstado = accion === 'APROBAR' ? 'APROBADA' : 'DESAPROBADA'

    // Actualizar la venta correspondiente
    if (ventaLote) {
      // Verificar que la venta esté pendiente
      if (ventaLote.estado !== 'PENDIENTE') {
        return NextResponse.json(
          { error: 'Solo se pueden aprobar/rechazar ventas pendientes' },
          { status: 400 }
        )
      }

      // Actualizar venta de lote
      const ventaActualizada = await prisma.ventaLote.update({
        where: { id: params.id },
        data: {
          estado: nuevoEstado as EstadoVentaLote,
          aprobadorId: session.user.id,
          fechaAprobacion: new Date(),
          observaciones: observaciones || ventaLote.observaciones,
          updatedBy: session.user.id
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
          cliente: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          aprobador: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      })

      // Si se desaprueba, devolver la unidad a disponible
      if (accion === 'DESAPROBAR') {
        await prisma.lote.update({
          where: { id: ventaLote.loteId },
          data: { estado: 'DISPONIBLE' }
        })
      }
      // Si se aprueba, marcar el lote como vendido
      else if (accion === 'APROBAR') {
        await prisma.lote.update({
          where: { id: ventaLote.loteId },
          data: { estado: 'VENDIDO' }
        })
      }

      return NextResponse.json({
        ...ventaActualizada,
        tipoVenta: 'LOTE'
      })

    } else if (ventaUnidadCementerio) {
      // Verificar que la venta esté pendiente
      if (ventaUnidadCementerio.estado !== 'PENDIENTE') {
        return NextResponse.json(
          { error: 'Solo se pueden aprobar/rechazar ventas pendientes' },
          { status: 400 }
        )
      }

      // Actualizar venta de unidad de cementerio
      const ventaActualizada = await prisma.ventaUnidadCementerio.update({
        where: { id: params.id },
        data: {
          estado: nuevoEstado as EstadoVentaUnidadCementerio,
          aprobadorId: session.user.id,
          fechaAprobacion: new Date(),
          observaciones: observaciones || ventaUnidadCementerio.observaciones,
          updatedBy: session.user.id
        },
        include: {
          unidadCementerio: {
            include: {
              pabellon: {
                include: {
                  proyecto: true
                }
              }
            }
          },
          cliente: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          aprobador: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          }
        }
      })

      // Si se desaprueba, devolver la unidad a disponible
      if (accion === 'DESAPROBAR') {
        await prisma.unidadCementerio.update({
          where: { id: ventaUnidadCementerio.unidadCementerioId },
          data: { estado: 'DISPONIBLE' }
        })
      }
      // Si se aprueba, marcar la unidad como vendida
      else if (accion === 'APROBAR') {
        await prisma.unidadCementerio.update({
          where: { id: ventaUnidadCementerio.unidadCementerioId },
          data: { estado: 'VENDIDO' }
        })
      }

      return NextResponse.json({
        ...ventaActualizada,
        tipoVenta: 'UNIDAD_CEMENTERIO'
      })
    }

  } catch (error) {
    console.error('Error al aprobar/rechazar venta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 