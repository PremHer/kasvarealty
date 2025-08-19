export interface TablaAmortizacion {
  numeroCuota: number
  fechaVencimiento: Date
  saldoCapital: number
  montoCapital: number
  montoInteres: number
  montoCuota: number
  saldoCapitalPosterior: number
}

export interface CalculoAmortizacion {
  tablaAmortizacion: TablaAmortizacion[]
  totalCapital: number
  totalIntereses: number
  totalCuotas: number
  montoCuota: number
}

export interface CuotaPersonalizada {
  monto: number
  fecha: string
  intereses?: number
}

export interface CalculoCuotasPersonalizadas {
  cuotas: CuotaPersonalizada[]
  totalCapital: number
  totalIntereses: number
  totalCuotas: number
}

export class AmortizacionService {
  /**
   * Calcula la tabla de amortización con intereses usando el modelo especificado
   */
  static calcularAmortizacion(
    montoFinanciar: number,
    tasaInteresAnual: number,
    numeroCuotas: number,
    frecuenciaCuota: 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
    fechaPrimeraCuota: Date,
    modeloAmortizacion: 'FRANCES' | 'ALEMAN' | 'JAPONES' = 'FRANCES'
  ): CalculoAmortizacion {
    console.log('🔍 AmortizacionService - Parámetros recibidos:', {
      montoFinanciar,
      tasaInteresAnual,
      numeroCuotas,
      frecuenciaCuota,
      fechaPrimeraCuota,
      modeloAmortizacion
    })

    // Convertir tasa anual a tasa por período
    const tasaPorPeriodo = this.convertirTasaAnualAPeriodo(tasaInteresAnual, frecuenciaCuota)
    console.log('🔍 AmortizacionService - Tasa por período:', tasaPorPeriodo)
    
    // Calcular tabla según el modelo seleccionado
    let tablaAmortizacion: TablaAmortizacion[] = []
    let montoCuota = 0
    
    switch (modeloAmortizacion) {
      case 'FRANCES':
        tablaAmortizacion = this.calcularAmortizacionFrancesa(montoFinanciar, tasaPorPeriodo, numeroCuotas, fechaPrimeraCuota, frecuenciaCuota)
        montoCuota = tablaAmortizacion[0]?.montoCuota || 0
        break
      case 'ALEMAN':
        tablaAmortizacion = this.calcularAmortizacionAlemana(montoFinanciar, tasaPorPeriodo, numeroCuotas, fechaPrimeraCuota, frecuenciaCuota)
        montoCuota = tablaAmortizacion[0]?.montoCuota || 0
        break
      case 'JAPONES':
        tablaAmortizacion = this.calcularAmortizacionJaponesa(montoFinanciar, tasaPorPeriodo, numeroCuotas, fechaPrimeraCuota, frecuenciaCuota)
        montoCuota = tablaAmortizacion[0]?.montoCuota || 0
        break
      default:
        tablaAmortizacion = this.calcularAmortizacionFrancesa(montoFinanciar, tasaPorPeriodo, numeroCuotas, fechaPrimeraCuota, frecuenciaCuota)
        montoCuota = tablaAmortizacion[0]?.montoCuota || 0
    }
    
    console.log('🔍 AmortizacionService - Modelo usado:', modeloAmortizacion)
    console.log('🔍 AmortizacionService - Monto de cuota:', montoCuota)
    
    const totalIntereses = tablaAmortizacion.reduce((total, cuota) => total + cuota.montoInteres, 0)
    
    console.log('🔍 AmortizacionService - Tabla generada con', tablaAmortizacion.length, 'cuotas')
    
    return {
      tablaAmortizacion,
      totalCapital: montoFinanciar,
      totalIntereses,
      totalCuotas: numeroCuotas,
      montoCuota
    }
  }

