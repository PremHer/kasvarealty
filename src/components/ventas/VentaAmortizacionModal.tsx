import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FiDollarSign, FiCalendar, FiPercent, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi'

interface Cuota {
  id: string
  numeroCuota: number
  fechaVencimiento: Date
  monto: number
  montoCapital: number
  montoInteres: number
  saldoCapitalAnterior: number
  saldoCapitalPosterior: number
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA'
  fechaPago?: Date
  comprobantesPago?: any[]
}

interface VentaAmortizacionModalProps {
  isOpen: boolean
  onClose: () => void
  ventaId: string
}

export default function VentaAmortizacionModal({
  isOpen,
  onClose,
  ventaId
}: VentaAmortizacionModalProps) {
  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [resumen, setResumen] = useState({
    totalCapital: 0,
    totalIntereses: 0,
    totalCuotas: 0,
    montoCuota: 0,
    cuotasPagadas: 0,
    cuotasPendientes: 0,
    cuotasVencidas: 0,
    montoPagado: 0,
    montoPendiente: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && ventaId) {
      fetchAmortizacion()
    }
  }, [isOpen, ventaId])

  const fetchAmortizacion = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ventas/${ventaId}/amortizacion`)
      if (response.ok) {
        const data = await response.json()
        setCuotas(data.cuotas || [])
        
        // Calcular resumen
        const totalCapital = data.cuotas?.reduce((sum: number, cuota: Cuota) => sum + cuota.montoCapital, 0) || 0
        const totalIntereses = data.cuotas?.reduce((sum: number, cuota: Cuota) => sum + cuota.montoInteres, 0) || 0
        const cuotasPagadas = data.cuotas?.filter((cuota: Cuota) => cuota.estado === 'PAGADA').length || 0
        const cuotasPendientes = data.cuotas?.filter((cuota: Cuota) => cuota.estado === 'PENDIENTE').length || 0
        const cuotasVencidas = data.cuotas?.filter((cuota: Cuota) => cuota.estado === 'VENCIDA').length || 0
        const montoPagado = data.cuotas?.filter((cuota: Cuota) => cuota.estado === 'PAGADA')
          .reduce((sum: number, cuota: Cuota) => sum + cuota.monto, 0) || 0
        const montoPendiente = data.cuotas?.filter((cuota: Cuota) => cuota.estado !== 'PAGADA')
          .reduce((sum: number, cuota: Cuota) => sum + cuota.monto, 0) || 0

        setResumen({
          totalCapital,
          totalIntereses,
          totalCuotas: data.cuotas?.length || 0,
          montoCuota: data.cuotas?.[0]?.monto || 0,
          cuotasPagadas,
          cuotasPendientes,
          cuotasVencidas,
          montoPagado,
          montoPendiente
        })
      } else {
        console.error('Error al obtener amortización:', response.statusText)
      }
    } catch (error) {
      console.error('Error al obtener amortización:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PAGADA':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><FiCheckCircle className="h-3 w-3" />Pagada</Badge>
      case 'PENDIENTE':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1"><FiClock className="h-3 w-3" />Pendiente</Badge>
      case 'VENCIDA':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1"><FiAlertCircle className="h-3 w-3" />Vencida</Badge>
      default:
        return <Badge variant="secondary">{estado}</Badge>
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiTrendingUp className="h-5 w-5" />
            Tabla de Amortización - Venta #{ventaId}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando tabla de amortización...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumen */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Crédito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <FiDollarSign className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-600">Capital Total</div>
                      <div className="font-semibold">{formatCurrency(resumen.totalCapital)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FiPercent className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm text-gray-600">Intereses Total</div>
                      <div className="font-semibold">{formatCurrency(resumen.totalIntereses)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FiTrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600">Monto Pagado</div>
                      <div className="font-semibold text-green-600">{formatCurrency(resumen.montoPagado)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FiCalendar className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="text-sm text-gray-600">Monto Pendiente</div>
                      <div className="font-semibold text-red-600">{formatCurrency(resumen.montoPendiente)}</div>
                    </div>
                  </div>
                </div>

                {/* Estado de cuotas */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{resumen.cuotasPagadas}</div>
                    <div className="text-sm text-green-700">Cuotas Pagadas</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{resumen.cuotasPendientes}</div>
                    <div className="text-sm text-blue-700">Cuotas Pendientes</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{resumen.cuotasVencidas}</div>
                    <div className="text-sm text-red-700">Cuotas Vencidas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Amortización */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tabla de Amortización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-center">Cuota</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Fecha Vencimiento</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Estado</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Saldo Anterior</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Capital</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Interés</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Cuota</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Saldo Posterior</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Fecha Pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuotas.map((cuota) => (
                        <tr key={cuota.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                            {cuota.numeroCuota}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {formatDate(cuota.fechaVencimiento)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {getEstadoBadge(cuota.estado)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {formatCurrency(cuota.saldoCapitalAnterior)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-blue-600">
                            {formatCurrency(cuota.montoCapital)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                            {formatCurrency(cuota.montoInteres)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                            {formatCurrency(cuota.monto)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            {formatCurrency(cuota.saldoCapitalPosterior)}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            {cuota.fechaPago ? formatDate(cuota.fechaPago) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={() => window.print()}>
                Imprimir Tabla
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 