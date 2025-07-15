import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { UnidadCementerioService } from '@/lib/services/unidadCementerioService'
import { Rol } from '@prisma/client'

// Definir roles que pueden editar unidades de cementerio
const CAN_EDIT_CEMENTERIO_UNITS: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROJECT_MANAGER',
  'GERENTE_GENERAL'
]

// Definir roles que pueden ver unidades de cementerio (solo lectura)
const CAN_VIEW_CEMENTERIO_UNITS: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROJECT_MANAGER',
  'SALES_MANAGER',
  'GERENTE_GENERAL'
]

export async function GET(
  request: NextRequest,
  { params }: { params: { proyectoId: string; unidadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver unidades de cementerio
    if (!CAN_VIEW_CEMENTERIO_UNITS.includes(userRole)) {
      return new NextResponse('No tienes permisos para ver unidades de cementerio', { status: 403 })
    }

    const unidad = await UnidadCementerioService.obtenerUnidadPorId(params.unidadId)
    
    if (!unidad) {
      return new NextResponse('Unidad no encontrada', { status: 404 })
    }

    return NextResponse.json(unidad)
  } catch (error) {
    console.error('Error al obtener unidad de cementerio:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { proyectoId: string; unidadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para editar unidades de cementerio
    if (!CAN_EDIT_CEMENTERIO_UNITS.includes(userRole)) {
      return new NextResponse('No tienes permisos para editar unidades de cementerio', { status: 403 })
    }

    const body = await request.json()
    const { 
      codigo, 
      precio, 
      estado,
      latitud, 
      longitud, 
      descripcion, 
      observaciones,
      parcela,
      nicho,
      mausoleo 
    } = body

    // Validaciones básicas
    if (!codigo || !precio) {
      return new NextResponse('Código y precio son requeridos', { status: 400 })
    }

    const unidad = await UnidadCementerioService.actualizarUnidad(params.unidadId, {
      codigo,
      precio: parseFloat(precio),
      estado,
      latitud: latitud ? parseFloat(latitud) : undefined,
      longitud: longitud ? parseFloat(longitud) : undefined,
      descripcion,
      observaciones,
      parcela,
      nicho,
      mausoleo,
      updatedBy: session.user.id
    })

    return NextResponse.json(unidad)
  } catch (error) {
    console.error('Error al actualizar unidad de cementerio:', error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { proyectoId: string; unidadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para eliminar unidades de cementerio
    if (!CAN_EDIT_CEMENTERIO_UNITS.includes(userRole)) {
      return new NextResponse('No tienes permisos para eliminar unidades de cementerio', { status: 403 })
    }

    await UnidadCementerioService.eliminarUnidad(params.unidadId, session.user.id)
    return new NextResponse('Unidad eliminada correctamente', { status: 200 })
  } catch (error) {
    console.error('Error al eliminar unidad de cementerio:', error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { proyectoId: string; unidadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    // Verificar permisos para editar unidades
    const userRole = session.user?.role as Rol;
    const canEditUnidades = CAN_EDIT_CEMENTERIO_UNITS.includes(userRole);

    if (!canEditUnidades) {
      return new NextResponse(
        'No tienes permisos para editar unidades. Solo los Project Managers, Gerentes Generales y Super Admins pueden realizar esta acción.',
        { status: 403 }
      );
    }

    const body = await request.json()
    const { estado } = body

    // Validar que el estado sea válido
    const estadosValidos = ['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'OCUPADO', 'INACTIVO', 'RETIRADO']
    if (!estado || !estadosValidos.includes(estado)) {
      return new NextResponse('Estado inválido', { status: 400 })
    }

    const unidad = await UnidadCementerioService.cambiarEstadoUnidad(
      params.unidadId, 
      estado, 
      session.user.id
    )

    return NextResponse.json(unidad)
  } catch (error) {
    console.error('Error al cambiar estado de unidad de cementerio:', error)
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 