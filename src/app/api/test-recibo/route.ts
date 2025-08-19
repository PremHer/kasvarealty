import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { generarReciboCuota } from '@/lib/services/reciboService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { cuotaId, montoPagado, formaPago } = data

    console.log('🔍 Test Recibo - Iniciando prueba...')
    console.log('🔍 Test Recibo - Session user ID:', session.user.id)
    
    // Obtener información del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      include: { empresaDesarrolladora: true }
    })

    console.log('🔍 Test Recibo - Usuario encontrado:', {
      id: usuario?.id,
      email: usuario?.email,
      empresaDesarrolladoraId: usuario?.empresaDesarrolladoraId,
      empresaDesarrolladora: usuario?.empresaDesarrolladora ? {
        id: usuario.empresaDesarrolladora.id,
        nombre: usuario.empresaDesarrolladora.nombre
      } : null
    })

    if (!usuario?.empresaDesarrolladoraId) {
      return NextResponse.json({
        error: 'Usuario no asociado a empresa desarrolladora',
        usuario: {
          id: usuario?.id,
          email: usuario?.email,
          empresaDesarrolladoraId: usuario?.empresaDesarrolladoraId
        }
      }, { status: 400 })
    }

    // Verificar que la cuota existe
    const cuota = await prisma.cuota.findUnique({
      where: { id: cuotaId },
      include: {
        ventaLote: {
          include: {
            cliente: true,
            vendedor: true,
            lote: {
              include: {
                manzana: {
                  include: {
                    proyecto: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!cuota) {
      return NextResponse.json({ error: 'Cuota no encontrada' }, { status: 404 })
    }

    console.log('🔍 Test Recibo - Cuota encontrada:', {
      id: cuota.id,
      numeroCuota: cuota.numeroCuota,
      ventaLoteId: cuota.ventaLoteId,
      cliente: cuota.ventaLote?.cliente?.nombre
    })

    // Generar recibo de prueba
    const recibo = await generarReciboCuota(
      cuotaId,
      montoPagado,
      formaPago,
      usuario.empresaDesarrolladoraId,
      session.user.id,
      'Test',
      'Recibo de prueba',
      undefined
    )

    console.log('✅ Test Recibo - Recibo generado exitosamente:', {
      id: recibo.id,
      numeroRecibo: recibo.numeroRecibo
    })

    return NextResponse.json({
      success: true,
      recibo: {
        id: recibo.id,
        numeroRecibo: recibo.numeroRecibo,
        montoPagado: recibo.montoPagado,
        concepto: recibo.concepto
      }
    })

  } catch (error) {
    console.error('❌ Test Recibo - Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
} 