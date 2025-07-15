import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Generar token de reset
    const resetToken = crypto.randomUUID()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Guardar token en la base de datos
    // await prisma.usuario.update({
    //   where: { id: user.id },
    //   data: {
    //     resetToken,
    //     resetTokenExpiry
    //   }
    // })

    // Enviar email con el link de recuperación
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
    
    await sendEmail({
      to: user.email || '',
      subject: 'Recuperación de Contraseña',
      html: `
        <p>Hola ${user.nombre},</p>
        <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
      `
    })

    return NextResponse.json({ message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
} 