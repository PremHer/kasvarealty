const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateProyectosPredioMatriz() {
  try {
    console.log('🔄 Actualizando proyectos con información del predio matriz...')

    // Obtener todos los proyectos
    const proyectos = await prisma.proyecto.findMany({
      select: {
        id: true,
        nombre: true,
        distrito: true,
        provincia: true,
        departamento: true
      }
    })

    console.log(`📊 Encontrados ${proyectos.length} proyectos para actualizar`)

    for (const proyecto of proyectos) {
      // Determinar información del predio matriz basado en la ubicación
      let extensionTotal = 5.6809 // Valor por defecto en hectáreas
      let unidadCatastral = '311394' // Valor por defecto
      let partidaRegistral = '11140550' // Valor por defecto
      let plazoIndependizacion = 12 // 12 meses por defecto

      // Mapeo específico basado en la ubicación del proyecto
      if (proyecto.distrito && proyecto.distrito.toLowerCase().includes('moyobamba')) {
        extensionTotal = 5.6809
        unidadCatastral = '311394'
        partidaRegistral = '11140550'
        plazoIndependizacion = 12
      } else if (proyecto.distrito && proyecto.distrito.toLowerCase().includes('tarapoto')) {
        extensionTotal = 8.2500
        unidadCatastral = '311395'
        partidaRegistral = '11140551'
        plazoIndependizacion = 18
      } else if (proyecto.distrito && proyecto.distrito.toLowerCase().includes('chiclayo')) {
        extensionTotal = 6.5000
        unidadCatastral = '311396'
        partidaRegistral = '11140552'
        plazoIndependizacion = 15
      }

      // Actualizar proyecto
      await prisma.proyecto.update({
        where: { id: proyecto.id },
        data: {
          extensionTotal: extensionTotal,
          unidadCatastral: unidadCatastral,
          partidaRegistral: partidaRegistral,
          plazoIndependizacion: plazoIndependizacion
        }
      })

      console.log(`✅ Proyecto "${proyecto.nombre}" actualizado:`)
      console.log(`   - Extensión total: ${extensionTotal} ha`)
      console.log(`   - Unidad catastral: ${unidadCatastral}`)
      console.log(`   - Partida registral: ${partidaRegistral}`)
      console.log(`   - Plazo independización: ${plazoIndependizacion} meses`)
    }

    console.log('🎉 Todos los proyectos han sido actualizados exitosamente!')

  } catch (error) {
    console.error('❌ Error al actualizar proyectos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
updateProyectosPredioMatriz()
