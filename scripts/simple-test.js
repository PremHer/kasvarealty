const { PrismaClient } = require('@prisma/client')

async function simpleTest() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔌 Probando conexión a la base de datos...')
    
    // Prueba simple de conexión
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Conexión exitosa:', result)
    
    // Contar ventas
    const count = await prisma.ventaLote.count()
    console.log(`📊 Total ventas de lotes: ${count}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

simpleTest()

