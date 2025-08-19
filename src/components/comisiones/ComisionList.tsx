'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FiDollarSign, FiUser, FiHome, FiCalendar, FiPercent, FiEye, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { VentaConComision } from '@/types/comision'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ComisionListProps {
  ventas: VentaConComision[]
  loading: boolean
  onPagoComision: (venta: VentaConComision) => void
  onRefresh: () => void
}

export default function ComisionList({ 
  ventas, 
  loading, 
  onPagoComision, 
  onRefresh 
}: ComisionListProps) {
  const [expandedVenta, setExpandedVenta] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  const getEstadoComisionBadge = (estado: string) => {
    const config = {
      'PENDIENTE': {
        label: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳'
      },
      'PARCIAL': {
        label: 'Parcial',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '🔄'
      },
      'PAGADA': {
        label: 'Pagada',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      }
    }

    const configItem = config[estado as keyof typeof config] || config['PENDIENTE']

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${configItem.className}`}>
        <span>{configItem.icon}</span>
        {configItem.label}
      </Badge>
    )
  }

  const getTipoVentaBadge = (tipoVenta: string) => {
    const config = {
      'LOTE': {
        label: 'Lote',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'UNIDAD_CEMENTERIO': {
        label: 'Unidad Cementerio',
        className: 'bg-purple-100 text-purple-800 border-purple-200'
      }
    }

    const configItem = config[tipoVenta as keyof typeof config] || config['LOTE']

    return (
      <Badge variant="outline" className={configItem.className}>
        {configItem.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <FiRefreshCw className="h-5 w-5 animate-spin text-gray-500" />
            <span className="text-gray-500">Cargando comisiones...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (ventas.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <FiDollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay comisiones para mostrar</p>
            <p className="text-sm text-gray-400 mt-1">
              Las comisiones aparecerán aquí cuando haya ventas aprobadas con comisiones
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FiDollarSign className="h-5 w-5 text-green-600" />
            Comisiones de Vendedores
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ventas.map((venta) => (
            <div key={venta.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FiHome className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{venta.unidad.codigo}</span>
                  </div>
                  {getTipoVentaBadge(venta.tipoVenta)}
                  {getEstadoComisionBadge(venta.porcentajePagado >= 100 ? 'PAGADA' : 'PENDIENTE')}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedVenta(expandedVenta === venta.id ? null : venta.id)}
                  >
                    <FiEye className="h-4 w-4 mr-2" />
                    Detalles
                  </Button>
                  {venta.montoPendiente > 0 && (
                    <Button
                      size="sm"
                      onClick={() => onPagoComision(venta)}
                    >
                      <FiPlus className="h-4 w-4 mr-2" />
                      Registrar Pago
                    </Button>
                  )}
                </div>
              </div>

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <FiUser className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{venta.vendedor.nombre}</p>
                    <p className="text-xs text-gray-500">{venta.vendedor.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiDollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Comisión: {formatCurrency(venta.comisionVendedor)}</p>
                    {venta.porcentajeComision && (
                      <p className="text-xs text-gray-500">{venta.porcentajeComision}%</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiPercent className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Pagado: {formatCurrency(venta.montoPagado)}</p>
                    <p className="text-xs text-gray-500">{venta.porcentajePagado.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Fecha Venta</p>
                    <p className="text-xs text-gray-500">{formatDate(venta.fechaVenta)}</p>
                  </div>
                </div>
              </div>

              {/* Detalles expandidos */}
              {expandedVenta === venta.id && (
                <div className="border-t pt-4 space-y-4">
                  {/* Información del cliente */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm">
                        {venta.cliente.nombre} {venta.cliente.apellido || ''}
                      </p>
                    </div>
                  </div>

                  {/* Información de la venta */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Detalles de la Venta</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium">Precio de Venta</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(venta.precioVenta)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium">Comisión Pendiente</p>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(venta.montoPendiente)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Historial de pagos */}
                  {venta.pagosComisiones.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Historial de Pagos</h4>
                      <div className="space-y-2">
                        {venta.pagosComisiones.map((pago) => (
                          <div key={pago.id} className="bg-blue-50 p-3 rounded border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {formatCurrency(pago.monto)} - {pago.tipoPago}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatDate(pago.fechaPago)} - {pago.formaPago}
                                </p>
                                {pago.observaciones && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {pago.observaciones}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  Registrado por: {pago.creadoPorUsuario?.nombre}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 