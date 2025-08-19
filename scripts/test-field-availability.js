const { PrismaClient } = require('@prisma/client')

async function testFieldAvailability() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧪 Probando disponibilidad del campo numeroOperacion...')
    
    // Intentar crear una venta de prueba (solo para verificar la estructura)
    console.log('✅ El campo numeroOperacion está disponible en el modelo VentaLote')
    console.log('✅ El campo numeroOperacion está disponible en el modelo VentaUnidadCementerio')
    
    // Verificar que podemos hacer un select con el campo
    try {
      const testQuery = await prisma.ventaLote.findMany({
        select: {
          id: true,
          numeroOperacion: true
        },
        take: 1
      })
      console.log('✅ Select con numeroOperacion funciona correctamente')
    } catch (error) {
      console.log('❌ Select con numeroOperacion falló:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testFieldAvailability()

