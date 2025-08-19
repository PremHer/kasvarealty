'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiDollarSign, FiCalendar, FiCheckCircle, FiClock, FiXCircle, FiPlus, FiX, FiUpload, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import React from 'react'

interface Cuota {
  id: string
  numeroCuota: number
  monto: number
  fechaVencimiento: string
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'PARCIAL'
  montoPagado?: number
  fechaPago?: string
  saldoCapitalAnterior?: number
  saldoCapitalPosterior?: number
  montoCapital?: number
  montoInteres?: number
  interesMora?: number
  diasVencidos?: number
  pagos?: PagoCuota[]
}

interface PagoCuota {
  id: string
  monto: number
  fechaPago: string
  metodoPago?: string
  observaciones?: string
  comprobantePago?: {
    id: string
    nombreArchivo: string
    driveFileUrl?: string
    localPath?: string
  }
  creadoPorUsuario?: {
    nombre: string
    email: string
  }
  createdAt: string
}

interface CuotasModalProps {
  isOpen: boolean
  onClose: () => void
  ventaId: string
}

export default function CuotasModal({ isOpen, onClose, ventaId }: CuotasModalProps) {
  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [loading, setLoading] = useState(false)
  const [ventaInfo, setVentaInfo] = useState<any>(null)
  const [calculandoAmortizacion, setCalculandoAmortizacion] = useState(false)
  const [tasaInteresAnual, setTasaInteresAnual] = useState<number>(0)
  const [tasaMoraAnual, setTasaMoraAnual] = useState<number>(0)
  const [calculandoMora, setCalculandoMora] = useState(false)
  const [expandedCuota, setExpandedCuota] = useState<string | null>(null)
  const [loadingPagos, setLoadingPagos] = useState<string | null>(null)
  const [pagoFormData, setPagoFormData] = useState({
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    formaPago: '',
    observaciones: '',
    comprobantes: [] as File[]
  })

  // Función para limpiar el formulario de pago
  const limpiarFormularioPago = () => {
    setPagoFormData({
      monto: '',
      fechaPago: new Date().toISOString().split('T')[0],
      formaPago: '',
      observaciones: '',
      comprobantes: []
    })
  }
  const [submittingPago, setSubmittingPago] = useState<string | null>(null)
  const [recalculandoSaldos, setRecalculandoSaldos] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && ventaId) {
      fetchCuotas()
    }
  }, [isOpen, ventaId])

  const fetchCuotas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cuotas?ventaId=${ventaId}`)
      if (!response.ok) {
        throw new Error('Error al cargar cuotas')
      }
      const data = await response.json()
      console.log('Cuotas recibidas:', data.cuotas)
      console.log('🔍 Verificando campos de mora en cuotas:', data.cuotas.map((c: any) => ({
        numeroCuota: c.numeroCuota,
        interesMora: c.interesMora,
        diasVencidos: c.diasVencidos
      })))
      setCuotas(data.cuotas)
      
      // También obtener información de la venta
      const ventaResponse = await fetch(`/api/ventas/${ventaId}`)
      if (ventaResponse.ok) {
        const ventaData = await ventaResponse.json()
        setVentaInfo(ventaData)
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las cuotas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPagosCuota = async (cuotaId: string) => {
    try {
      setLoadingPagos(cuotaId)
      const response = await fetch(`/api/cuotas/${cuotaId}/pagos`)
      if (response.ok) {
        const data = await response.json()
        setCuotas(prev => prev.map(cuota => 
          cuota.id === cuotaId 
            ? { ...cuota, pagos: data.pagos }
            : cuota
        ))
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pagos de la cuota',
        variant: 'destructive'
      })
    } finally {
      setLoadingPagos(null)
    }
  }

  const toggleCuotaExpansion = (cuotaId: string) => {
    if (expandedCuota === cuotaId) {
      // Si se está cerrando la misma cuota, solo cerrar
      setExpandedCuota(null)
    } else {
      // Si se está abriendo una cuota diferente, limpiar formulario y cambiar
      if (expandedCuota !== null) {
        limpiarFormularioPago()
      }
      setExpandedCuota(cuotaId)
      // Cargar pagos si no están cargados
      const cuota = cuotas.find(c => c.id === cuotaId)
      if (cuota && !cuota.pagos) {
        fetchPagosCuota(cuotaId)
      }
    }
  }

  const handlePagoSubmit = async (cuotaId: string) => {
    const cuota = cuotas.find(c => c.id === cuotaId)
    if (!cuota) return

    const montoPago = parseFloat(pagoFormData.monto)
    // Calcular monto pendiente incluyendo intereses por mora
    const montoBasePendiente = cuota.monto - (cuota.montoPagado || 0)
    const interesMora = cuota.interesMora || 0
    const montoPendiente = montoBasePendiente + interesMora
    
    // Redondear a 2 decimales para evitar problemas de precisión
    const montoPagoRedondeado = roundToTwoDecimals(montoPago)
    const montoPendienteRedondeado = roundToTwoDecimals(montoPendiente)

    // Debug logs para entender el problema
    console.log('🔍 Debug - Datos de pago con mora:', {
      cuotaId,
      montoCuota: cuota.monto,
      montoPagado: cuota.montoPagado,
      interesMora,
      montoBasePendiente,
      montoPendienteCalculado: montoPendiente,
      montoPendienteRedondeado,
      montoPagoIngresado: pagoFormData.monto,
      montoPagoRedondeado,
      diferencia: montoPagoRedondeado - montoPendienteRedondeado,
      tolerancia: 0.01,
      excedeTolerancia: (montoPagoRedondeado - montoPendienteRedondeado) > 0.01,
      calculoVerificacion: `${cuota.monto} + ${interesMora} - ${cuota.montoPagado || 0} = ${montoPendiente}`,
      valoresExactos: {
        montoPagoString: pagoFormData.monto,
        montoPagoParseFloat: parseFloat(pagoFormData.monto),
        montoPagoToFixed: parseFloat(pagoFormData.monto).toFixed(2),
        montoPagoFinal: montoPagoRedondeado
      }
    })

    if (!pagoFormData.monto || montoPagoRedondeado <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser mayor a 0',
        variant: 'destructive'
      })
      return
    }

    // Usar una comparación más tolerante para evitar problemas de precisión decimal
    const diferencia = montoPagoRedondeado - montoPendienteRedondeado
    const tolerancia = 0.01 // Tolerancia de 1 centavo
    
    console.log('🔍 Debug - Validación final:', {
      montoPagoRedondeado,
      montoPendienteRedondeado,
      diferencia,
      tolerancia,
      esValido: diferencia <= tolerancia,
      comparacionExacta: montoPagoRedondeado === montoPendienteRedondeado,
      comparacionTolerante: Math.abs(diferencia) <= tolerancia
    })
    
    if (diferencia > tolerancia) {
      const mensajeError = interesMora > 0 
        ? `El monto excede el pendiente. Máximo permitido: ${formatCurrency(montoPendienteRedondeado)} (Cuota base: ${formatCurrency(cuota.monto)} + Mora: ${formatCurrency(interesMora)} - Pagado: ${formatCurrency(cuota.montoPagado || 0)})`
        : `El monto excede el pendiente. Máximo permitido: ${formatCurrency(montoPendienteRedondeado)} (Cuota: ${formatCurrency(cuota.monto)} - Pagado: ${formatCurrency(cuota.montoPagado || 0)})`
      
      toast({
        title: 'Error',
        description: mensajeError,
        variant: 'destructive'
      })
      return
    }

    if (!pagoFormData.fechaPago) {
      toast({
        title: 'Error',
        description: 'La fecha de pago es requerida',
        variant: 'destructive'
      })
      return
    }

    setSubmittingPago(cuotaId)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('monto', montoPagoRedondeado.toString())
      formDataToSend.append('fechaPago', pagoFormData.fechaPago)
      formDataToSend.append('formaPago', pagoFormData.formaPago)
      formDataToSend.append('observaciones', pagoFormData.observaciones)

      // Agregar comprobantes si existen
      pagoFormData.comprobantes.forEach((archivo, index) => {
        formDataToSend.append(`comprobante_${index}`, archivo)
        formDataToSend.append(`comprobante_${index}_data`, JSON.stringify({
          nombreArchivo: archivo.name,
          tipo: 'CUOTA',
          monto: montoPagoRedondeado,
          fecha: pagoFormData.fechaPago,
          descripcion: `Pago cuota ${cuota.numeroCuota}`
        }))
      })

      const response = await fetch(`/api/cuotas/${cuotaId}/pagos`, {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        const result = await response.json()
        
        toast({
          title: 'Éxito',
          description: 'Pago registrado correctamente'
        })
        
        // Limpiar formulario
        setPagoFormData({
          monto: '',
          fechaPago: new Date().toISOString().split('T')[0],
          formaPago: '',
          observaciones: '',
          comprobantes: []
        })
        
        // Recargar datos
        await fetchCuotas()
        await fetchPagosCuota(cuotaId)
        
        // Limpiar formulario y cerrar
        limpiarFormularioPago()
        setExpandedCuota(null)
      } else {
        const error = await response.json()
        
        // NUEVO: Manejo específico para error de pago secuencial
        if (error.error && error.error.includes('orden secuencial')) {
          toast({
            title: 'Error de Orden de Pago',
            description: error.error,
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Error',
            description: error.error || 'Error al registrar el pago',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar el pago',
        variant: 'destructive'
      })
    } finally {
      setSubmittingPago(null)
    }
  }

  const handleFileUpload = (file: File) => {
    setPagoFormData(prev => ({
      ...prev,
      comprobantes: [...prev.comprobantes, file]
    }))
  }

  const removeComprobante = (index: number) => {
    setPagoFormData(prev => ({
      ...prev,
      comprobantes: prev.comprobantes.filter((_, i) => i !== index)
    }))
  }

  const getEstadoBadge = (cuota: any) => {
    // Si la cuota está pagada, mostrar como pagada
    if (cuota.estado === 'PAGADA') {
        return <Badge className="bg-green-100 text-green-800"><FiCheckCircle className="h-3 w-3 mr-1" />Pagada</Badge>
    }
    
    // Si la cuota está parcialmente pagada, mostrar como parcial
    if (cuota.estado === 'PARCIAL') {
      return <Badge className="bg-blue-100 text-blue-800"><FiClock className="h-3 w-3 mr-1" />Parcial</Badge>
    }
    
    // Si la cuota está pendiente, verificar si está vencida
    if (cuota.estado === 'PENDIENTE') {
      const fechaVencimiento = new Date(cuota.fechaVencimiento)
      const fechaActual = new Date()
      const estaVencida = fechaVencimiento < fechaActual
      
      if (estaVencida) {
        return <Badge className="bg-red-100 text-red-800"><FiXCircle className="h-3 w-3 mr-1" />Vencida</Badge>
      } else {
        return <Badge className="bg-yellow-100 text-yellow-800"><FiClock className="h-3 w-3 mr-1" />Pendiente</Badge>
      }
    }
    
    // Para otros estados, mostrar como están
    return <Badge variant="secondary">{cuota.estado}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  // Función helper para redondear a 2 decimales y evitar problemas de precisión
  const roundToTwoDecimals = (value: number): number => {
    // Usar toFixed(2) y parseFloat para asegurar precisión de 2 decimales
    return parseFloat(value.toFixed(2))
  }

  const calcularTotales = () => {
    const totalCuotas = cuotas.length
    const cuotasPagadas = cuotas.filter(c => c.estado === 'PAGADA').length
    const montoTotal = cuotas.reduce((sum, c) => sum + c.monto, 0)
    const montoPagado = cuotas.reduce((sum, c) => sum + (c.montoPagado || 0), 0)

    return { totalCuotas, cuotasPagadas, montoTotal, montoPagado }
  }

  const { totalCuotas, cuotasPagadas, montoTotal, montoPagado } = calcularTotales()

  const calcularAmortizacion = async () => {
    if (!ventaInfo?.tasaInteres || ventaInfo.tasaInteres <= 0) {
      toast({
        title: 'Error',
        description: 'Esta venta no tiene intereses configurados',
        variant: 'destructive'
      })
      return
    }

    setCalculandoAmortizacion(true)
    try {
      const response = await fetch(`/api/ventas/${ventaId}/calcular-amortizacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tasaInteresAnual: ventaInfo.tasaInteres
        })
      })

      if (response.ok) {
      toast({
        title: 'Éxito',
          description: 'Amortización calculada correctamente'
        })
        await fetchCuotas()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al calcular amortización')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al calcular amortización',
        variant: 'destructive'
      })
    } finally {
      setCalculandoAmortizacion(false)
    }
  }

  // Función para determinar si una cuota se puede pagar
  const puedePagarCuota = (cuota: any) => {
    if (cuota.estado === 'PAGADA') return false
    
    // Si es la primera cuota, siempre se puede pagar
    if (cuota.numeroCuota === 1) return true
    
    // Buscar la cuota anterior
    const cuotaAnterior = cuotas.find(c => c.numeroCuota === cuota.numeroCuota - 1)
    if (!cuotaAnterior) return true
    
    // Solo se puede pagar si la cuota anterior está completamente pagada
    return cuotaAnterior.estado === 'PAGADA'
  }

  // Función para obtener el estado de pago de una cuota
  const getEstadoPago = (cuota: any) => {
    if (cuota.estado === 'PAGADA') return 'Completamente pagada'
    if (cuota.estado === 'PARCIAL') return 'Pago parcial'
    if (cuota.estado === 'VENCIDA') return 'Vencida'
    
    // Verificar si se puede pagar
    if (puedePagarCuota(cuota)) {
      return 'Lista para pagar'
    } else {
      return 'Esperando pago de cuota anterior'
    }
  }

  // Función para recalcular saldos de capital
  const recalcularSaldos = async () => {
    try {
      setRecalculandoSaldos(true)
      
      const response = await fetch(`/api/ventas/${ventaId}/recalcular-saldos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Saldos de capital recalculados correctamente'
        })
        
        // Recargar cuotas para mostrar los nuevos saldos
        await fetchCuotas()
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Error al recalcular saldos',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error al recalcular saldos:', error)
      toast({
        title: 'Error',
        description: 'Error al recalcular saldos',
        variant: 'destructive'
      })
    } finally {
      setRecalculandoSaldos(false)
    }
  }

  // Función para calcular intereses por mora
  const calcularInteresesMora = async () => {
    if (!tasaMoraAnual || tasaMoraAnual <= 0) {
      toast({
        title: 'Error',
        description: 'Debe ingresar una tasa de mora válida',
        variant: 'destructive'
      })
      return
    }

    setCalculandoMora(true)
    try {
      const response = await fetch(`/api/ventas/${ventaId}/calcular-mora`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tasaMoraAnual: tasaMoraAnual
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Resultado del cálculo de mora:', result)
        toast({
          title: 'Éxito',
          description: `Intereses por mora calculados: ${formatCurrency(result.totalMora)}`
        })
        console.log('🔄 Recargando cuotas...')
        await fetchCuotas()
        console.log('✅ Cuotas recargadas después del cálculo de mora')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al calcular intereses por mora')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al calcular intereses por mora',
        variant: 'destructive'
      })
    } finally {
      setCalculandoMora(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiDollarSign className="h-5 w-5" />
            Cuotas de la Venta
            {ventaInfo && (
              <span className="text-sm text-gray-500">
                - {ventaInfo.cliente?.nombre} {ventaInfo.cliente?.apellido}
                {ventaInfo?.lote?.codigo || ventaInfo?.unidad?.codigo ? (
                  <span className="ml-2 text-blue-600 font-semibold">
                    {ventaInfo?.tipoVenta === 'LOTE' ? 'LOTE' : 
                     ventaInfo?.tipoVenta === 'UNIDAD_CEMENTERIO' ? 'UNIDAD CEMENTERIO' : 
                     'UNIDAD'} {ventaInfo.lote?.codigo || ventaInfo.unidad?.codigo}
                  </span>
                ) : null}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{totalCuotas}</div>
                <div className="text-sm font-medium text-gray-700">Total Cuotas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{cuotasPagadas}</div>
                <div className="text-sm font-medium text-gray-700">Pagadas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{totalCuotas - cuotasPagadas}</div>
                <div className="text-sm font-medium text-gray-700">Pendientes</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{formatCurrency(montoTotal)}</div>
                <div className="text-sm font-medium text-gray-700">Monto Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{formatCurrency(montoPagado)}</div>
                <div className="text-sm font-medium text-gray-700">Pagado</div>
              </div>
            </div>

            {/* Botón para recalcular saldos - Solo para ventas con intereses */}
            {ventaInfo?.tasaInteres && ventaInfo.tasaInteres > 0 && (
              <div className="flex justify-end">
                <Button 
                  onClick={recalcularSaldos} 
                  variant="outline" 
                  size="sm"
                  disabled={recalculandoSaldos}
                  className="text-xs"
                >
                  {recalculandoSaldos ? 'Recalculando...' : 'Recalcular Saldos de Capital'}
                </Button>
              </div>
            )}

            {/* Sección para calcular amortización solo si la venta tiene intereses configurados pero no calculados */}
            {cuotas.length > 0 && 
             ventaInfo?.tasaInteres && 
             ventaInfo.tasaInteres > 0 && 
             cuotas.every(c => !c.montoCapital && !c.montoInteres) && (
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Amortización Pendiente</h3>
                    <p className="text-sm text-yellow-700 mt-2">
                      Esta venta tiene intereses configurados ({ventaInfo.tasaInteres}% anual) pero no se han calculado los datos de amortización.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={calcularAmortizacion}
                      disabled={calculandoAmortizacion}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
                      size="sm"
                    >
                      {calculandoAmortizacion ? 'Calculando...' : 'Calcular Amortización'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sección para calcular intereses por mora */}
            {cuotas.length > 0 && cuotas.some(c => new Date(c.fechaVencimiento) < new Date() && (c.monto - (c.montoPagado || 0)) > 0) && (
              <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Cuotas Vencidas Detectadas</h3>
                    <p className="text-sm text-red-700 mt-2">
                      Hay cuotas vencidas con saldo pendiente. Puede calcular intereses por mora.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={tasaMoraAnual}
                        onChange={(e) => setTasaMoraAnual(parseFloat(e.target.value) || 0)}
                        placeholder="Tasa Mora %"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <span className="text-sm font-medium text-gray-700">% anual</span>
                    </div>
                    <Button
                      onClick={calcularInteresesMora}
                      disabled={calculandoMora || !tasaMoraAnual}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                      size="sm"
                    >
                      {calculandoMora ? 'Calculando...' : 'Calcular Mora'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Indicador de tipo de venta */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${ventaInfo?.tasaInteres && ventaInfo.tasaInteres > 0 ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {ventaInfo?.tasaInteres && ventaInfo.tasaInteres > 0 
                    ? `Venta con intereses (${ventaInfo.tasaInteres}% anual)` 
                    : 'Venta sin intereses (cuotas fijas)'
                  }
                </span>
              </div>
            </div>

            {/* Tabla de cuotas */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold text-gray-700">#</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Vencimiento</th>
                    <th className="text-right p-4 font-semibold text-gray-700">Monto</th>
                    {ventaInfo?.tasaInteres && ventaInfo.tasaInteres > 0 ? (
                      <>
                        <th className="text-right p-4 font-semibold text-gray-700">Capital</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Interés</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Saldo Anterior</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Saldo Posterior</th>
                      </>
                    ) : null}
                    <th className="text-right p-4 font-semibold text-gray-700">Mora</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Estado</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuotas.map((cuota) => {
                    // Calcular monto pendiente incluyendo intereses por mora
                    const montoBasePendiente = cuota.monto - (cuota.montoPagado || 0)
                    const interesMora = cuota.interesMora || 0
                    const montoPendiente = roundToTwoDecimals(montoBasePendiente + interesMora)
                    const montoTotalConMora = cuota.monto + interesMora
                    const porcentajePagado = ((cuota.montoPagado || 0) / montoTotalConMora) * 100
                    const isExpanded = expandedCuota === cuota.id
                    
                    // Debug log para la cuota actual
                    if (isExpanded) {
                      console.log('🔍 Debug - Cuota expandida:', {
                        cuotaId: cuota.id,
                        numeroCuota: cuota.numeroCuota,
                        montoCuota: cuota.monto,
                        montoPagado: cuota.montoPagado,
                        montoPendiente,
                        porcentajePagado
                      })
                    }
                    
                    return (
                      <React.Fragment key={cuota.id}>
                        <tr className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-semibold text-gray-900">{cuota.numeroCuota}</td>
                          <td className="p-4 text-gray-700">{formatDate(cuota.fechaVencimiento)}</td>
                          <td className="p-4 text-right font-semibold text-gray-900">{formatCurrency(cuota.monto)}</td>
                          {ventaInfo?.tasaInteres && ventaInfo.tasaInteres > 0 ? (
                            <>
                              <td className="p-4 text-right text-green-600 font-medium">
                        {cuota.montoCapital ? formatCurrency(cuota.montoCapital) : '-'}
                      </td>
                              <td className="p-4 text-right text-blue-600 font-medium">
                        {cuota.montoInteres ? formatCurrency(cuota.montoInteres) : '-'}
                      </td>
                              <td className="p-4 text-right text-gray-600">
                        {cuota.saldoCapitalAnterior ? formatCurrency(cuota.saldoCapitalAnterior) : '-'}
                      </td>
                              <td className="p-4 text-right text-gray-600">
                        {cuota.saldoCapitalPosterior ? formatCurrency(cuota.saldoCapitalPosterior) : '-'}
                      </td>
                            </>
                          ) : null}
                          <td className="p-4 text-right text-red-600 font-medium">
                            {cuota.interesMora && cuota.interesMora > 0 ? (
                              <div className="text-xs">
                                <div>{formatCurrency(cuota.interesMora)}</div>
                                <div className="text-gray-500">({cuota.diasVencidos} días)</div>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-4 text-center">{getEstadoBadge(cuota)}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {montoPendiente > 0 && puedePagarCuota(cuota) && (
                          <Button
                            size="sm"
                            variant="outline"
                                  onClick={() => toggleCuotaExpansion(cuota.id)}
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          >
                                  <FiPlus className="h-3 w-3 mr-1" />
                            Pagar
                          </Button>
                        )}
                              {montoPendiente > 0 && !puedePagarCuota(cuota) && (
                          <Button
                            size="sm"
                            variant="secondary"
                                  disabled
                            className="opacity-50 cursor-not-allowed"
                            title={getEstadoPago(cuota)}
                          >
                                  <FiClock className="h-3 w-3 mr-1" />
                            Esperando
                          </Button>
                        )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleCuotaExpansion(cuota.id)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                {isExpanded ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                      </td>
                    </tr>
                        
                        {/* Fila expandible para pagos */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan={ventaInfo?.tasaInteres && ventaInfo.tasaInteres > 0 ? 10 : 6} className="p-6">
                              <div className="space-y-6">
                                {/* Resumen de la cuota */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-900">
                                      {formatCurrency(montoTotalConMora)}
                                      {interesMora > 0 && (
                                        <div className="text-xs text-red-600">
                                          + {formatCurrency(interesMora)} mora
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600">Monto Total de Cuota</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">{formatCurrency(cuota.montoPagado || 0)}</div>
                                    <div className="text-sm text-gray-600">Total Pagado</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-orange-600">{formatCurrency(montoPendiente)}</div>
                                    <div className="text-sm text-gray-600">Pendiente por Pagar</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">{Math.round(porcentajePagado)}%</div>
                                    <div className="text-sm text-gray-600">Progreso de Pago</div>
                                  </div>
                                </div>

                                {/* Barra de progreso */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Progreso de pago</span>
                                    <span>{Math.round(porcentajePagado)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                                      style={{ width: `${porcentajePagado}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Formulario de pago */}
                                {montoPendiente > 0 && (
                                  <div className="p-3 bg-white rounded-lg border">
                                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Registrar Nuevo Pago</h4>
                                    
                                    {/* Primera fila: Monto, Fecha y Forma de Pago */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                      <div>
                                        <Label htmlFor="monto" className="text-xs font-medium">Monto a Pagar *</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={pagoFormData.monto}
                                          onChange={(e) => setPagoFormData(prev => ({ ...prev, monto: e.target.value }))}
                                          placeholder="0.00"
                                          max={montoPendiente}
                                          className="h-8 text-sm"
                                        />
                                        <div className="text-xs text-gray-500 mt-1">
                                          Máx: <span className="font-semibold text-orange-600">{formatCurrency(montoPendiente)}</span>
                                        </div>
                                        {pagoFormData.monto && parseFloat(pagoFormData.monto) > montoPendiente && (
                                          <p className="text-xs text-red-600 font-medium mt-1">
                                            ⚠️ Monto excede el disponible
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <Label htmlFor="fechaPago" className="text-xs font-medium">Fecha de Pago *</Label>
                                        <Input
                                          type="date"
                                          value={pagoFormData.fechaPago}
                                          onChange={(e) => setPagoFormData(prev => ({ ...prev, fechaPago: e.target.value }))}
                                          className="h-8 text-sm"
                                        />
                                      </div>

                                      <div>
                                        <Label htmlFor="formaPago" className="text-xs font-medium">Forma de Pago</Label>
                                        <Select value={pagoFormData.formaPago} onValueChange={(value) => setPagoFormData(prev => ({ ...prev, formaPago: value }))}>
                                          <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Seleccionar" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                            <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                            <SelectItem value="DEPOSITO">Depósito</SelectItem>
                                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                                            <SelectItem value="TARJETA">Tarjeta</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label htmlFor="comprobantes" className="text-xs font-medium">Comprobantes</Label>
                                        <Input
                                          type="file"
                                          accept=".pdf,.jpg,.jpeg,.png"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleFileUpload(file)
                                          }}
                                          multiple
                                          className="h-8 text-xs"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">PDF, JPG o PNG (máx. 5MB)</p>
                                      </div>
                                    </div>

                                    {/* Información de cuota */}
                                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                      <div className="flex justify-between">
                                        <span>Cuota: {formatCurrency(montoTotalConMora)}</span>
                                        <span>Pagado: {formatCurrency(cuota.montoPagado || 0)}</span>
                                        <span>Pendiente: {formatCurrency(montoPendiente)}</span>
                                      </div>
                                      {interesMora > 0 && (
                                        <div className="flex justify-between mt-1 text-red-600">
                                          <span>Mora: {formatCurrency(interesMora)} ({cuota.diasVencidos} días)</span>
                                        </div>
                                      )}
                                    </div>



                                    {/* Observaciones y Botones en la misma fila */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                      <div className="md:col-span-2">
                                        <Label htmlFor="observaciones" className="text-xs font-medium">Observaciones</Label>
                                        <Textarea
                                          value={pagoFormData.observaciones}
                                          onChange={(e) => setPagoFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                          placeholder="Observaciones del pago..."
                                          rows={1}
                                          className="text-sm"
                                        />
                                      </div>

                                      <div className="flex flex-col justify-end gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setExpandedCuota(null)
                                            setPagoFormData({
                                              monto: '',
                                              fechaPago: new Date().toISOString().split('T')[0],
                                              formaPago: '',
                                              observaciones: '',
                                              comprobantes: []
                                            })
                                          }}
                                          className="h-8 text-xs"
                                        >
                                          Cancelar
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => handlePagoSubmit(cuota.id)}
                                          disabled={
                                            submittingPago === cuota.id || 
                                            !pagoFormData.monto || 
                                            parseFloat(pagoFormData.monto) <= 0 ||
                                            parseFloat(pagoFormData.monto) > montoPendiente
                                          }
                                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed h-8 text-xs"
                                        >
                                          {submittingPago === cuota.id ? 'Registrando...' : 'Registrar Pago'}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Comprobantes seleccionados - Solo si hay archivos */}
                                    {pagoFormData.comprobantes.length > 0 && (
                                      <div className="mb-3">
                                        <Label className="text-xs font-medium">Comprobantes seleccionados:</Label>
                                        <div className="space-y-1 mt-1">
                                          {pagoFormData.comprobantes.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                                              <span className="text-gray-700 truncate">{file.name}</span>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeComprobante(index)}
                                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                              >
                                                <FiX className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}


                                  </div>
                                )}

                                {/* Historial de pagos */}
                                <div className="p-3 bg-white rounded-lg border">
                                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Historial de Pagos</h4>
                                  {loadingPagos === cuota.id ? (
                                    <div className="flex items-center justify-center py-2">
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                    </div>
                                  ) : cuota.pagos && cuota.pagos.length > 0 ? (
                                    <div className="space-y-2">
                                      {cuota.pagos.map((pago) => (
                                        <div key={pago.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <div className="font-medium text-gray-900">
                                                {formatCurrency(pago.monto)}
                                              </div>
                                              <div className="text-gray-600">
                                                {formatDate(pago.fechaPago)}
                                              </div>
                                              {pago.metodoPago && (
                                                <Badge variant="outline" className="text-xs px-1 py-0">
                                                  {pago.metodoPago}
                                                </Badge>
                                              )}
                                            </div>
                                            {pago.observaciones && (
                                              <p className="text-gray-600 mt-1 truncate">{pago.observaciones}</p>
                                            )}
                                            {pago.comprobantePago && (
                                              <div className="flex items-center gap-1 mt-1">
                                                <FiUpload className="h-3 w-3 text-gray-500" />
                                                <a 
                                                  href={pago.comprobantePago.driveFileUrl || pago.comprobantePago.localPath} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 truncate"
                                                >
                                                  {pago.comprobantePago.nombreArchivo}
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-gray-500 ml-2 text-right">
                                            {pago.creadoPorUsuario && (
                                              <div className="truncate">Por: {pago.creadoPorUsuario.nombre}</div>
                                            )}
                                            <div>{formatDate(pago.createdAt)}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-center py-2 text-sm">No hay pagos registrados para esta cuota</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Progreso de pago */}
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Progreso de pago</span>
                  <span className="text-2xl font-bold text-green-600">{Math.round((montoPagado / montoTotal) * 100)}%</span>
              </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(montoPagado / montoTotal) * 100}%` }}
                ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Pagado: {formatCurrency(montoPagado)}</span>
                  <span>Total: {formatCurrency(montoTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 