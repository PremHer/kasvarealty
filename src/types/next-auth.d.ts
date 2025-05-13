import 'next-auth'
import { Rol } from '@prisma/client'
import NextAuth from "next-auth"

declare module 'next-auth' {
  interface User {
    id: string
    name: string
    email: string
    role: Rol
    empresaId?: string
  }

  interface Session {
    user: {
      id: string
      role: string
      empresaId?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    empresaId?: string
  }
} 