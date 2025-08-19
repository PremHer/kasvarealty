const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function populateDefaultCaracteristicas() {
  try {
    console.log('🌱 Poblando características por defecto para proyectos existentes...')
    
    // Obtener todos los proyectos
    const proyectos = await prisma.proyecto.findMany({
      select: { id: true, nombre: true }
    })
    
    console.log(`📋 Encontrados ${proyectos.length} proyectos`)
    
    // Características por defecto
    const caracteristicasDefault = [
      {
        nombre: 'Habilitación para alumbrado público',
        descripcion: 'Instalación de postes y luminarias para iluminación nocturna',
        orden: 1
      },
      {
        nombre: 'Red de distribución de agua potable',
        descripcion: 'Conexión a la red municipal de agua potable',
        orden: 2
      },
      {
        nombre: 'Vías de acceso afirmadas',
        descripcion: 'Calles y avenidas con base afirmada para tránsito vehicular',
        orden: 3
      },
      {
        nombre: 'Título de propiedad para cada lote independizado',
        descripcion: 'Documento de propiedad individual para cada unidad',
        orden: 4
      },
      {
        nombre: 'Sistema de drenaje pluvial',
        descripcion: 'Drenajes para evacuación de aguas de lluvia',
        orden: 5
      },
      {
        nombre: 'Áreas verdes y parques',
        descripcion: 'Espacios recreativos y zonas de esparcimiento',
        orden: 6
      }
    ]
    
    // Crear características para cada proyecto
    for (const proyecto of proyectos) {
      console.log(`🏗️  Creando características para proyecto: ${proyecto.nombre}`)
      
      for (const caracteristica of caracteristicasDefault) {
        await prisma.caracteristicaProyecto.create({
          data: {
            ...caracteristica,
            proyectoId: proyecto.id
          }
        })
      }
      
      console.log(`✅ Características creadas para: ${proyecto.nombre}`)
    }
    
    console.log('🎉 Todas las características han sido creadas exitosamente!')
    
  } catch (error) {
    console.error('❌ Error al poblar características:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateDefaultCaracteristicas()
