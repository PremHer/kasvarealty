const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkInconsistentData() {
  try {
    console.log('🔍 Revisando datos inconsistentes...')
    
    // Revisar manzanas con proyectos inexistentes
    const manzanasSinProyecto = await prisma.$queryRaw`
      SELECT m.id, m.codigo, m.proyectoId, m.nombre
      FROM manzanas m 
      LEFT JOIN proyectos p ON m.proyectoId = p.id 
      WHERE p.id IS NULL
    `
    
    console.log('\n📊 Manzanas con proyectos inexistentes:')
    console.log(manzanasSinProyecto)
    
    // Revisar lotes con manzanas inexistentes
    const lotesSinManzana = await prisma.$queryRaw`
      SELECT l.id, l.codigo, l.manzanaId, l.numero
      FROM lotes l 
      LEFT JOIN manzanas m ON l.manzanaId = m.id 
      WHERE m.id IS NULL
    `
    
    console.log('\n📊 Lotes con manzanas inexistentes:')
    console.log(lotesSinManzana)
    
    // Revisar pabellones con proyectos inexistentes
    const pabellonesSinProyecto = await prisma.$queryRaw`
      SELECT p.id, p.codigo, p.proyectoId, p.nombre
      FROM pabellones p 
      LEFT JOIN proyectos pr ON p.proyectoId = pr.id 
      WHERE pr.id IS NULL
    `
    
    console.log('\n📊 Pabellones con proyectos inexistentes:')
    console.log(pabellonesSinProyecto)
    
    // Revisar unidades de cementerio con pabellones inexistentes
    const unidadesSinPabellon = await prisma.$queryRaw`
      SELECT uc.id, uc.codigo, uc.pabellonId, uc.tipoUnidad
      FROM unidades_cementerio uc 
      LEFT JOIN pabellones p ON uc.pabellonId = p.id 
      WHERE p.id IS NULL
    `
    
    console.log('\n📊 Unidades de cementerio con pabellones inexistentes:')
    console.log(unidadesSinPabellon)
    
    // Contar registros totales
    const totalManzanas = await prisma.manzana.count()
    const totalLotes = await prisma.lote.count()
    const totalPabellones = await prisma.pabellon.count()
    const totalUnidadesCementerio = await prisma.unidadCementerio.count()
    const totalProyectos = await prisma.proyecto.count()
    
    console.log('\n📈 Totales:')
    console.log(`- Proyectos: ${totalProyectos}`)
    console.log(`- Manzanas: ${totalManzanas}`)
    console.log(`- Lotes: ${totalLotes}`)
    console.log(`- Pabellones: ${totalPabellones}`)
    console.log(`- Unidades Cementerio: ${totalUnidadesCementerio}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkInconsistentData() 