  /**
   * Calcula la amortización francesa (cuota fija)
   */
  private static calcularAmortizacionFrancesa(
    montoFinanciar: number,
    tasaPorPeriodo: number,
    numeroCuotas: number,
    fechaPrimeraCuota: Date,
    frecuenciaCuota: string
  ): TablaAmortizacion[] {
    const montoCuota = this.calcularCuotaFija(montoFinanciar, tasaPorPeriodo, numeroCuotas)
    const tablaAmortizacion: TablaAmortizacion[] = []
    let saldoCapital = montoFinanciar
    
    for (let i = 1; i <= numeroCuotas; i++) {
      // Calcular interés del período
      const montoInteres = saldoCapital * tasaPorPeriodo
      
      // Calcular capital del período
      const montoCapital = montoCuota - montoInteres
      
      // Actualizar saldo
      const saldoCapitalPosterior = saldoCapital - montoCapital
      
      // Calcular fecha de vencimiento
      const fechaVencimiento = this.calcularFechaVencimiento(fechaPrimeraCuota, i, frecuenciaCuota)
      
      tablaAmortizacion.push({
        numeroCuota: i,
        fechaVencimiento,
        saldoCapital,
        montoCapital,
        montoInteres,
        montoCuota,
        saldoCapitalPosterior
      })
      
      saldoCapital = saldoCapitalPosterior
    }
    
    return tablaAmortizacion
  }

  /**
   * Calcula la amortización alemana (capital fijo)
   */
  private static calcularAmortizacionAlemana(
    montoFinanciar: number,
    tasaPorPeriodo: number,
    numeroCuotas: number,
    fechaPrimeraCuota: Date,
    frecuenciaCuota: string
  ): TablaAmortizacion[] {
    const montoCapital = montoFinanciar / numeroCuotas
    const tablaAmortizacion: TablaAmortizacion[] = []
    let saldoCapital = montoFinanciar
    
    for (let i = 1; i <= numeroCuotas; i++) {
      // Calcular interés del período sobre el saldo deudor
      const montoInteres = saldoCapital * tasaPorPeriodo
      
      // El capital es fijo
      const capitalPeriodo = montoCapital
      
      // La cuota total es capital + intereses
      const montoCuota = capitalPeriodo + montoInteres
      
      // Actualizar saldo
      const saldoCapitalPosterior = saldoCapital - capitalPeriodo
      
      // Calcular fecha de vencimiento
      const fechaVencimiento = this.calcularFechaVencimiento(fechaPrimeraCuota, i, frecuenciaCuota)
      
      tablaAmortizacion.push({
        numeroCuota: i,
        fechaVencimiento,
        saldoCapital,
        montoCapital: capitalPeriodo,
        montoInteres,
        montoCuota,
        saldoCapitalPosterior
      })
      
      saldoCapital = saldoCapitalPosterior
    }
    
    return tablaAmortizacion
  }

  /**
   * Calcula la amortización japonesa (interés sobre saldo inicial)
   */
  private static calcularAmortizacionJaponesa(
    montoFinanciar: number,
    tasaPorPeriodo: number,
    numeroCuotas: number,
    fechaPrimeraCuota: Date,
    frecuenciaCuota: string
  ): TablaAmortizacion[] {
    const montoCapital = montoFinanciar / numeroCuotas
    const montoInteresFijo = montoFinanciar * tasaPorPeriodo // Interés fijo sobre el saldo inicial
    const tablaAmortizacion: TablaAmortizacion[] = []
    let saldoCapital = montoFinanciar
    
    for (let i = 1; i <= numeroCuotas; i++) {
      // El capital es fijo
      const capitalPeriodo = montoCapital
      
      // Los intereses son fijos sobre el saldo inicial
      const interesesPeriodo = montoInteresFijo
      
      // La cuota total es capital + intereses fijos
      const montoCuota = capitalPeriodo + interesesPeriodo
      
      // Actualizar saldo
      const saldoCapitalPosterior = saldoCapital - capitalPeriodo
      
      // Calcular fecha de vencimiento
      const fechaVencimiento = this.calcularFechaVencimiento(fechaPrimeraCuota, i, frecuenciaCuota)
      
      tablaAmortizacion.push({
        numeroCuota: i,
        fechaVencimiento,
        saldoCapital,
        montoCapital: capitalPeriodo,
        montoInteres: interesesPeriodo,
        montoCuota,
        saldoCapitalPosterior
      })
      
      saldoCapital = saldoCapitalPosterior
    }
    
    return tablaAmortizacion
  }
  
