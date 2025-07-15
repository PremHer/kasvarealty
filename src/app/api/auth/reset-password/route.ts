import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token y contraseña son requeridos' }, { status: 400 })
    }

    // TODO: Implementar reset de contraseña cuando se agreguen los campos al modelo Usuario
    return NextResponse.json({ error: 'Funcionalidad no implementada' }, { status: 501 })
    
    // Buscar usuario con el token válido
    // const user = await prisma.usuario.findFirst({
    //   where: {
    //     resetToken: token,
    //     resetTokenExpiry: {
    //       gt: new Date()
    //     }
    //   }
    // })

    // if (!user) {
    //   return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    // }

    // // Encriptar nueva contraseña
    // const hashedPassword = await bcrypt.hash(password, 10)

    // // Actualizar contraseña y limpiar token
    // await prisma.usuario.update({
    //   where: { id: user.id },
    //   data: {
    //     password: hashedPassword,
    //     resetToken: null,
    //     resetTokenExpiry: null
    //   }
    // })

    // return NextResponse.json({ message: 'Contraseña actualizada correctamente' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 