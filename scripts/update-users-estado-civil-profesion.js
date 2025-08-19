const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateUsersWithEstadoCivilAndProfesion() {
  try {
    console.log('🔄 Actualizando usuarios con estadoCivil y profesion...')

    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        rol: true
      }
    })

    console.log(`📊 Encontrados ${usuarios.length} usuarios para actualizar`)

    // Actualizar cada usuario con información de ejemplo
    for (const usuario of usuarios) {
      // Determinar estado civil basado en el rol
      let estadoCivil = 'SOLTERO'
      let profesion = 'Empleado'

      if (usuario.rol === 'ADMIN' || usuario.rol === 'SUPER_ADMIN') {
        estadoCivil = 'CASADO'
        profesion = 'Administrador'
      } else if (usuario.rol === 'SALES_MANAGER' || usuario.rol === 'SALES_REP') {
        estadoCivil = 'CASADO'
        profesion = 'Vendedor'
      } else if (usuario.rol === 'PROJECT_MANAGER') {
        estadoCivil = 'CASADO'
        profesion = 'Gerente de Proyectos'
      } else if (usuario.rol === 'FINANCE_MANAGER') {
        estadoCivil = 'CASADO'
        profesion = 'Gerente Financiero'
      }

      // Actualizar usuario
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          estadoCivil: estadoCivil,
          profesion: profesion
        }
      })

      console.log(`✅ Usuario ${usuario.nombre} actualizado: ${estadoCivil}, ${profesion}`)
    }

    console.log('🎉 Todos los usuarios han sido actualizados exitosamente!')
  } catch (error) {
    console.error('❌ Error al actualizar usuarios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
updateUsersWithEstadoCivilAndProfesion()