  /**
   * Convierte tasa anual a tasa por período según la frecuencia
   */
  private static convertirTasaAnualAPeriodo(tasaAnual: number, frecuencia: string): number {
    const tasaDecimal = tasaAnual / 100
    
    switch (frecuencia) {
      case 'MENSUAL':
        return Math.pow(1 + tasaDecimal, 1/12) - 1
      case 'BIMESTRAL':
        return Math.pow(1 + tasaDecimal, 2/12) - 1
      case 'TRIMESTRAL':
        return Math.pow(1 + tasaDecimal, 3/12) - 1
      case 'SEMESTRAL':
        return Math.pow(1 + tasaDecimal, 6/12) - 1
      case 'ANUAL':
        return tasaDecimal
      default:
        return Math.pow(1 + tasaDecimal, 1/12) - 1 // Por defecto mensual
    }
  }
  
  /**
   * Calcula el monto de cuota fija usando la fórmula de amortización
   */
  private static calcularCuotaFija(monto: number, tasa: number, periodos: number): number {
    if (tasa === 0) {
      return monto / periodos
    }
    
    const factor = (tasa * Math.pow(1 + tasa, periodos)) / (Math.pow(1 + tasa, periodos) - 1)
    return monto * factor
  }
  
  /**
   * Calcula la fecha de vencimiento de una cuota
   */
  private static calcularFechaVencimiento(fechaInicial: Date, numeroCuota: number, frecuencia: string): Date {
    const fecha = new Date(fechaInicial)
    
    switch (frecuencia) {
      case 'MENSUAL':
        fecha.setMonth(fecha.getMonth() + numeroCuota - 1)
        break
      case 'BIMESTRAL':
        fecha.setMonth(fecha.getMonth() + (numeroCuota - 1) * 2)
        break
      case 'TRIMESTRAL':
        fecha.setMonth(fecha.getMonth() + (numeroCuota - 1) * 3)
        break
      case 'SEMESTRAL':
        fecha.setMonth(fecha.getMonth() + (numeroCuota - 1) * 6)
        break
      case 'ANUAL':
        fecha.setFullYear(fecha.getFullYear() + numeroCuota - 1)
        break
      default:
        fecha.setMonth(fecha.getMonth() + numeroCuota - 1)
    }
    
    return fecha
  }
  
  /**
   * Calcula el saldo deudor en una fecha específica
   */
  static calcularSaldoDeudor(
    tablaAmortizacion: TablaAmortizacion[],
    fecha: Date
  ): number {
    const cuotasVencidas = tablaAmortizacion.filter(
      cuota => cuota.fechaVencimiento <= fecha
    )
    
    if (cuotasVencidas.length === 0) {
      return tablaAmortizacion[0]?.saldoCapital || 0
    }
    
    const ultimaCuotaVencida = cuotasVencidas[cuotasVencidas.length - 1]
    return ultimaCuotaVencida.saldoCapitalPosterior
  }
  
  /**
   * Calcula los intereses acumulados hasta una fecha
   */
  static calcularInteresesAcumulados(
    tablaAmortizacion: TablaAmortizacion[],
    fecha: Date
  ): number {
    const cuotasVencidas = tablaAmortizacion.filter(
      cuota => cuota.fechaVencimiento <= fecha
    )
    
    return cuotasVencidas.reduce((total, cuota) => total + cuota.montoInteres, 0)
  }

  /**
   * Calcula cuotas personalizadas con intereses
   */
  static calcularCuotasPersonalizadas(
    cuotas: CuotaPersonalizada[],
    tasaInteresAnual: number,
    saldoPendiente: number
  ): CalculoCuotasPersonalizadas {
    if (!cuotas || cuotas.length === 0) {
      return {
        cuotas: [],
        totalCapital: 0,
        totalIntereses: 0,
        totalCuotas: 0
      }
    }

    // Calcular la tasa de interés por día
    const tasaInteresDiaria = tasaInteresAnual / 365 / 100
    
    const cuotasConIntereses: CuotaPersonalizada[] = []
    let saldoRestante = saldoPendiente
    let totalIntereses = 0
    
    // Ordenar cuotas por fecha para calcular intereses cronológicamente
    const cuotasOrdenadas = [...cuotas].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )
    
