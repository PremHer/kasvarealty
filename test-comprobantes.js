// Script para probar el endpoint de verificación de comprobantes
const ventaId = 'cmcv7314m00165cru7xb9x7np';
const tipoVenta = 'LOTE';

console.log('Probando endpoint de verificación de comprobantes...');
console.log('Venta ID:', ventaId);
console.log('Tipo Venta:', tipoVenta);

// URL del endpoint
const url = `http://localhost:3000/api/comprobantes-pago/check?ventaId=${ventaId}&tipoVenta=${tipoVenta}`;

console.log('URL:', url);
console.log('\nPara probar, abre esta URL en tu navegador:');
console.log(url); 