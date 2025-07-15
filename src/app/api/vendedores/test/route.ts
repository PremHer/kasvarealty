import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener usuarios vendedores
    const usuarios = await prisma.usuario.findMany({
      where: {
        rol: { in: ['SALES_REP', 'SALES_MANAGER'] },
        isActive: true
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true
      }
    })

    // Obtener perfiles de vendedores
    const perfiles = await prisma.perfilVendedor.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      usuarios,
      perfiles,
      session: {
        user: session.user.email,
        role: session.user.role
      }
    })

  } catch (error) {
    console.error('Error en test:', error)
    return NextResponse.json({ error: 'Error en test' }, { status: 500 })
  }
} 