    // Usar la fecha actual como fecha inicial
    const fechaInicial = new Date()
    
    for (let i = 0; i < cuotasOrdenadas.length; i++) {
      const cuota = cuotasOrdenadas[i]
      const fechaCuota = new Date(cuota.fecha)
      
      // Validar que la fecha sea válida
      if (isNaN(fechaCuota.getTime())) {
        console.error(`Fecha inválida en cuota ${i + 1}:`, cuota.fecha)
        continue
      }
      
      // Calcular días desde la fecha actual hasta esta cuota
      const diasTranscurridos = Math.floor((fechaCuota.getTime() - fechaInicial.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calcular intereses sobre el saldo restante
      const intereses = Math.max(0, saldoRestante * tasaInteresDiaria * diasTranscurridos)
      totalIntereses += intereses
      
      // El monto con intereses es el monto original más los intereses
      const montoConIntereses = Math.max(0, cuota.monto + intereses)
      
      cuotasConIntereses.push({
        ...cuota,
        monto: Math.round(montoConIntereses * 100) / 100,
        intereses: Math.round(intereses * 100) / 100
      })
      
      // Actualizar saldo restante (restando el monto original)
      saldoRestante -= cuota.monto
    }
    
    return {
      cuotas: cuotasConIntereses,
      totalCapital: saldoPendiente,
      totalIntereses: Math.round(totalIntereses * 100) / 100,
      totalCuotas: cuotasConIntereses.length
    }
  }

  /**
   * Valida que las cuotas personalizadas sumen el monto correcto
   */
  static validarCuotasPersonalizadas(
    cuotas: CuotaPersonalizada[],
    montoTotal: number,
    tolerancia: number = 0.01
  ): { valido: boolean; mensaje: string } {
    if (!cuotas || cuotas.length === 0) {
      return { valido: false, mensaje: 'Debe agregar al menos una cuota personalizada' }
    }

    const sumaCuotas = cuotas.reduce((total, cuota) => total + cuota.monto, 0)
    const diferencia = Math.abs(sumaCuotas - montoTotal)
    
    if (diferencia > tolerancia) {
      return { 
        valido: false, 
        mensaje: `La suma de las cuotas (${sumaCuotas.toFixed(2)}) no coincide con el monto total (${montoTotal.toFixed(2)})` 
      }
    }

    // Validar que todas las fechas sean válidas
    const fechasInvalidas = cuotas.filter(cuota => isNaN(new Date(cuota.fecha).getTime()))
    if (fechasInvalidas.length > 0) {
      return { valido: false, mensaje: 'Hay fechas inválidas en las cuotas personalizadas' }
    }

    // Validar que las fechas estén en orden cronológico
    const cuotasOrdenadas = [...cuotas].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )
    
    for (let i = 0; i < cuotasOrdenadas.length - 1; i++) {
      const fechaActual = new Date(cuotasOrdenadas[i].fecha)
      const fechaSiguiente = new Date(cuotasOrdenadas[i + 1].fecha)
      
      if (fechaActual >= fechaSiguiente) {
        return { valido: false, mensaje: 'Las fechas de las cuotas deben estar en orden cronológico' }
      }
    }

    return { valido: true, mensaje: 'Cuotas personalizadas válidas' }
  }

