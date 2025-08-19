'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FiAlertTriangle, FiCheckCircle, FiXCircle, FiClock, FiEye, FiCalendar, FiCheck, FiX } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'

interface Cancelacion {
  id: string
  tipoCancelacion: string
  motivoCancelacion: string
  fechaSolicitud: string
  fechaAprobacion?: string
  fechaCompletada?: string
  tipoDevolucion: string
  montoDevolucion?: number
  porcentajeDevolucion?: number
  motivoDevolucion?: string
  observaciones?: string
  estado: string
  creadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  }
  aprobadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  }
  ventaLote?: {
    id: string
    cliente: {
      nombre: string
      apellido?: string
    }
    lote: {
      codigo: string
    }
    proyecto: {
      nombre: string
    }
  }
  ventaUnidadCementerio?: {
    id: string
    cliente: {
      nombre: string
      apellido?: string
    }
    unidadCementerio: {
      codigo: string
    }
    proyecto: {
      nombre: string
    }
  }
}

interface CancelacionesGestionProps {
  ventaLoteId?: string
  ventaUnidadCementerioId?: string
  onCancelacionUpdated?: () => void
}

const TIPO_CANCELACION_LABELS: Record<string, string> = {
  SOLICITUD_CLIENTE: 'Solicitud del Cliente',
  INCUMPLIMIENTO_CLIENTE: 'Incumplimiento del Cliente',
  PROBLEMAS_FINANCIEROS: 'Problemas Financieros',
  CAMBIO_PLANES: 'Cambio de Planes',
  PROBLEMAS_LEGALES: 'Problemas Legales',
  OTRO: 'Otro'
}

const TIPO_DEVOLUCION_LABELS: Record<string, string> = {
  DEVOLUCION_COMPLETA: 'Devolución Completa',
  DEVOLUCION_PARCIAL: 'Devolución Parcial',
  SIN_DEVOLUCION: 'Sin Devolución',
  CREDITO_FUTURO: 'Crédito para Futura Compra',
  CAMBIO_PRODUCTO: 'Cambio por Otro Producto'
}

