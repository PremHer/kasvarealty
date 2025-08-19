import { NextRequest, NextResponse } from 'next/server'
import { AmortizacionService } from '@/lib/services/amortizacionService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { montoFinanciar, tasaInteresAnual, numeroCuotas, frecuenciaCuota } = body

    console.log('🔍 Datos de prueba recibidos:', {
      montoFinanciar,
      tasaInteresAnual,
      numeroCuotas,
      frecuenciaCuota
    })

    // Calcular amortización
    const amortizacion = AmortizacionService.calcularAmortizacion(
      montoFinanciar,
      tasaInteresAnual,
      numeroCuotas,
      frecuenciaCuota || 'MENSUAL',
      new Date()
    )

    console.log('🔍 Amortización calculada:', amortizacion)

    return NextResponse.json({
      message: 'Amortización calculada correctamente',
      amortizacion
    })

  } catch (error) {
    console.error('Error al calcular amortización:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    )
  }
} 