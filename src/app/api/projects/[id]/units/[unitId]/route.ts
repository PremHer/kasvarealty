import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles que pueden editar unidades
const CAN_EDIT_UNITS: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROJECT_MANAGER',
  'GERENTE_GENERAL'
]

export async function PUT(
  request: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para editar unidades
    if (!CAN_EDIT_UNITS.includes(userRole)) {
      return new NextResponse('No tienes permisos para editar unidades', { status: 403 })
    }

    const body = await request.json()
    const { codigo, tipo, estado, precio, area } = body

    if (!codigo || !tipo || !estado || !precio || !area) {
      return new NextResponse('Faltan campos requeridos', { status: 400 })
    }

    // Verificar si el código ya existe en otra unidad
    const existingUnit = await prisma.unidadInmobiliaria.findFirst({
      where: {
        codigo,
        proyectoId: params.id,
        id: {
          not: params.unitId
        }
      }
    })

    if (existingUnit) {
      return new NextResponse('El código de unidad ya existe', { status: 400 })
    }

    const unit = await prisma.unidadInmobiliaria.update({
      where: {
        id: params.unitId
      },
      data: {
        codigo,
        tipo,
        estado,
        precio,
        area
      }
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error al actualizar unidad:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para eliminar unidades
    if (!CAN_EDIT_UNITS.includes(userRole)) {
      return new NextResponse('No tienes permisos para eliminar unidades', { status: 403 })
    }

    // Verificar si la unidad existe y pertenece al proyecto
    const unit = await prisma.unidadInmobiliaria.findFirst({
      where: {
        id: params.unitId,
        proyectoId: params.id
      }
    })

    if (!unit) {
      return new NextResponse('Unidad no encontrada', { status: 404 })
    }

    await prisma.unidadInmobiliaria.delete({
      where: {
        id: params.unitId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error al eliminar unidad:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 