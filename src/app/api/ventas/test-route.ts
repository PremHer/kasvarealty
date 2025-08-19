import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Datos recibidos:', body)

    // Crear una venta simple sin fechas problemáticas
    const venta = await prisma.ventaLote.create({
      data: {
        loteId: body.loteId || 'test-lote',
        manzanaId: body.manzanaId || 'test-manzana',
        proyectoId: body.proyectoId || 'test-proyecto',
        clienteId: body.clienteId || 'test-cliente',
        vendedorId: session.user.id,
        fechaVenta: new Date(),
        precioOriginal: 100000,
        precioVenta: 95000,
        montoDescuento: 5000,
        tipoVenta: 'CUOTAS',
        numeroCuotas: 12,
        frecuenciaCuota: 'MENSUAL',
        formaPago: 'EFECTIVO',
        montoInicial: 20000,
        saldoPendiente: 75000,
        // Campos de amortización
        tasaInteres: 3.5,
        montoIntereses: 15000,
        montoCapital: 75000,
        saldoCapital: 75000,
        estado: 'PENDIENTE',
        estadoDocumentacion: 'PENDIENTE',
        createdBy: session.user.id
      }
    })

    return NextResponse.json({
      message: 'Venta de prueba creada correctamente',
      venta
    })

  } catch (error) {
    console.error('Error al crear venta de prueba:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    )
  }
} 