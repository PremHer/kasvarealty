const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function calculateLotesPerimeter() {
  try {
    console.log('🔄 Calculando perímetros de lotes...')

    // Obtener todos los lotes con dimensiones
    const lotes = await prisma.lote.findMany({
      select: {
        id: true,
        codigo: true,
        numero: true,
        dimensionFrente: true,
        dimensionFondo: true,
        dimensionIzquierda: true,
        dimensionDerecha: true,
        perimetro: true
      }
    })

    console.log(`📊 Encontrados ${lotes.length} lotes para procesar`)

    let actualizados = 0
    let sinDimensiones = 0

    for (const lote of lotes) {
      // Verificar si tiene todas las dimensiones necesarias
      if (lote.dimensionFrente && lote.dimensionFondo && lote.dimensionIzquierda && lote.dimensionDerecha) {
        // Calcular perímetro sumando todas las dimensiones
        const perimetro = lote.dimensionFrente + lote.dimensionFondo + lote.dimensionIzquierda + lote.dimensionDerecha
        
        // Actualizar el lote con el perímetro calculado
        await prisma.lote.update({
          where: { id: lote.id },
          data: { perimetro: perimetro }
        })

        console.log(`✅ Lote ${lote.codigo}-${lote.numero}: Perímetro calculado = ${perimetro}m (${lote.dimensionFrente} + ${lote.dimensionFondo} + ${lote.dimensionIzquierda} + ${lote.dimensionDerecha})`)
        actualizados++
      } else {
        console.log(`⚠️  Lote ${lote.codigo}-${lote.numero}: Sin dimensiones completas, no se puede calcular perímetro`)
        sinDimensiones++
      }
    }

    console.log('🎉 Proceso completado!')
    console.log(`📊 Resumen:`)
    console.log(`   - Lotes actualizados: ${actualizados}`)
    console.log(`   - Lotes sin dimensiones: ${sinDimensiones}`)
    console.log(`   - Total procesados: ${lotes.length}`)

  } catch (error) {
    console.error('❌ Error al calcular perímetros:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
calculateLotesPerimeter()
