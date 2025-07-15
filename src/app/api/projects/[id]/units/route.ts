import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles que pueden crear/editar unidades
const CAN_EDIT_UNITS: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROJECT_MANAGER',
  'GERENTE_GENERAL'
]

// Definir roles que pueden ver unidades (solo lectura)
const CAN_VIEW_UNITS: Rol[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROJECT_MANAGER',
  'SALES_MANAGER',
  'GERENTE_GENERAL'
]

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver unidades
    if (!CAN_VIEW_UNITS.includes(userRole)) {
      return new NextResponse('No tienes permisos para ver unidades', { status: 403 })
    }

    const units = await prisma.unidadInmobiliaria.findMany({
      where: {
        proyectoId: params.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error('Error al obtener unidades:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('No autorizado', { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para crear unidades
    if (!CAN_EDIT_UNITS.includes(userRole)) {
      return new NextResponse('No tienes permisos para crear unidades', { status: 403 })
    }

    const body = await request.json()
    const { codigo, tipo, estado, precio, area } = body

    if (!codigo || !tipo || !estado || !precio || !area) {
      return new NextResponse('Faltan campos requeridos', { status: 400 })
    }

    // Verificar si el código ya existe
    const existingUnit = await prisma.unidadInmobiliaria.findFirst({
      where: {
        codigo,
        proyectoId: params.id
      }
    })

    if (existingUnit) {
      return new NextResponse('El código de unidad ya existe', { status: 400 })
    }

    const unit = await prisma.unidadInmobiliaria.create({
      data: {
        codigo,
        tipo,
        estado,
        precio,
        area,
        proyectoId: params.id
      }
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error al crear unidad:', error)
    return new NextResponse('Error interno del servidor', { status: 500 })
  }
} 