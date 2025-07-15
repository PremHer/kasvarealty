import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener el cuerpo de la petición
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Contraseña requerida' },
        { status: 400 }
      )
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.usuario.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        id: true,
        password: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

    // Registrar la validación en auditoría
    await prisma.auditoria.create({
      data: {
        tipo: 'SEGURIDAD',
        accion: 'VALIDACION_CONTRASEÑA',
        entidad: 'VENTAS',
        usuarioId: user.id,
        detalles: 'Validación de contraseña para eliminación de venta',
        ip: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json(
      { success: true, message: 'Contraseña válida' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error validando contraseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 