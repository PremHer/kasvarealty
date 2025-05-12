const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Crear empresa desarrolladora
  const empresa = await prisma.empresaDesarrolladora.create({
    data: {
      nombre: 'KASVA SAC',
      ruc: '20123456789',
      representanteLegal: 'Luis Ramos',
      direccion: 'Av. Principal 123',
      telefono: '987654321',
      email: 'contacto@kasva.com',
    },
  })

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.usuario.create({
    data: {
      nombre: 'Administrador',
      email: 'admin@kasva.com',
      password: hashedPassword,
      rol: 'ADMIN',
      empresaDesarrolladoraId: empresa.id,
    },
  })

  console.log('Datos iniciales creados correctamente')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 