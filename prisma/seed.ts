import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Crear empresa por defecto
  const empresa = await prisma.empresaDesarrolladora.upsert({
    where: { ruc: '20123456789' },
    update: {},
    create: {
      nombre: 'Kasva Realty',
      ruc: '20123456789',
      representanteLegal: 'Administrador',
      direccion: 'Lima, Perú',
      telefono: '999999999',
      email: 'admin@kasvarealty.com'
    }
  })

  // Crear usuario SUPER_ADMIN
  const hashedPassword = await bcrypt.hash('Admin123!', 10)
  await prisma.usuario.upsert({
    where: { email: 'admin@kasvarealty.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@kasvarealty.com',
      password: hashedPassword,
      rol: Rol.SUPER_ADMIN,
      empresaDesarrolladoraId: empresa.id,
      isActive: true
    }
  })

  console.log('Seed completado: Usuario SUPER_ADMIN creado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 