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

// GET /api/vendedores - Listar vendedores activos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver vendedores
    if (!VENDOR_MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver vendedores' }, { status: 403 })
    }

    // Obtener vendedores activos
    const vendedores = await prisma.perfilVendedor.findMany({
      where: {
        estado: 'ACTIVO'
      },
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
        }
      },
      orderBy: {
        usuario: {
          nombre: 'asc'
        }
      }
    })

    return NextResponse.json({
      vendedores: vendedores
    })

  } catch (error) {
    console.error('Error al obtener vendedores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/vendedores - Crear perfil de vendedor
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario puede crear perfiles de vendedores
    if (!VENDOR_MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para crear perfiles de vendedores' }, { status: 403 })
    }

    const body = await request.json()
    
    const { 
      usuarioId,
      codigoVendedor,
      experienciaAnos,
      telefono,
      direccion,
      fechaAlta,
      observaciones,
      habilidades,
      certificaciones
    } = body

    // Validaciones básicas
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Usuario es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el código de vendedor no esté duplicado
    const vendedorExistente = await prisma.perfilVendedor.findUnique({
      where: { codigoVendedor }
    })

    if (vendedorExistente) {
      return NextResponse.json(
        { error: 'El código de vendedor ya existe' },
        { status: 400 }
      )
    }

    // Verificar que el usuario no tenga ya un perfil de vendedor
    const perfilExistente = await prisma.perfilVendedor.findUnique({
      where: { usuarioId }
    })

    if (perfilExistente) {
      return NextResponse.json(
        { error: 'El usuario ya tiene un perfil de vendedor' },
        { status: 400 }
      )
    }

    // Crear el perfil de vendedor
    const perfilVendedor = await prisma.perfilVendedor.create({
      data: {
        usuarioId,
        codigoVendedor,
        experienciaAnos: parseInt(experienciaAnos) || 0,
        telefono,
        direccion,
        fechaContratacion: fechaAlta ? new Date(fechaAlta) : null,
        comisionBase: 0, // Valor por defecto
        comisionPorcentaje: 5, // 5% por defecto
        comisionMinima: 0, // Valor por defecto
        comisionMaxima: null, // Sin máximo por defecto
        metaMensual: null,
        metaAnual: null,
        observaciones,
        habilidades,
        certificaciones,
        createdBy: session.user.id
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            isActive: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Perfil de vendedor creado correctamente',
      vendedor: perfilVendedor
    })

  } catch (error) {
    console.error('Error al crear perfil de vendedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 