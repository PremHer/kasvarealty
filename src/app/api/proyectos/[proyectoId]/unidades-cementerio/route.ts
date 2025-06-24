import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { UnidadCementerioService } from '@/lib/services/unidadCementerioService'

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pabellonId = searchParams.get('pabellonId')
    const tipoUnidad = searchParams.get('tipoUnidad')
    const generarCodigo = searchParams.get('generarCodigo')

    // Si se solicita generar código automático
    if (generarCodigo === 'true' && pabellonId && tipoUnidad) {
      try {
        const considerarHuecos = searchParams.get('considerarHuecos') !== 'false'
        
        const codigo = considerarHuecos 
          ? await UnidadCementerioService.obtenerSiguienteCodigoConHuecos(
              pabellonId, 
              tipoUnidad as 'PARCELA' | 'NICHO' | 'MAUSOLEO'
            )
          : await UnidadCementerioService.obtenerSiguienteCodigoSinHuecos(
              pabellonId, 
              tipoUnidad as 'PARCELA' | 'NICHO' | 'MAUSOLEO'
            )
        
        return NextResponse.json({ codigo })
      } catch (error) {
        console.error('Error al generar código:', error)
        return new NextResponse(`Error al generar código: ${error instanceof Error ? error.message : 'Error desconocido'}`, { status: 500 })
      }
    }

    let unidades
    if (pabellonId) {
      unidades = await UnidadCementerioService.obtenerUnidadesPorPabellon(params.proyectoId, pabellonId)
    } else {
      unidades = await UnidadCementerioService.obtenerUnidadesPorProyecto(params.proyectoId)
    }

    return NextResponse.json(unidades)
  } catch (error) {
    console.error('Error al obtener unidades de cementerio:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { proyectoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const body = await request.json()
    const { 
      codigo, 
      tipoUnidad, 
      precio, 
      latitud, 
      longitud, 
      descripcion, 
      observaciones, 
      pabellonId,
      parcela,
      nicho,
      mausoleo 
    } = body

    // Validaciones básicas
    if (!codigo || !tipoUnidad || !precio || !pabellonId) {
      return new NextResponse('Código, tipo de unidad, precio y pabellón son requeridos', { status: 400 })
    }

    // Validar que el tipo de unidad tenga los datos correspondientes
    if (tipoUnidad === 'PARCELA' && !parcela) {
      return new NextResponse('Los datos de parcela son requeridos', { status: 400 })
    }
    if (tipoUnidad === 'NICHO' && !nicho) {
      return new NextResponse('Los datos de nicho son requeridos', { status: 400 })
    }
    if (tipoUnidad === 'MAUSOLEO' && !mausoleo) {
      return new NextResponse('Los datos de mausoleo son requeridos', { status: 400 })
    }

    const unidad = await UnidadCementerioService.crearUnidad({
      codigo,
      tipoUnidad,
      precio: parseFloat(precio),
      latitud: latitud ? parseFloat(latitud) : undefined,
      longitud: longitud ? parseFloat(longitud) : undefined,
      descripcion,
      observaciones,
      pabellonId,
      parcela,
      nicho,
      mausoleo,
      createdBy: session.user.id
    })

    return NextResponse.json(unidad)
  } catch (error) {
    console.error('Error al crear unidad de cementerio:', error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 