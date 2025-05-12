import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // Crear usuario SUPER_ADMIN
    const hashedPassword = await hash('admin123', 12)
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@kasvarealty.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'admin@kasvarealty.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    })

    console.log('Usuario SUPER_ADMIN creado:', superAdmin)
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main() 