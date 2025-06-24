import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PabellonService } from '@/lib/services/pabellonService'

export async function PUT(
  request: NextRequest,
  { params }: { params: { proyectoId: string; pabellonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const body = await request.json()
    const { codigo, nombre, descripcion, observaciones, isActive } = body

    // Si se está actualizando código o nombre, validar que estén presentes
    if ((codigo !== undefined || nombre !== undefined) && (!codigo || !nombre)) {
      return new NextResponse('Código y nombre son requeridos cuando se actualizan', { status: 400 })
    }

    // Solo verificar código existente si se está actualizando el código
    if (codigo) {
      const codigoExistente = await PabellonService.verificarCodigoExistente(params.proyectoId, codigo, params.pabellonId)
      if (codigoExistente) {
        return new NextResponse('El código del pabellón ya existe en este proyecto', { status: 400 })
      }
    }

    // Construir objeto de datos a actualizar solo con los campos proporcionados
    const updateData: any = {
      updatedBy: session.user.id
    }

    if (codigo !== undefined) updateData.codigo = codigo
    if (nombre !== undefined) updateData.nombre = nombre
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (observaciones !== undefined) updateData.observaciones = observaciones
    if (isActive !== undefined) updateData.isActive = isActive

    const pabellon = await PabellonService.actualizarPabellon(params.pabellonId, updateData)

    return NextResponse.json(pabellon)
  } catch (error) {
    console.error('Error al actualizar pabellón:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { proyectoId: string; pabellonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    await PabellonService.eliminarPabellon(params.pabellonId, session.user.id)
    return new NextResponse('Pabellón eliminado correctamente', { status: 200 })
  } catch (error: any) {
    console.error('Error al eliminar pabellón:', error)
    
    if (error.message.includes('No se puede eliminar un pabellón que tiene unidades registradas')) {
      return new NextResponse(error.message, { status: 400 })
    }
    
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 