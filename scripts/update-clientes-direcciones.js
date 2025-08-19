const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateClientesDirecciones() {
  try {
    console.log('🔄 Actualizando direcciones de clientes...')

    // Obtener todas las direcciones
    const direcciones = await prisma.direccion.findMany({
      select: {
        id: true,
        distrito: true,
        provincia: true,
        departamento: true,
        cliente: {
          select: {
            nombre: true
          }
        }
      }
    })

    console.log(`📊 Encontradas ${direcciones.length} direcciones para actualizar`)

    // Actualizar cada dirección con información más específica
    for (const direccion of direcciones) {
      // Mapear a ubicaciones más específicas basado en el distrito actual
      let distrito = direccion.distrito || 'Lima'
      let provincia = direccion.provincia || 'Lima'
      let departamento = direccion.departamento || 'Lima'

      // Mapeo específico para distritos conocidos
      if (direccion.distrito) {
        const distritoLower = direccion.distrito.toLowerCase()
        
        if (distritoLower.includes('moyobamba')) {
          distrito = 'Moyobamba'
          provincia = 'Moyobamba'
          departamento = 'San Martín'
        } else if (distritoLower.includes('tarapoto')) {
          distrito = 'Tarapoto'
          provincia = 'San Martín'
          departamento = 'San Martín'
        } else if (distritoLower.includes('chiclayo')) {
          distrito = 'Chiclayo'
          provincia = 'Chiclayo'
          departamento = 'Lambayeque'
        } else if (distritoLower.includes('trujillo')) {
          distrito = 'Trujillo'
          provincia = 'Trujillo'
          departamento = 'La Libertad'
        } else if (distritoLower.includes('arequipa')) {
          distrito = 'Arequipa'
          provincia = 'Arequipa'
          departamento = 'Arequipa'
        } else if (distritoLower.includes('cusco')) {
          distrito = 'Cusco'
          provincia = 'Cusco'
          departamento = 'Cusco'
        } else if (distritoLower.includes('piura')) {
          distrito = 'Piura'
          provincia = 'Piura'
          departamento = 'Piura'
        } else if (distritoLower.includes('tacna')) {
          distrito = 'Tacna'
          provincia = 'Tacna'
          departamento = 'Tacna'
        } else if (distritoLower.includes('chimbote')) {
          distrito = 'Chimbote'
          provincia = 'Santa'
          departamento = 'Ancash'
        } else if (distritoLower.includes('huaraz')) {
          distrito = 'Huaraz'
          provincia = 'Huaraz'
          departamento = 'Ancash'
        }
      }

      // Actualizar dirección
      await prisma.direccion.update({
        where: { id: direccion.id },
        data: {
          distrito: distrito,
          provincia: provincia,
          departamento: departamento
        }
      })

      console.log(`✅ Dirección de ${direccion.cliente.nombre} actualizada: ${distrito}, ${provincia}, ${departamento}`)
    }

    console.log('🎉 Todas las direcciones han sido actualizadas exitosamente!')
  } catch (error) {
    console.error('❌ Error al actualizar direcciones:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
updateClientesDirecciones()
