// Script de prueba para verificar cálculos de amortización con diferentes frecuencias

function calcularAmortizacion(montoFinanciar, tasaInteresAnual, numeroCuotas, frecuenciaCuota) {
  // Calcular la tasa de interés según la frecuencia
  let periodosPorAno = 12 // Por defecto mensual
  
  switch (frecuenciaCuota) {
    case 'MENSUAL':
      periodosPorAno = 12
      break
    case 'BIMESTRAL':
      periodosPorAno = 6
      break
    case 'TRIMESTRAL':
      periodosPorAno = 4
      break
    case 'SEMESTRAL':
      periodosPorAno = 2
      break
    case 'ANUAL':
      periodosPorAno = 1
      break
    case 'QUINCENAL':
      periodosPorAno = 24
      break
    case 'SEMANAL':
      periodosPorAno = 52
      break
    default:
      periodosPorAno = 12
  }
  
  const tasaInteresPorPeriodo = tasaInteresAnual / periodosPorAno / 100
  const cuotaPeriodo = montoFinanciar * (tasaInteresPorPeriodo * Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas)) / (Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas) - 1)
  
  const amortizacion = []
  let saldoRestante = montoFinanciar
  
  for (let i = 0; i < numeroCuotas; i++) {
    const interes = saldoRestante * tasaInteresPorPeriodo
    const capital = cuotaPeriodo - interes
    saldoRestante -= capital
    
    // Para la última cuota, ajustar para que no quede saldo residual
    const cuotaFinal = i === numeroCuotas - 1 ? cuotaPeriodo + saldoRestante : cuotaPeriodo
    const capitalFinal = i === numeroCuotas - 1 ? capital + saldoRestante : capital
    const saldoFinal = i === numeroCuotas - 1 ? 0 : saldoRestante
    
    amortizacion.push({
      numero: i + 1,
      cuota: Math.round(cuotaFinal * 100) / 100,
      capital: Math.round(capitalFinal * 100) / 100,
      interes: Math.round(interes * 100) / 100,
      saldoRestante: Math.round(saldoFinal * 100) / 100
    })
  }
  
  return amortizacion
}

function calcularFechasCuotasRegulares(fechaPrimeraCuota, numeroCuotas, frecuenciaCuota) {
  const fechaInicial = new Date(fechaPrimeraCuota)
  const fechas = []

  for (let i = 0; i < numeroCuotas; i++) {
    const fecha = new Date(fechaInicial)
    
    switch (frecuenciaCuota) {
      case 'MENSUAL':
        fecha.setMonth(fecha.getMonth() + i)
        break
      case 'BIMESTRAL':
        fecha.setMonth(fecha.getMonth() + (i * 2))
        break
      case 'TRIMESTRAL':
        fecha.setMonth(fecha.getMonth() + (i * 3))
        break
      case 'SEMESTRAL':
        fecha.setMonth(fecha.getMonth() + (i * 6))
        break
      case 'ANUAL':
        fecha.setFullYear(fecha.getFullYear() + i)
        break
      case 'QUINCENAL':
        fecha.setDate(fecha.getDate() + (i * 15))
        break
      case 'SEMANAL':
        fecha.setDate(fecha.getDate() + (i * 7))
        break
      default:
        fecha.setMonth(fecha.getMonth() + i)
    }
    
    fechas.push(fecha.toISOString().split('T')[0])
  }

  return fechas
}

// Pruebas
console.log('=== PRUEBAS DE AMORTIZACIÓN ===\n')

const montoFinanciar = 10000
const tasaInteresAnual = 12
const numeroCuotas = 12
const fechaPrimeraCuota = '2024-01-15'

const frecuencias = ['MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']

frecuencias.forEach(frecuencia => {
  console.log(`\n--- ${frecuencia} ---`)
  
  const amortizacion = calcularAmortizacion(montoFinanciar, tasaInteresAnual, numeroCuotas, frecuencia)
  const fechas = calcularFechasCuotasRegulares(fechaPrimeraCuota, numeroCuotas, frecuencia)
  
  console.log(`Monto a financiar: $${montoFinanciar}`)
  console.log(`Tasa de interés: ${tasaInteresAnual}% anual`)
  console.log(`Número de cuotas: ${numeroCuotas}`)
  console.log(`Frecuencia: ${frecuencia}`)
  
  const totalCuotas = amortizacion.reduce((sum, cuota) => sum + cuota.cuota, 0)
  const totalIntereses = amortizacion.reduce((sum, cuota) => sum + cuota.interes, 0)
  
  console.log(`Cuota promedio: $${(totalCuotas / numeroCuotas).toFixed(2)}`)
  console.log(`Total a pagar: $${totalCuotas.toFixed(2)}`)
  console.log(`Total intereses: $${totalIntereses.toFixed(2)}`)
  console.log(`Duración: ${fechas.length} períodos`)
  console.log(`Primera fecha: ${fechas[0]}`)
  console.log(`Última fecha: ${fechas[fechas.length - 1]}`)
  
  // Mostrar las primeras 3 cuotas como ejemplo
  console.log('\nPrimeras 3 cuotas:')
  for (let i = 0; i < Math.min(3, amortizacion.length); i++) {
    const cuota = amortizacion[i]
    console.log(`  Cuota ${cuota.numero} (${fechas[i]}): $${cuota.cuota.toFixed(2)} (Capital: $${cuota.capital.toFixed(2)}, Interés: $${cuota.interes.toFixed(2)})`)
  }
})

console.log('\n=== FIN DE PRUEBAS ===') 