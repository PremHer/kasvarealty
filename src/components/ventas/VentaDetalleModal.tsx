'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { FiEdit2, FiDollarSign, FiCalendar, FiUser, FiHome, FiTrendingUp, FiX } from 'react-icons/fi'
import ReprogramarCuotasModal from './ReprogramarCuotasModal'
import HistorialReprogramaciones from './HistorialReprogramaciones'

interface VentaDetalleModalProps {
  isOpen: boolean
  onClose: () => void
  ventaId: string
}

interface Cuota {
  id: string
  numeroCuota: number
  monto: number
  fechaVencimiento: string
  estado: string
  montoPagado: number
  montoCapital?: number
  montoInteres?: number
}

interface Venta {
  id: string
  tipoVenta: string
  estado: string
  precioVenta: number
  fechaVenta: string
  metodoPago?: string
  modeloAmortizacion?: string
  tasaInteres?: number
  frecuenciaCuota?: string
  cuotas: Cuota[]
  cliente: {
    id: string
    nombre: string
    apellido?: string
    email?: string
  }
  vendedor: {
    id: string
    nombre: string
    email: string
  }
  aprobador?: {
    id: string
    nombre: string
    email: string
  }
  unidad?: any
  proyectoId?: string
  createdAt: string
}

export default function VentaDetalleModal({
  isOpen,
  onClose,
  ventaId
}: VentaDetalleModalProps) {
  const { toast } = useToast()
  const [venta, setVenta] = useState<Venta | null>(null)
  const [reprogramaciones, setReprogramaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showReprogramarModal, setShowReprogramarModal] = useState(false)

  // Cargar datos de la venta
  useEffect(() => {
    if (isOpen && ventaId) {
      cargarDatosVenta()
    }
  }, [isOpen, ventaId])

  const cargarDatosVenta = async () => {
    setLoading(true)
    try {
      // Cargar datos de la venta
      const responseVenta = await fetch(`/api/ventas/${ventaId}`)
      if (!responseVenta.ok) throw new Error('Error al cargar datos de venta')
      const ventaData = await responseVenta.json()
      setVenta(ventaData)

      // Cargar historial de reprogramaciones
      const responseReprogramaciones = await fetch(`/api/ventas/${ventaId}/reprogramaciones`)
      if (responseReprogramaciones.ok) {
        const reprogramacionesData = await responseReprogramaciones.json()
        setReprogramaciones(reprogramacionesData.reprogramaciones || [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de la venta',
        variant: 'destructive'
      })
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getEstadoBadge = (estado: string) => {
    const estados = {
      'PENDIENTE': { variant: 'secondary' as const, text: 'Pendiente' },
      'APROBADA': { variant: 'default' as const, text: 'Aprobada' },
      'CANCELADA': { variant: 'destructive' as const, text: 'Cancelada' }
    }
    const config = estados[estado as keyof typeof estados] || { variant: 'outline' as const, text: estado }
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const calcularTotales = () => {
    if (!venta?.cuotas) return { total: 0, pagado: 0, pendiente: 0 }
    
    const total = venta.cuotas.reduce((sum, cuota) => sum + cuota.monto, 0)
    const pagado = venta.cuotas.reduce((sum, cuota) => sum + (cuota.montoPagado || 0), 0)
    const pendiente = total - pagado
    
    return { total, pagado, pendiente }
  }

  if (!venta && !loading) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FiHome className="h-5 w-5" />
              Detalle de Venta #{ventaId.slice(-8)}
            </DialogTitle>
            <DialogDescription>
              Información completa de la venta y su historial de cambios
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Cargando datos...</span>
              </div>
            </div>
          ) : venta ? (
            <div className="space-y-6">
              {/* Información General */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FiHome className="h-4 w-4" />
                      Información General
                    </span>
                    {venta.estado === 'APROBADA' && (venta.metodoPago === 'CUOTAS' || venta.metodoPago === 'cuotas') && (
                      <Button
                        size="sm"
                        onClick={() => setShowReprogramarModal(true)}
                        className="flex items-center gap-2"
                      >
                        <FiEdit2 className="h-4 w-4" />
                        Reprogramar Cuotas
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Cliente</h4>
                        <div className="flex items-center gap-2">
                          <FiUser className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {venta.cliente.nombre} {venta.cliente.apellido}
                            </div>
                            {venta.cliente.email && (
                              <div className="text-sm text-gray-500">{venta.cliente.email}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Vendedor</h4>
                        <div className="flex items-center gap-2">
                          <FiUser className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{venta.vendedor.nombre}</div>
                            <div className="text-sm text-gray-500">{venta.vendedor.email}</div>
                          </div>
                        </div>
                      </div>

                      {venta.aprobador && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Aprobador</h4>
                          <div className="flex items-center gap-2">
                            <FiUser className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{venta.aprobador.nombre}</div>
                              <div className="text-sm text-gray-500">{venta.aprobador.email}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Detalles de Venta</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Precio:</span>
                            <span className="font-medium">{formatCurrency(venta.precioVenta)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Método de Pago:</span>
                            <span className="font-medium">{venta.metodoPago || 'No especificado'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estado:</span>
                            {getEstadoBadge(venta.estado)}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fecha de Venta:</span>
                            <span className="font-medium">{formatDate(venta.fechaVenta)}</span>
                          </div>
                        </div>
                      </div>

                      {venta.metodoPago === 'CUOTAS' || venta.metodoPago === 'cuotas' ? (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Plan de Amortización</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Modelo:</span>
                              <span className="font-medium">{venta.modeloAmortizacion || 'No especificado'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tasa de Interés:</span>
                              <span className="font-medium">{venta.tasaInteres ? `${venta.tasaInteres}%` : 'No especificada'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Frecuencia:</span>
                              <span className="font-medium">{venta.frecuenciaCuota || 'No especificada'}</span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs para Cuotas e Historial */}
              <Tabs defaultValue="cuotas" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="cuotas" className="flex items-center gap-2">
                    <FiDollarSign className="h-4 w-4" />
                    Cuotas ({venta.cuotas?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="flex items-center gap-2">
                    <FiTrendingUp className="h-4 w-4" />
                    Historial ({reprogramaciones.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cuotas" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FiDollarSign className="h-4 w-4" />
                        Cuotas de Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {venta.cuotas && venta.cuotas.length > 0 ? (
                        <div className="space-y-4">
                          {/* Resumen de totales */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(calcularTotales().total)}
                                </div>
                                <div className="text-sm text-gray-500">Total</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-green-600">
                                  {formatCurrency(calcularTotales().pagado)}
                                </div>
                                <div className="text-sm text-gray-500">Pagado</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-orange-600">
                                  {formatCurrency(calcularTotales().pendiente)}
                                </div>
                                <div className="text-sm text-gray-500">Pendiente</div>
                              </div>
                            </div>
                          </div>

                          {/* Lista de cuotas */}
                          <div className="space-y-2">
                            {venta.cuotas.map((cuota) => (
                              <div key={cuota.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-medium text-blue-600">
                                        {cuota.numeroCuota}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium">Cuota {cuota.numeroCuota}</div>
                                      <div className="text-sm text-gray-500">
                                        Vence: {formatDate(cuota.fechaVencimiento)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">{formatCurrency(cuota.monto)}</div>
                                    <div className="text-sm text-gray-500">
                                      {cuota.montoPagado > 0 && (
                                        <span className="text-green-600">
                                          Pagado: {formatCurrency(cuota.montoPagado)}
                                        </span>
                                      )}
                                    </div>
                                    {getEstadoBadge(cuota.estado)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FiDollarSign className="h-12 w-12 mx-auto mb-2" />
                          <p>No hay cuotas registradas</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="historial" className="space-y-4">
                  <HistorialReprogramaciones reprogramaciones={reprogramaciones} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiX className="h-12 w-12 mx-auto mb-2" />
              <p>No se pudieron cargar los datos de la venta</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Reprogramación */}
      {venta && (
        <ReprogramarCuotasModal
          isOpen={showReprogramarModal}
          onClose={() => setShowReprogramarModal(false)}
          venta={venta}
          onReprogramacionSuccess={() => {
            cargarDatosVenta() // Recargar datos
            setShowReprogramarModal(false)
          }}
        />
      )}
    </>
  )
}
