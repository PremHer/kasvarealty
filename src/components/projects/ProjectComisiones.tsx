'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle, FiAlertCircle, FiPlus, FiFilter, FiRefreshCw, FiUser, FiHome, FiCalendar, FiPercent, FiChevronDown, FiChevronUp, FiDownload, FiEye } from 'react-icons/fi'
import { VentaConComision } from '@/types/comision'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import PagoComisionModal from '@/components/comisiones/PagoComisionModal'

interface ProjectComisionesProps {
  proyectoId: string
  tipoProyecto: string
}

export default function ProjectComisiones({ proyectoId, tipoProyecto }: ProjectComisionesProps) {
  const { toast } = useToast()
  const [ventas, setVentas] = useState<VentaConComision[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<VentaConComision | null>(null)
  const [expandedVentas, setExpandedVentas] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    totalVentas: 0,
    ventasPendientes: 0,
    ventasParciales: 0,
    ventasPagadas: 0,
    montoTotalComisiones: 0,
    montoTotalPagado: 0,
    montoTotalPendiente: 0
  })

  const fetchComisiones = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/comisiones?proyectoId=${proyectoId}`)
      if (!response.ok) {
        throw new Error('Error al cargar comisiones')
      }
      
      const data = await response.json()
      setVentas(data.ventas)
      setStats(data.stats)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las comisiones del proyecto',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComisiones()
  }, [proyectoId])

  const handlePagoComision = (venta: VentaConComision) => {
    setSelectedVenta(venta)
    setIsModalOpen(true)
  }

  const handlePagoSuccess = () => {
    fetchComisiones()
    setIsModalOpen(false)
    setSelectedVenta(null)
    toast({
      title: 'Pago registrado',
      description: 'El pago de comisión se registró correctamente',
      variant: 'default'
    })
  }

  const toggleExpandedVenta = (ventaId: string) => {
    const newExpanded = new Set(expandedVentas)
    if (newExpanded.has(ventaId)) {
      newExpanded.delete(ventaId)
    } else {
      newExpanded.add(ventaId)
    }
    setExpandedVentas(newExpanded)
  }

  const getTipoPagoBadge = (tipoPago: string) => {
    const config = {
      'PARCIAL': {
        label: 'Parcial',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🔄'
      },
      'COMPLETO': {
        label: 'Completo',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      }
    }

    const configItem = config[tipoPago as keyof typeof config] || config['PARCIAL']

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${configItem.className}`}>
        <span>{configItem.icon}</span>
        {configItem.label}
      </Badge>
    )
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2">
          <FiRefreshCw className="h-5 w-5 animate-spin text-gray-500" />
          <span className="text-gray-500">Cargando comisiones...</span>
        </div>
      </div>
    )
  }

  if (ventas.length === 0) {
    return (
      <div className="text-center py-12">
        <FiDollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay comisiones para este proyecto
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Las comisiones aparecerán aquí cuando haya ventas aprobadas con comisiones en este proyecto.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">Total Ventas</CardTitle>
            <FiDollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalVentas}</div>
            <p className="text-xs text-blue-700 mt-1">Con comisión</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-800">Pendientes</CardTitle>
            <FiClock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.ventasPendientes}</div>
            <p className="text-xs text-yellow-700 mt-1">Por pagar</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-800">Pagadas</CardTitle>
            <FiCheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.ventasPagadas}</div>
            <p className="text-xs text-green-700 mt-1">Completamente pagadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-800">Monto Pendiente</CardTitle>
            <FiAlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats.montoTotalPendiente)}</div>
            <p className="text-xs text-orange-700 mt-1">Por pagar</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de comisiones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Comisiones del Proyecto</h3>
          <Button variant="outline" size="sm" onClick={fetchComisiones}>
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        <div className="space-y-4">
          {ventas.map((venta) => (
            <div key={venta.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FiHome className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{venta.unidad.codigo}</span>
                  </div>
                  {getEstadoComisionBadge(venta.porcentajePagado >= 100 ? 'PAGADA' : 'PENDIENTE')}
                </div>
                <div className="flex items-center gap-2">
                  {venta.montoPendiente > 0 && (
                    <Button
                      size="sm"
                      onClick={() => handlePagoComision(venta)}
                    >
                      <FiPlus className="h-4 w-4 mr-2" />
                      Registrar Pago
                    </Button>
                  )}
                  {venta.pagosComisiones.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleExpandedVenta(venta.id)}
                    >
                      {expandedVentas.has(venta.id) ? (
                        <>
                          <FiChevronUp className="h-4 w-4 mr-2" />
                          Ocultar Pagos
                        </>
                      ) : (
                        <>
                          <FiChevronDown className="h-4 w-4 mr-2" />
                          Ver Pagos ({venta.pagosComisiones.length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Sección expandible de pagos realizados */}
              {expandedVentas.has(venta.id) && venta.pagosComisiones.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FiDollarSign className="h-4 w-4" />
                    Pagos Realizados ({venta.pagosComisiones.length})
                  </h4>
                  <div className="space-y-3">
                    {venta.pagosComisiones.map((pago) => (
                      <div key={pago.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                {formatDate(pago.fechaPago)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiDollarSign className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-green-600">
                                {formatCurrency(pago.monto)}
                              </span>
                            </div>
                            {getTipoPagoBadge(pago.tipoPago)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Registrado por: {pago.creadoPorUsuario?.nombre || 'Sistema'}
                          </div>
                        </div>
                        
                        {pago.observaciones && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Observaciones:</span> {pago.observaciones}
                          </p>
                        )}

                        {/* Comprobantes del pago */}
                        {pago.comprobantes && pago.comprobantes.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Comprobantes:</h5>
                            <div className="flex flex-wrap gap-2">
                              {pago.comprobantes.map((comprobante) => (
                                <div key={comprobante.id} className="flex items-center gap-2 bg-white rounded border p-2">
                                  <div className="flex items-center gap-2">
                                    <FiDownload className="h-3 w-3 text-gray-500" />
                                    <span className="text-xs text-gray-600">
                                      {comprobante.nombreArchivo}
                                    </span>
                                    {comprobante.guardadoLocal && (
                                      <Badge variant="outline" className="text-xs">
                                        Local
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    {comprobante.driveFileUrl && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => window.open(comprobante.driveFileUrl, '_blank')}
                                        title="Ver en Google Drive"
                                      >
                                        <FiEye className="h-3 w-3" />
                                      </Button>
                                    )}
                                    {comprobante.localFilePath && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => window.open(`/api/comprobantes-pago/${comprobante.id}/download`, '_blank')}
                                        title="Descargar archivo local"
                                      >
                                        <FiDownload className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de pago */}
      {selectedVenta && (
        <PagoComisionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedVenta(null)
          }}
          onSuccess={handlePagoSuccess}
          venta={selectedVenta}
        />
      )}
    </div>
  )
} 