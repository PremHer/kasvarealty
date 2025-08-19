import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Solo roles de alto nivel pueden hacer eliminación forzada
const FORCE_DELETE_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'GERENTE_GENERAL'
]

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para eliminación forzada
    if (!FORCE_DELETE_ROLES.includes(userRole)) {
      return NextResponse.json({ 
        error: 'No tienes permisos para realizar eliminación forzada. Solo Super Admin, Admin y Gerente General pueden realizar esta operación.' 
      }, { status: 403 })
    }

    const { 
      password, 
      codigoTemporal, 
      justificacion, 
      documentacion,
      confirmarImpactoFinanciero 
    } = await request.json()

    // Validaciones obligatorias
    if (!password || !codigoTemporal || !justificacion || !confirmarImpactoFinanciero) {
      return NextResponse.json({ 
        error: 'Todos los campos son obligatorios: contraseña, código temporal, justificación y confirmación de impacto financiero' 
      }, { status: 400 })
    }

    if (justificacion.length < 50) {
      return NextResponse.json({ 
        error: 'La justificación debe tener al menos 50 caracteres' 
      }, { status: 400 })
    }

    console.log('🔍 API Eliminación Forzada - Usuario:', session.user.email)
    console.log('🔍 API Eliminación Forzada - Rol:', userRole)
    console.log('🔍 API Eliminación Forzada - ID de venta:', params.id)

    // Validar contraseña del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const bcrypt = require('bcryptjs')
    const isPasswordValid = await bcrypt.compare(password, usuario.password)
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    // TODO: Validar código temporal (implementar sistema de códigos temporales)
    // Por ahora, aceptamos cualquier código para desarrollo
    console.log('🔍 API Eliminación Forzada - Código temporal recibido:', codigoTemporal)

    // Buscar la venta
    let ventaLote = await prisma.ventaLote.findUnique({
      where: { id: params.id },
      include: {
        cuotas: {
          include: {
            pagos: true
          }
        },
        comprobantesPago: true,
        contratos: true,
        pagosComisiones: true,
        cancelaciones: true
      }
    })

    let ventaUnidadCementerio = await prisma.ventaUnidadCementerio.findUnique({
      where: { id: params.id },
      include: {
        cuotas: {
          include: {
            pagos: true
          }
        },
        comprobantesPago: true,
        contratos: true,
        pagosComisiones: true,
        cancelaciones: true
      }
    })

    if (!ventaLote && !ventaUnidadCementerio) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    const venta = ventaLote || ventaUnidadCementerio
    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Calcular impacto financiero
    const totalPagos = venta.cuotas.reduce((sum, cuota) => sum + cuota.montoPagado, 0)
    const totalComprobantes = venta.comprobantesPago.length
    const totalContratos = venta.contratos.length
    const totalComisiones = venta.pagosComisiones.length

    console.log('🔍 API Eliminación Forzada - Impacto financiero:', {
      totalPagos,
      totalComprobantes,
      totalContratos,
      totalComisiones
    })

    // Crear registro de auditoría ANTES de eliminar
    await prisma.auditoria.create({
      data: {
        tipo: 'ADMINISTRACION',
        accion: 'ELIMINACION_FORZADA_VENTA',
        entidad: 'VENTA',
        entidadId: params.id,
        detalles: JSON.stringify({
          justificacion,
          documentacion,
          impactoFinanciero: {
            totalPagos,
            totalComprobantes,
            totalContratos,
            totalComisiones
          },
          datosEliminados: {
            cuotas: venta.cuotas.length,
            comprobantes: venta.comprobantesPago.length,
            contratos: venta.contratos.length,
            comisiones: venta.pagosComisiones.length
          }
        }),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        usuarioId: session.user.id
      }
    })

    console.log('✅ API Eliminación Forzada - Auditoría registrada, procediendo a eliminar')

    // Eliminar la venta y actualizar el estado del producto
    if (ventaLote) {
      // Obtener información del lote antes de eliminar la venta
      const loteInfo = await prisma.lote.findUnique({
        where: { id: ventaLote.loteId },
        select: { id: true, codigo: true, estado: true }
      })

      // Eliminar la venta
      await prisma.ventaLote.delete({
        where: { id: params.id }
      })
      console.log('✅ API Eliminación Forzada - Venta de lote eliminada')

      // Actualizar el estado del lote a DISPONIBLE
      if (loteInfo) {
        await prisma.lote.update({
          where: { id: loteInfo.id },
          data: {
            estado: 'DISPONIBLE',
            updatedBy: session.user.id
          }
        })
        console.log('✅ API Eliminación Forzada - Lote actualizado a DISPONIBLE:', loteInfo.codigo)
      }
    } else {
      // Obtener información de la unidad de cementerio antes de eliminar la venta
      const unidadInfo = await prisma.unidadCementerio.findUnique({
        where: { id: ventaUnidadCementerio!.unidadCementerioId },
        select: { id: true, codigo: true, estado: true }
      })

      // Eliminar la venta
      await prisma.ventaUnidadCementerio.delete({
        where: { id: params.id }
      })
      console.log('✅ API Eliminación Forzada - Venta de unidad de cementerio eliminada')

      // Actualizar el estado de la unidad de cementerio a DISPONIBLE
      if (unidadInfo) {
        await prisma.unidadCementerio.update({
          where: { id: unidadInfo.id },
          data: {
            estado: 'DISPONIBLE',
            updatedBy: session.user.id
          }
        })
        console.log('✅ API Eliminación Forzada - Unidad de cementerio actualizada a DISPONIBLE:', unidadInfo.codigo)
      }
    }

    // Determinar qué producto fue liberado
    let productoLiberado = null
    if (ventaLote) {
      const loteInfo = await prisma.lote.findUnique({
        where: { id: ventaLote.loteId },
        select: { codigo: true, manzana: { select: { nombre: true } } }
      })
      if (loteInfo) {
        productoLiberado = {
          tipo: 'LOTE',
          codigo: loteInfo.codigo,
          ubicacion: loteInfo.manzana.nombre
        }
      }
    } else {
      const unidadInfo = await prisma.unidadCementerio.findUnique({
        where: { id: ventaUnidadCementerio!.unidadCementerioId },
        select: { codigo: true, pabellon: { select: { nombre: true } } }
      })
      if (unidadInfo) {
        productoLiberado = {
          tipo: 'UNIDAD_CEMENTERIO',
          codigo: unidadInfo.codigo,
          ubicacion: unidadInfo.pabellon.nombre
        }
      }
    }

    return NextResponse.json({
      message: 'Venta eliminada forzadamente',
      productoLiberado,
      impactoFinanciero: {
        totalPagos,
        totalComprobantes,
        totalContratos,
        totalComisiones
      },
      advertencia: 'Esta operación ha sido registrada en auditoría. Se recomienda revisar el impacto financiero y legal.'
    })

  } catch (error) {
    console.error('❌ Error en eliminación forzada:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 