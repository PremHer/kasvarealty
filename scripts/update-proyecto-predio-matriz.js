const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateProyectoPredioMatriz() {
  try {
    console.log('🔄 Actualizando proyecto "Residencial Centenario Barboza" con datos del predio matriz...')
    
    // Buscar el proyecto por nombre
    const proyecto = await prisma.proyecto.findFirst({
      where: {
        nombre: 'Residencial Centenario Barboza'
      }
    })
    
    if (!proyecto) {
      console.log('❌ Proyecto no encontrado')
      return
    }
    
    console.log('✅ Proyecto encontrado:', proyecto.nombre)
    console.log('📊 Datos actuales:', {
      extensionTotal: proyecto.extensionTotal,
      unidadCatastral: proyecto.unidadCatastral,
      partidaRegistral: proyecto.partidaRegistral,
      plazoIndependizacion: proyecto.plazoIndependizacion
    })
    
    // Actualizar con datos del predio matriz
    const proyectoActualizado = await prisma.proyecto.update({
      where: { id: proyecto.id },
      data: {
        extensionTotal: 5.6809,           // 5.6809 hectáreas
        unidadCatastral: '311394',        // Unidad catastral
        partidaRegistral: '11140550',     // Partida registral
        plazoIndependizacion: 12          // 12 meses
      }
    })
    
    console.log('✅ Proyecto actualizado exitosamente!')
    console.log('📊 Nuevos datos:', {
      extensionTotal: proyectoActualizado.extensionTotal,
      unidadCatastral: proyectoActualizado.unidadCatastral,
      partidaRegistral: proyectoActualizado.partidaRegistral,
      plazoIndependizacion: proyectoActualizado.plazoIndependizacion
    })
    
  } catch (error) {
    console.error('❌ Error al actualizar proyecto:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateProyectoPredioMatriz()

