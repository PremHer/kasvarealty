// Prueba simple de amortización con diferentes frecuencias

function calcularAmortizacion(montoFinanciar, tasaInteresAnual, numeroCuotas, frecuenciaCuota) {
  let periodosPorAno = 12
  
  switch (frecuenciaCuota) {
    case 'MENSUAL': periodosPorAno = 12; break
    case 'BIMESTRAL': periodosPorAno = 6; break
    case 'TRIMESTRAL': periodosPorAno = 4; break
    case 'SEMESTRAL': periodosPorAno = 2; break
    case 'ANUAL': periodosPorAno = 1; break
  }
  
  const tasaInteresPorPeriodo = tasaInteresAnual / periodosPorAno / 100
  const cuotaPeriodo = montoFinanciar * (tasaInteresPorPeriodo * Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas)) / (Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas) - 1)
  
  return {
    cuotaPeriodo: Math.round(cuotaPeriodo * 100) / 100,
    totalPagar: Math.round(cuotaPeriodo * numeroCuotas * 100) / 100,
    periodosPorAno,
    tasaInteresPorPeriodo: (tasaInteresPorPeriodo * 100).toFixed(4)
  }
}

const monto = 10000
const tasa = 12
const cuotas = 12

console.log('Pruebas de amortización:')
console.log(`Monto: $${monto}, Tasa: ${tasa}%, Cuotas: ${cuotas}\n`)

const frecuencias = ['MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']

frecuencias.forEach(freq => {
  const resultado = calcularAmortizacion(monto, tasa, cuotas, freq)
  console.log(`${freq}:`)
  console.log(`  Períodos por año: ${resultado.periodosPorAno}`)
  console.log(`  Tasa por período: ${resultado.tasaInteresPorPeriodo}%`)
  console.log(`  Cuota: $${resultado.cuotaPeriodo}`)
  console.log(`  Total: $${resultado.totalPagar}`)
  console.log('')
}) 