'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FiAlertTriangle, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi'
import { useToast } from '@/components/ui/use-toast'
import CancelacionesGestion from '@/components/ventas/cancelaciones-gestion'
import CancelacionesList from '@/components/ventas/cancelaciones-list'

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
}

export default function CancelacionesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [cancelaciones, setCancelaciones] = useState<Cancelacion[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    estado: 'todos',
    tipoCancelacion: 'todos',
    tipoDevolucion: 'todos',
    searchTerm: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [selectedCancelacion, setSelectedCancelacion] = useState<Cancelacion | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const userRole = session?.user?.role || ''
  const canManageCancelaciones = ['ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'FINANCE_MANAGER', 'GERENTE_GENERAL'].includes(userRole)

  const fetchCancelaciones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.estado && filters.estado !== 'todos' && { estado: filters.estado }),
        ...(filters.tipoCancelacion && filters.tipoCancelacion !== 'todos' && { tipoCancelacion: filters.tipoCancelacion }),
        ...(filters.tipoDevolucion && filters.tipoDevolucion !== 'todos' && { tipoDevolucion: filters.tipoDevolucion }),
        ...(filters.searchTerm && { search: filters.searchTerm })
      })

      const response = await fetch(`/api/cancelaciones?${params}`)
      if (!response.ok) {
        throw new Error('Error al cargar cancelaciones')
      }

      const data = await response.json()
      setCancelaciones(data.cancelaciones)
      setPagination(data.pagination)
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

  useEffect(() => {
    if (canManageCancelaciones) {
      fetchCancelaciones()
    }
  }, [pagination.page, filters, canManageCancelaciones])

  const handleViewDetails = (cancelacion: Cancelacion) => {
    setSelectedCancelacion(cancelacion)
    setShowDetails(true)
  }

  const handleCancelacionUpdated = () => {
    fetchCancelaciones()
  }

  const getEstadoBadge = (estado: string) => {
    const config = {
      'SOLICITADA': {
        label: 'Solicitada',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'EN_REVISION': {
        label: 'En Revisión',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'APROBADA': {
        label: 'Aprobada',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'RECHAZADA': {
        label: 'Rechazada',
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      'COMPLETADA': {
        label: 'Completada',
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    const configItem = config[estado as keyof typeof config] || config['SOLICITADA']

    return (
      <Badge variant="outline" className={configItem.className}>
        {configItem.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  if (!canManageCancelaciones) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <FiAlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No tienes permisos para gestionar cancelaciones</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Cancelaciones</h1>
        <p className="text-gray-600">Administra las solicitudes de cancelación de ventas</p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiFilter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <Select value={filters.estado} onValueChange={(value) => setFilters(prev => ({ ...prev, estado: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="SOLICITADA">Solicitada</SelectItem>
                  <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                  <SelectItem value="APROBADA">Aprobada</SelectItem>
                  <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                  <SelectItem value="COMPLETADA">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cancelación</label>
              <Select value={filters.tipoCancelacion} onValueChange={(value) => setFilters(prev => ({ ...prev, tipoCancelacion: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="SOLICITUD_CLIENTE">Solicitud del Cliente</SelectItem>
                  <SelectItem value="INCUMPLIMIENTO_CLIENTE">Incumplimiento del Cliente</SelectItem>
                  <SelectItem value="PROBLEMAS_FINANCIEROS">Problemas Financieros</SelectItem>
                  <SelectItem value="CAMBIO_PLANES">Cambio de Planes</SelectItem>
                  <SelectItem value="PROBLEMAS_LEGALES">Problemas Legales</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Devolución</label>
              <Select value={filters.tipoDevolucion} onValueChange={(value) => setFilters(prev => ({ ...prev, tipoDevolucion: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="DEVOLUCION_COMPLETA">Devolución Completa</SelectItem>
                  <SelectItem value="DEVOLUCION_PARCIAL">Devolución Parcial</SelectItem>
                  <SelectItem value="SIN_DEVOLUCION">Sin Devolución</SelectItem>
                  <SelectItem value="CREDITO_FUTURO">Crédito para Futura Compra</SelectItem>
                  <SelectItem value="CAMBIO_PRODUCTO">Cambio por Otro Producto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por cliente, producto..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => {
                setFilters({
                  estado: 'todos',
                  tipoCancelacion: 'todos',
                  tipoDevolucion: 'todos',
                  searchTerm: ''
                })
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cancelaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="h-5 w-5 text-orange-600" />
              Cancelaciones
              <Badge variant="outline" className="ml-2">
                {cancelaciones.length} cancelación{cancelaciones.length !== 1 ? 'es' : ''}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando cancelaciones...</p>
            </div>
          ) : cancelaciones.length === 0 ? (
            <div className="text-center py-8">
              <FiAlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cancelaciones
              </h3>
              <p className="text-gray-500">
                No se encontraron cancelaciones con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancelaciones.map((cancelacion) => {
                const ventaInfo = getVentaInfo(cancelacion)
                
                return (
                  <div key={cancelacion.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getEstadoBadge(cancelacion.estado)}
                        <span className="text-sm text-gray-500">
                          {formatDate(cancelacion.fechaSolicitud)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Cliente</h4>
                        <p className="text-sm text-gray-600">{ventaInfo.cliente}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Producto</h4>
                        <p className="text-sm text-gray-600">{ventaInfo.producto}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Proyecto</h4>
                        <p className="text-sm text-gray-600">{ventaInfo.proyecto}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900 mb-1">Motivo</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{cancelacion.motivoCancelacion}</p>
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

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Solicitada por:</span> {cancelacion.creadoPorUsuario?.nombre || 'Usuario no disponible'}
                      </div>
                      
                      <Button
                        onClick={() => handleViewDetails(cancelacion)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FiAlertTriangle className="w-4 h-4" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      {selectedCancelacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Detalles de Cancelación</h2>
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="outline"
                  size="sm"
                >
                  Cerrar
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CancelacionesList
                  ventaLoteId={selectedCancelacion.ventaLote?.id}
                  ventaUnidadCementerioId={selectedCancelacion.ventaUnidadCementerio?.id}
                />
                
                <CancelacionesGestion
                  ventaLoteId={selectedCancelacion.ventaLote?.id}
                  ventaUnidadCementerioId={selectedCancelacion.ventaUnidadCementerio?.id}
                  onCancelacionUpdated={handleCancelacionUpdated}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 