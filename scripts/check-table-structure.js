const { PrismaClient } = require('@prisma/client')

async function checkTableStructure() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando estructura de las tablas de ventas...')
    
    // Verificar estructura de ventas_lotes
    console.log('\n📋 Estructura de ventas_lotes:')
    const ventasLotesStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ventas_lotes' 
      ORDER BY ordinal_position
    `
    
    ventasLotesStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Verificar estructura de ventas_unidades_cementerio
    console.log('\n🏛️ Estructura de ventas_unidades_cementerio:')
    const ventasCementerioStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ventas_unidades_cementerio' 
      ORDER BY ordinal_position
    `
    
    ventasCementerioStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Verificar si el campo numeroOperacion existe
    const hasNumeroOperacionLotes = ventasLotesStructure.some(col => col.column_name === 'numeroOperacion')
    const hasNumeroOperacionCementerio = ventasCementerioStructure.some(col => col.column_name === 'numeroOperacion')
    
    console.log('\n✅ Estado del campo numeroOperacion:')
    console.log(`  - ventas_lotes: ${hasNumeroOperacionLotes ? '✅ Existe' : '❌ No existe'}`)
    console.log(`  - ventas_unidades_cementerio: ${hasNumeroOperacionCementerio ? '✅ Existe' : '❌ No existe'}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTableStructure()

