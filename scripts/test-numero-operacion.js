const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testNumeroOperacion() {
  try {
    console.log('🧪 Probando campo numeroOperacion en ventas...')
    
    // Contar total de ventas
    const totalVentasLotes = await prisma.ventaLote.count()
    const totalVentasCementerio = await prisma.ventaUnidadCementerio.count()
    
    console.log(`📊 Total de ventas de lotes: ${totalVentasLotes}`)
    console.log(`📊 Total de ventas de cementerio: ${totalVentasCementerio}`)
    
    if (totalVentasLotes === 0 && totalVentasCementerio === 0) {
      console.log('⚠️ No hay ventas en la base de datos')
      return
    }
    
    // Verificar ventas de lotes
    if (totalVentasLotes > 0) {
      const ventasLotes = await prisma.ventaLote.findMany({
        select: {
          id: true,
          precioVenta: true,
          montoInicial: true,
          numeroOperacion: true,
          tipoVenta: true,
          cliente: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        },
        take: 5
      })
      
      console.log('\n📋 Ventas de Lotes:')
      ventasLotes.forEach(venta => {
        console.log(`- ID: ${venta.id}`)
        console.log(`  Cliente: ${venta.cliente.nombre} ${venta.cliente.apellido}`)
        console.log(`  Precio: S/ ${venta.precioVenta}`)
        console.log(`  Monto Inicial: ${venta.montoInicial ? `S/ ${venta.montoInicial}` : 'No especificado'}`)
        console.log(`  Número Operación: ${venta.numeroOperacion || 'No especificado'}`)
        console.log(`  Tipo Venta: ${venta.tipoVenta}`)
        console.log('')
      })
    }
    
    // Verificar ventas de unidades de cementerio
    if (totalVentasCementerio > 0) {
      const ventasCementerio = await prisma.ventaUnidadCementerio.findMany({
        select: {
          id: true,
          precioVenta: true,
          montoInicial: true,
          numeroOperacion: true,
          tipoVenta: true,
          cliente: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        },
        take: 5
      })
      
      console.log('\n🏛️ Ventas de Unidades de Cementerio:')
      ventasCementerio.forEach(venta => {
        console.log(`- ID: ${venta.id}`)
        console.log(`  Cliente: ${venta.cliente.nombre} ${venta.cliente.apellido}`)
        console.log(`  Precio: S/ ${venta.precioVenta}`)
        console.log(`  Monto Inicial: ${venta.montoInicial ? `S/ ${venta.montoInicial}` : 'No especificado'}`)
        console.log(`  Número Operación: ${venta.numeroOperacion || 'No especificado'}`)
        console.log(`  Tipo Venta: ${venta.tipoVenta}`)
        console.log('')
      })
    }
    
    console.log('✅ Prueba completada exitosamente!')
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNumeroOperacion()
