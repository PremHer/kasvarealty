import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PabellonService } from '@/lib/services/pabellonService'

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
    const incluirInactivos = searchParams.get('incluirInactivos') === 'true'
    const calcular = searchParams.get('calcular') === 'true'
    const cantidad = parseInt(searchParams.get('cantidad') || '0')

    if (calcular && cantidad > 0) {
      // Lógica para calcular información de pabellones a crear
      const info = {
        cantidadPabellones: cantidad,
        codigosSugeridos: [] as string[]
      }

      for (let i = 1; i <= cantidad; i++) {
        const codigoSugerido = await PabellonService.generarSiguienteCodigo(params.proyectoId)
        info.codigosSugeridos.push(codigoSugerido)
      }

      return NextResponse.json(info)
    }

    const pabellones = await PabellonService.obtenerPabellonesPorProyecto(params.proyectoId, incluirInactivos)
    return NextResponse.json(pabellones)
  } catch (error) {
    console.error('Error al obtener pabellones:', error)
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
    
    // Verificar si es creación masiva o individual
    if (body.cantidad && typeof body.cantidad === 'number') {
      // Creación masiva
      const { cantidad } = body
      
      if (cantidad <= 0 || cantidad > 50) {
        return new NextResponse('La cantidad debe estar entre 1 y 50', { status: 400 })
      }

      const pabellonesCreados = []
      
      for (let i = 0; i < cantidad; i++) {
        const codigo = await PabellonService.generarSiguienteCodigo(params.proyectoId)
        const nombre = `Pabellón ${codigo}`
        const descripcion = `Pabellón ${codigo} del proyecto`
        
        const pabellon = await PabellonService.crearPabellon({
          codigo,
          nombre,
          descripcion,
          observaciones: undefined,
          proyectoId: params.proyectoId,
          createdBy: session.user.id
        })
        
        pabellonesCreados.push(pabellon)
      }

      return NextResponse.json(pabellonesCreados)
    } else {
      // Creación individual (mantener compatibilidad)
      const { codigo, nombre, descripcion, observaciones } = body

      // Validaciones
      if (!codigo || !nombre) {
        return new NextResponse('Código y nombre son requeridos', { status: 400 })
      }

      // Verificar si el código ya existe
      const codigoExistente = await PabellonService.verificarCodigoExistente(params.proyectoId, codigo)
      if (codigoExistente) {
        return new NextResponse('El código del pabellón ya existe en este proyecto', { status: 400 })
      }

      const pabellon = await PabellonService.crearPabellon({
        codigo,
        nombre,
        descripcion,
        observaciones,
        proyectoId: params.proyectoId,
        createdBy: session.user.id
      })

      return NextResponse.json(pabellon)
    }
  } catch (error) {
    console.error('Error al crear pabellón:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 