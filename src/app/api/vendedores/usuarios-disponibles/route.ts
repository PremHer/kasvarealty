import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { Rol } from '@prisma/client'

// GET /api/vendedores/usuarios-disponibles - Listar usuarios que NO tienen perfiles de vendedor
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userRole = session.user.role as Rol
    
    // Verificar si el usuario tiene permisos para ver vendedores
    if (!['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'GERENTE_GENERAL'].includes(userRole)) {
      return NextResponse.json({ error: 'No tienes permisos para ver vendedores' }, { status: 403 })
    }

    // Obtener usuarios que NO tienen perfiles de vendedor
    const usuariosDisponibles = await prisma.usuario.findMany({
      where: {
        isActive: true,
        // Excluir usuarios que ya tienen perfiles de vendedor
        NOT: {
          id: {
            in: await prisma.perfilVendedor.findMany({
              select: { usuarioId: true }
            }).then(perfiles => perfiles.map(p => p.usuarioId))
          }
        }
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        isActive: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({
      vendedores: usuariosDisponibles
    })

  } catch (error) {
    console.error('Error al obtener usuarios disponibles para vendedores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 