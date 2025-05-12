import 'next-auth'
import { Rol } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: string
    name: string
    email: string
    role: Rol
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Rol
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Rol
  }
} 