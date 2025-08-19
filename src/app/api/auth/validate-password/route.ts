import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json({ error: 'Contraseña requerida' }, { status: 400 })
    }

    // Obtener el usuario actual con su contraseña hasheada
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        email: true
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Verificar la contraseña
    const isValid = await bcrypt.compare(password, usuario.password)
    
    if (!isValid) {
      return NextResponse.json({ 
        error: 'Contraseña incorrecta',
        isValid: false 
      }, { status: 401 })
    }

    return NextResponse.json({ 
      message: 'Contraseña válida',
      isValid: true 
    })

  } catch (error) {
    console.error('Error al validar contraseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
} 