const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateUsersPersonalInfo() {
  try {
    console.log('Actualizando información personal de usuarios...')

    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany()

    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i]
      console.log(`Actualizando usuario: ${usuario.nombre}`)

      // Generar información de ejemplo basada en el nombre
      const nombreLower = usuario.nombre.toLowerCase()
      const isFemale = nombreLower.includes('maria') || nombreLower.includes('ana') || nombreLower.includes('fanny')
      
      // Generar DNI único
      const dni = `1234567${(i + 1).toString().padStart(2, '0')}`
      
      // Actualizar con información personal de ejemplo
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          dni: dni,
          sexo: isFemale ? 'FEMENINO' : 'MASCULINO',
          fechaNacimiento: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          direccion: `Av. Principal ${Math.floor(Math.random() * 1000) + 1}`,
          distrito: 'Lima',
          provincia: 'Lima',
          departamento: 'Lima'
        }
      })

      console.log(`✅ Usuario ${usuario.nombre} actualizado`)
    }

    console.log('🎉 Todos los usuarios han sido actualizados con información personal')
  } catch (error) {
    console.error('Error al actualizar usuarios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateUsersPersonalInfo()
