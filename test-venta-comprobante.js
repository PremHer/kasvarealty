// Script para probar el registro de venta con comprobante
const fs = require('fs');
const path = require('path');

console.log('=== PRUEBA DE REGISTRO DE VENTA CON COMPROBANTE ===');

// Crear un archivo de prueba
const testFilePath = path.join(__dirname, 'test-comprobante.pdf');
const testContent = 'Este es un archivo de prueba para el comprobante';

try {
  fs.writeFileSync(testFilePath, testContent);
  console.log('✅ Archivo de prueba creado:', testFilePath);
  
  console.log('\nPara probar el registro de venta con comprobante:');
  console.log('1. Abre la aplicación en http://localhost:3000');
  console.log('2. Ve a un proyecto y selecciona una unidad');
  console.log('3. Registra una venta con pago inicial');
  console.log('4. Adjunta el archivo de prueba:', testFilePath);
  console.log('5. Completa la venta');
  console.log('6. Verifica en el modal de detalles si aparece el comprobante');
  
  console.log('\nPara verificar los comprobantes en la BD:');
  console.log('http://localhost:3000/api/comprobantes-pago/check?ventaId=ID_DE_LA_VENTA&tipoVenta=LOTE');
  
} catch (error) {
  console.error('❌ Error al crear archivo de prueba:', error);
} 