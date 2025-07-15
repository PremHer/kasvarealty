const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanInconsistentData() {
  try {
    console.log('🧹 Limpiando datos inconsistentes...')
    
    // 1. Eliminar manzanas que no tienen proyecto válido
    console.log('\n1. Eliminando manzanas sin proyecto válido...')
    const manzanasEliminadas = await prisma.$executeRaw`
      DELETE FROM manzanas 
      WHERE "proyectoId" NOT IN (SELECT id FROM proyectos)
    `
    console.log(`✅ Eliminadas ${manzanasEliminadas} manzanas sin proyecto válido`)
    
    // 2. Eliminar lotes que no tienen manzana válida
    console.log('\n2. Eliminando lotes sin manzana válida...')
    const lotesEliminados = await prisma.$executeRaw`
      DELETE FROM lotes 
      WHERE "manzanaId" NOT IN (SELECT id FROM manzanas)
    `
    console.log(`✅ Eliminados ${lotesEliminados} lotes sin manzana válida`)
    
    // 3. Eliminar pabellones que no tienen proyecto válido
    console.log('\n3. Eliminando pabellones sin proyecto válido...')
    const pabellonesEliminados = await prisma.$executeRaw`
      DELETE FROM pabellones 
      WHERE "proyectoId" NOT IN (SELECT id FROM proyectos)
    `
    console.log(`✅ Eliminados ${pabellonesEliminados} pabellones sin proyecto válido`)
    
    // 4. Eliminar unidades de cementerio que no tienen pabellón válido
    console.log('\n4. Eliminando unidades de cementerio sin pabellón válido...')
    const unidadesEliminadas = await prisma.$executeRaw`
      DELETE FROM unidades_cementerio 
      WHERE "pabellonId" NOT IN (SELECT id FROM pabellones)
    `
    console.log(`✅ Eliminadas ${unidadesEliminadas} unidades de cementerio sin pabellón válido`)
    
    // 5. Eliminar ventas de lotes que no tienen lote válido
    console.log('\n5. Eliminando ventas de lotes sin lote válido...')
    const ventasLotesEliminadas = await prisma.$executeRaw`
      DELETE FROM ventas_lotes 
      WHERE "loteId" NOT IN (SELECT id FROM lotes)
    `
    console.log(`✅ Eliminadas ${ventasLotesEliminadas} ventas de lotes sin lote válido`)
    
    // 6. Eliminar ventas de unidades de cementerio que no tienen unidad válida
    console.log('\n6. Eliminando ventas de unidades de cementerio sin unidad válida...')
    const ventasUnidadesEliminadas = await prisma.$executeRaw`
      DELETE FROM ventas_unidades_cementerio 
      WHERE "unidadCementerioId" NOT IN (SELECT id FROM unidades_cementerio)
    `
    console.log(`✅ Eliminadas ${ventasUnidadesEliminadas} ventas de unidades de cementerio sin unidad válida`)
    
    console.log('\n✅ Limpieza completada exitosamente!')
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanInconsistentData() 