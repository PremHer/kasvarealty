import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { UnidadCementerioService } from '@/lib/services/unidadCementerioService'

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string; pabellonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const huecos = await UnidadCementerioService.detectarHuecosUnidades(params.pabellonId)
    return NextResponse.json(huecos)
  } catch (error) {
    console.error('Error al detectar huecos en unidades:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 