import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// Definir roles permitidos para gestión de vendedores
const VENDOR_MANAGEMENT_ROLES: Rol[] = [
  'SUPER_ADMIN',
  'SALES_MANAGER',
  'GERENTE_GENERAL'
]

// GET /api/vendedores/[id] - Obtener perfil de vendedor específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver vendedores
    if (!VENDOR_MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver perfiles de vendedores' }, { status: 403 })
    }

    const { id } = params

    const perfilVendedor = await prisma.perfilVendedor.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            isActive: true
          }
        },
        creadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        actualizadoPorUsuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    if (!perfilVendedor) {
      return NextResponse.json(
        { error: 'Perfil de vendedor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(perfilVendedor)

  } catch (error) {
    console.error('Error al obtener perfil de vendedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/vendedores/[id] - Actualizar perfil de vendedor
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario puede actualizar perfiles de vendedores
    if (!VENDOR_MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar perfiles de vendedores' }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    
    const { 
      codigoVendedor,
      experienciaAnos,
      telefono,
      direccion,
      fechaAlta,
      observaciones,
      habilidades,
      certificaciones
    } = body

    // Verificar que el perfil existe
    const perfilExistente = await prisma.perfilVendedor.findUnique({
      where: { id }
    })

    if (!perfilExistente) {
      return NextResponse.json(
        { error: 'Perfil de vendedor no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el código de vendedor no esté duplicado (si se está cambiando)
    if (codigoVendedor && codigoVendedor !== perfilExistente.codigoVendedor) {
      const vendedorExistente = await prisma.perfilVendedor.findUnique({
        where: { codigoVendedor }
      })

      if (vendedorExistente) {
        return NextResponse.json(
          { error: 'El código de vendedor ya existe' },
          { status: 400 }
        )
      }
    }

    // Actualizar el perfil de vendedor
    const perfilVendedor = await prisma.perfilVendedor.update({
      where: { id },
      data: {
        codigoVendedor,
        experienciaAnos: experienciaAnos ? parseInt(experienciaAnos) : undefined,
        telefono,
        direccion,
        fechaContratacion: fechaAlta ? new Date(fechaAlta) : undefined,
        observaciones,
        habilidades,
        certificaciones,
        updatedBy: session.user.id
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Perfil de vendedor actualizado correctamente',
      vendedor: perfilVendedor
    })

  } catch (error) {
    console.error('Error al actualizar perfil de vendedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/vendedores/[id] - Eliminar perfil de vendedor
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario puede eliminar perfiles de vendedores
    if (!VENDOR_MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar perfiles de vendedores' }, { status: 403 })
    }

    const { id } = params

    // Verificar que el perfil existe
    const perfilExistente = await prisma.perfilVendedor.findUnique({
      where: { id }
    })

    if (!perfilExistente) {
      return NextResponse.json(
        { error: 'Perfil de vendedor no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar el perfil de vendedor
    await prisma.perfilVendedor.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Perfil de vendedor eliminado correctamente'
    })

  } catch (error) {
    console.error('Error al eliminar perfil de vendedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 