export default function CancelacionesGestion({ 
  ventaLoteId, 
  ventaUnidadCementerioId, 
  onCancelacionUpdated 
}: CancelacionesGestionProps) {
  const [cancelaciones, setCancelaciones] = useState<Cancelacion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCancelacion, setSelectedCancelacion] = useState<Cancelacion | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (ventaLoteId || ventaUnidadCementerioId) {
      fetchCancelaciones()
    }
  }, [ventaLoteId, ventaUnidadCementerioId])

  const fetchCancelaciones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (ventaLoteId) params.append('ventaLoteId', ventaLoteId)
      if (ventaUnidadCementerioId) params.append('ventaUnidadCementerioId', ventaUnidadCementerioId)

      const response = await fetch(`/api/cancelaciones?${params}`)
      if (!response.ok) {
        throw new Error('Error al cargar cancelaciones')
      }

      const data = await response.json()
      setCancelaciones(data.cancelaciones)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las cancelaciones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (cancelacionId: string, action: 'aprobar' | 'rechazar' | 'completar') => {
    if (!selectedCancelacion) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/cancelaciones/${cancelacionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion: action,
          observaciones: observaciones || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al procesar la cancelación')
      }

      const message = action === 'aprobar' ? 'Cancelación aprobada' : 
                    action === 'rechazar' ? 'Cancelación rechazada' : 
                    'Cancelación completada'

      toast({
        title: message,
        description: `La cancelación se ${action} correctamente`,
        variant: 'default'
      })

      setSelectedCancelacion(null)
      setObservaciones('')
      fetchCancelaciones()
      onCancelacionUpdated?.()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo procesar la cancelación',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const config = {
      'SOLICITADA': {
        label: 'Solicitada',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: FiClock
      },
      'EN_REVISION': {
        label: 'En Revisión',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: FiEye
      },
      'APROBADA': {
        label: 'Aprobada',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: FiCheckCircle
      },
      'RECHAZADA': {
        label: 'Rechazada',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: FiXCircle
      },
      'COMPLETADA': {
        label: 'Completada',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: FiAlertTriangle
      }
    }

    const configItem = config[estado as keyof typeof config] || config['SOLICITADA']
    const IconComponent = configItem.icon

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${configItem.className}`}>
        <IconComponent className="w-3 h-3" />
        {configItem.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const getVentaInfo = (cancelacion: Cancelacion) => {
    if (cancelacion.ventaLote) {
      return {
        cliente: `${cancelacion.ventaLote.cliente.nombre} ${cancelacion.ventaLote.cliente.apellido || ''}`,
        producto: cancelacion.ventaLote.lote.codigo,
        proyecto: cancelacion.ventaLote.proyecto.nombre
      }
    } else if (cancelacion.ventaUnidadCementerio) {
      return {
        cliente: `${cancelacion.ventaUnidadCementerio.cliente.nombre} ${cancelacion.ventaUnidadCementerio.cliente.apellido || ''}`,
        producto: cancelacion.ventaUnidadCementerio.unidadCementerio.codigo,
        proyecto: cancelacion.ventaUnidadCementerio.proyecto.nombre
      }
    }
    return { cliente: 'Cliente no disponible', producto: 'Producto no disponible', proyecto: 'Proyecto no disponible' }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Cargando cancelaciones...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const cancelacionesPendientes = cancelaciones.filter(c => 
    c.estado === 'SOLICITADA' || c.estado === 'EN_REVISION' || c.estado === 'APROBADA'
  )

  if (cancelacionesPendientes.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <FiAlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hay cancelaciones pendientes de gestión</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FiAlertTriangle className="h-5 w-5 text-orange-600" />
          Gestión de Cancelaciones
          <Badge variant="outline" className="ml-2">
            {cancelacionesPendientes.length} pendiente{cancelacionesPendientes.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cancelacionesPendientes.map((cancelacion) => {
            const ventaInfo = getVentaInfo(cancelacion)
            
            return (
              <div key={cancelacion.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getEstadoBadge(cancelacion.estado)}
                    <span className="text-sm text-gray-500">
                      {formatDate(cancelacion.fechaSolicitud)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Cliente</h4>
                    <p className="text-sm text-gray-600">{ventaInfo.cliente}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Producto</h4>
                    <p className="text-sm text-gray-600">{ventaInfo.producto}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Tipo de Cancelación</h4>
                    <p className="text-sm text-gray-600">
                      {TIPO_CANCELACION_LABELS[cancelacion.tipoCancelacion] || cancelacion.tipoCancelacion}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Tipo de Devolución</h4>
                    <p className="text-sm text-gray-600">
                      {TIPO_DEVOLUCION_LABELS[cancelacion.tipoDevolucion] || cancelacion.tipoDevolucion}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 mb-1">Motivo</h4>
                  <p className="text-sm text-gray-600">{cancelacion.motivoCancelacion}</p>
                </div>

                {(cancelacion.montoDevolucion || cancelacion.porcentajeDevolucion) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {cancelacion.montoDevolucion && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Monto a Devolver</h4>
                        <p className="text-sm text-green-600 font-medium">
                          {formatCurrency(cancelacion.montoDevolucion)}
                        </p>
                      </div>
                    )}
                    {cancelacion.porcentajeDevolucion && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Porcentaje de Devolución</h4>
                        <p className="text-sm text-green-600 font-medium">
                          {cancelacion.porcentajeDevolucion}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {cancelacion.motivoDevolucion && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900 mb-1">Motivo de Devolución</h4>
                    <p className="text-sm text-gray-600">{cancelacion.motivoDevolucion}</p>
                  </div>
                )}

                {cancelacion.observaciones && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900 mb-1">Observaciones</h4>
                    <p className="text-sm text-gray-600">{cancelacion.observaciones}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Solicitada por:</span>
                    <p className="text-gray-600">
                      {cancelacion.creadoPorUsuario?.nombre || 'Usuario no disponible'}
                    </p>
                  </div>
                  {cancelacion.aprobadoPorUsuario && (
                    <div>
                      <span className="font-medium text-gray-700">Aprobada por:</span>
                      <p className="text-gray-600">{cancelacion.aprobadoPorUsuario.nombre}</p>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                {(cancelacion.estado === 'SOLICITADA' || cancelacion.estado === 'EN_REVISION') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observaciones adicionales (opcional)
                      </label>
                      <Textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Agregar observaciones sobre la decisión..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAction(cancelacion.id, 'aprobar')}
                        disabled={isProcessing}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <FiCheck className="w-4 h-4" />
                        Aprobar
                      </Button>
                      
                      <Button
                        onClick={() => handleAction(cancelacion.id, 'rechazar')}
                        disabled={isProcessing}
                        variant="outline"
                        className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <FiX className="w-4 h-4" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                )}

                {cancelacion.estado === 'APROBADA' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observaciones finales (opcional)
                      </label>
                      <Textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Observaciones sobre la finalización..."
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button
                      onClick={() => handleAction(cancelacion.id, 'completar')}
                      disabled={isProcessing}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      Completar Cancelación
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 