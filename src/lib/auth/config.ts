import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '../prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email y contraseña son requeridos')
          }

          const user = await prisma.usuario.findUnique({
            where: { email: credentials.email },
            include: {
              empresaDesarrolladora: {
                select: {
                  id: true
                }
              }
            }
          })

          if (!user) {
            throw new Error('Usuario no encontrado')
          }

          if (!user.isActive) {
            throw new Error('Tu cuenta está inactiva. Por favor, contacta al administrador del sistema para activar tu cuenta.')
          }

          const isValid = await compare(credentials.password, user.password)

          if (!isValid) {
            throw new Error('Contraseña incorrecta')
          }

          // Actualizar último login
          await prisma.usuario.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          return {
            id: user.id,
            name: user.nombre,
            email: user.email || '',
            role: user.rol,
            empresaId: user.empresaDesarrolladora?.id
          }
        } catch (error) {
          console.error('Error en authorize:', error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.empresaId = user.empresaId
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id
        session.user.role = token.role
        ;(session.user as any).empresaId = token.empresaId
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
} 