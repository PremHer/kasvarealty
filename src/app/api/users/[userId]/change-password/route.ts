import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el usuario actual
    const currentUser = await prisma.usuario.findUnique({
      where: { email: session.user?.email! }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validar datos
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // Verificar si el usuario está intentando cambiar su propia contraseña
    const isOwnPassword = currentUser.id === params.userId

    // Si no es su propia contraseña, verificar permisos
    if (!isOwnPassword) {
      let canChangePassword = false

      if (currentUser.rol === 'SUPER_ADMIN') {
        canChangePassword = true
      } else if (currentUser.rol === 'ADMIN') {
        const targetUser = await prisma.usuario.findUnique({
          where: { id: params.userId }
        })
        canChangePassword = targetUser?.rol !== 'SUPER_ADMIN'
      }

      if (!canChangePassword) {
        return NextResponse.json({ error: 'No autorizado para cambiar esta contraseña' }, { status: 403 })
      }
    } else {
      // Si es su propia contraseña, verificar la contraseña actual
      const user = await prisma.usuario.findUnique({
        where: { id: params.userId }
      })

      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })
      }
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: params.userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}