  /**
   * Genera cuotas personalizadas automáticamente basadas en un patrón
   */
  static generarCuotasPersonalizadasAutomaticas(
    montoTotal: number,
    numeroCuotas: number,
    fechaInicial: Date,
    frecuencia: 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL',
    montoInicial?: number
  ): CuotaPersonalizada[] {
    const cuotas: CuotaPersonalizada[] = []
    const montoRestante = montoTotal - (montoInicial || 0)
    const montoCuotaBase = montoRestante / numeroCuotas
    
    let fechaActual = new Date(fechaInicial)
    
    // Si hay monto inicial, agregar como primera cuota
    if (montoInicial && montoInicial > 0) {
      cuotas.push({
        monto: montoInicial,
        fecha: fechaActual.toISOString().split('T')[0]
      })
    }
    
    // Generar cuotas restantes
    for (let i = 0; i < numeroCuotas; i++) {
      // Calcular fecha según frecuencia
      const fechaCuota = new Date(fechaActual)
      switch (frecuencia) {
        case 'MENSUAL':
          fechaCuota.setMonth(fechaCuota.getMonth() + i)
          break
        case 'BIMESTRAL':
          fechaCuota.setMonth(fechaCuota.getMonth() + (i * 2))
          break
        case 'TRIMESTRAL':
          fechaCuota.setMonth(fechaCuota.getMonth() + (i * 3))
          break
        case 'SEMESTRAL':
          fechaCuota.setMonth(fechaCuota.getMonth() + (i * 6))
          break
        case 'ANUAL':
          fechaCuota.setFullYear(fechaCuota.getFullYear() + i)
          break
      }
      
      // Para la última cuota, ajustar para que no quede saldo residual
      const montoCuota = i === numeroCuotas - 1 
        ? montoRestante - (montoCuotaBase * (numeroCuotas - 1))
        : montoCuotaBase
      
      cuotas.push({
        monto: Math.round(montoCuota * 100) / 100,
        fecha: fechaCuota.toISOString().split('T')[0]
      })
    }
    
    return cuotas
  }

  /**
   * Calcula intereses por mora para una cuota vencida
   */
  static calcularInteresesMora(
    saldoVencido: number,
    fechaVencimiento: Date,
    fechaActual: Date = new Date(),
    tasaMoraAnual: number = 24 // Por defecto 24% anual
  ): number {
    // Verificar que la cuota esté vencida
    if (fechaActual <= fechaVencimiento) {
      return 0
    }

    // Calcular días de atraso
    const diasAtraso = Math.floor((fechaActual.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diasAtraso <= 0) {
      return 0
    }

    // Calcular tasa de mora diaria
    const tasaMoraDiaria = tasaMoraAnual / 365 / 100
    
    // Calcular intereses por mora
    const interesesMora = saldoVencido * tasaMoraDiaria * diasAtraso
    
    return Math.round(interesesMora * 100) / 100
  }

  /**
   * Calcula el saldo total deudor incluyendo intereses por mora
   */
  static calcularSaldoTotalConMora(
    tablaAmortizacion: TablaAmortizacion[],
    fecha: Date,
    tasaMoraAnual: number = 24
  ): { saldoCapital: number; interesesMora: number; saldoTotal: number } {
    const cuotasVencidas = tablaAmortizacion.filter(
      cuota => cuota.fechaVencimiento <= fecha && cuota.saldoCapitalPosterior > 0
    )
    
    let saldoCapital = 0
    let interesesMora = 0
    
    if (cuotasVencidas.length > 0) {
      // El saldo capital es el saldo posterior de la última cuota vencida
      saldoCapital = cuotasVencidas[cuotasVencidas.length - 1].saldoCapitalPosterior
      
      // Calcular intereses por mora para cada cuota vencida
      cuotasVencidas.forEach(cuota => {
        const interesesCuota = this.calcularInteresesMora(
          cuota.saldoCapitalPosterior,
          cuota.fechaVencimiento,
          fecha,
          tasaMoraAnual
        )
        interesesMora += interesesCuota
      })
    }
    
    return {
      saldoCapital: Math.round(saldoCapital * 100) / 100,
      interesesMora: Math.round(interesesMora * 100) / 100,
      saldoTotal: Math.round((saldoCapital + interesesMora) * 100) / 100
    }
  }

  /**
   * Valida que una tasa de interés sea válida
   */
  static validarTasaInteres(tasaAnual: number): { valido: boolean; mensaje: string } {
    if (isNaN(tasaAnual)) {
      return { valido: false, mensaje: 'La tasa de interés debe ser un número válido' }
    }
    
    if (tasaAnual < 0) {
      return { valido: false, mensaje: 'La tasa de interés no puede ser negativa' }
    }
    
    if (tasaAnual > 100) {
      return { valido: false, mensaje: 'La tasa de interés no puede exceder el 100%' }
    }
    
    return { valido: true, mensaje: 'Tasa de interés válida' }
  }
} 