'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import VentaAmortizacionModal from './VentaAmortizacionModal'
import CuotasModal from './CuotasModal'
import ReprogramarCuotasModal from './ReprogramarCuotasModal'
import VentaDetalleModal from './VentaDetalleModal'
import { 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiCheck, 
  FiX, 
  FiDollarSign, 
  FiUser, 
  FiCalendar,
  FiMapPin,
  FiHome,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPackage,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiRefreshCw,
  FiEdit,
  FiEdit2
} from 'react-icons/fi'

interface Venta {
  id: string
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
  estado: string
  precioVenta: number
  fechaVenta: string
  metodoPago?: string
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
  unidad: any
  proyectoId?: string
  createdAt: string
}

interface VentaListProps {
  userRole: string
  userId: string
  estado?: string
}

export default function VentaList({ userRole, userId, estado }: VentaListProps) {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    estado: estado || 'todos',
    tipoVenta: 'todos',
    proyectoId: '',
    vendedorId: '',
    searchTerm: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showAmortizacionModal, setShowAmortizacionModal] = useState(false)
  const [showCuotasModal, setShowCuotasModal] = useState(false)
  const [showReprogramarModal, setShowReprogramarModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [selectedVentaId, setSelectedVentaId] = useState<string>('')
  const [selectedVenta, setSelectedVenta] = useState<any>(null)
  const { toast } = useToast()

  const fetchVentas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.estado && filters.estado !== 'todos' && { estado: filters.estado }),
        ...(filters.tipoVenta && filters.tipoVenta !== 'todos' && { tipoVenta: filters.tipoVenta }),
        ...(filters.proyectoId && { proyectoId: filters.proyectoId }),
        ...(filters.vendedorId && { vendedorId: filters.vendedorId }),
        ...(filters.searchTerm && { search: filters.searchTerm })
      })

      const response = await fetch(`/api/ventas?${params}`)
      if (!response.ok) {
        throw new Error('Error al cargar ventas')
      }

      const data = await response.json()
      console.log('🔍 Datos de ventas recibidos:', data.ventas.map((v: any) => ({
        id: v.id,
        metodoPago: v.metodoPago,
        tipoVenta: v.tipoVenta,
        estado: v.estado,
        tieneCuotas: v.cuotas?.length > 0
      })))
      setVentas(data.ventas)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las ventas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVentas()
  }, [pagination.page, filters])

  useEffect(() => {
    setFilters(prev => ({ ...prev, estado: estado || 'todos' }))
  }, [estado])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getEstadoBadge = (estado: string) => {
    const estados = {
      PENDIENTE: { 
        label: 'Pendiente', 
        variant: 'secondary' as const, 
        icon: FiClock,
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
      },
      APROBADA: { 
        label: 'Aprobada', 
        variant: 'default' as const, 
        icon: FiCheckCircle,
        color: 'text-green-600 bg-green-50 border-green-200'
      },
      CANCELADA: { 
        label: 'Cancelada', 
        variant: 'destructive' as const, 
        icon: FiXCircle,
        color: 'text-red-600 bg-red-50 border-red-200'
      },
      ENTREGADA: { 
        label: 'Entregada', 
        variant: 'default' as const, 
        icon: FiPackage,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      }
    }
    
    const estadoInfo = estados[estado as keyof typeof estados] || { 
      label: estado, 
      variant: 'secondary' as const, 
      icon: FiClock,
      color: 'text-gray-600 bg-gray-50 border-gray-200'
    }
    
    const IconComponent = estadoInfo.icon
    
    return (
      <Badge variant={estadoInfo.variant} className={`flex items-center gap-1 ${estadoInfo.color}`}>
        <IconComponent className="h-3 w-3" />
        {estadoInfo.label}
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
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  }

  const getTipoVentaIcon = (tipo: string) => {
    return tipo === 'LOTE' ? FiMapPin : FiHome
  }

  const canApprove = (venta: any) => {
    // Roles que siempre pueden aprobar
    if (['SUPER_ADMIN', 'GERENTE_GENERAL', 'SALES_MANAGER'].includes(userRole)) {
      return true
    }
    
    // PROJECT_MANAGER solo puede aprobar si es el gerente asignado al proyecto
    if (userRole === 'PROJECT_MANAGER') {
      // Verificar si el usuario es el gerente asignado al proyecto
      const proyectoId = venta.proyectoId
      // Esta verificación se hace en el backend, aquí solo verificamos el rol
      return true
    }
    
    return false
  }

  const clearFilters = () => {
    setFilters({
      estado: estado || 'todos',
      tipoVenta: 'todos',
      proyectoId: '',
      vendedorId: '',
      searchTerm: ''
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = filters.estado !== 'todos' || 
                          filters.tipoVenta !== 'todos' || 
                          filters.proyectoId || 
                          filters.vendedorId || 
                          filters.searchTerm

  return (
    <div className="space-y-6">
      {/* Header con estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Ventas</p>
                <p className="text-2xl font-bold text-blue-900">{pagination.total}</p>
              </div>
              <FiTrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {ventas.filter(v => v.estado === 'PENDIENTE').length}
                </p>
              </div>
              <FiClock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Aprobadas</p>
                <p className="text-2xl font-bold text-green-900">
                  {ventas.filter(v => v.estado === 'APROBADA').length}
                </p>
              </div>
              <FiCheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Valor Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(ventas.reduce((sum, v) => sum + v.precioVenta, 0))}
                </p>
              </div>
              <FiDollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros mejorados */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FiFilter className="h-5 w-5" />
              Filtros y Búsqueda
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FiFilter className="h-4 w-4" />
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Búsqueda principal */}
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por cliente, vendedor, ID de venta..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <Select value={filters.estado} onValueChange={(value) => handleFilterChange('estado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="APROBADA">Aprobada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  <SelectItem value="ENTREGADA">Entregada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.tipoVenta} onValueChange={(value) => handleFilterChange('tipoVenta', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de venta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="LOTE">Lote</SelectItem>
                  <SelectItem value="UNIDAD_CEMENTERIO">Unidad Cementerio</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="ID del proyecto"
                value={filters.proyectoId}
                onChange={(e) => handleFilterChange('proyectoId', e.target.value)}
              />

              {userRole !== 'SALES_REP' && (
                <Input
                  placeholder="ID del vendedor"
                  value={filters.vendedorId}
                  onChange={(e) => handleFilterChange('vendedorId', e.target.value)}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de ventas mejorada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiDollarSign className="h-5 w-5" />
            Registro de Ventas
            {pagination && pagination.total > 0 && (
              <Badge variant="outline" className="ml-2">
                {pagination.total} ventas
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Cargando ventas...</span>
              </div>
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-12">
              <FiDollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron ventas</h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters 
                  ? 'Intenta ajustar los filtros de búsqueda' 
                  : 'No hay ventas registradas en el sistema'
                }
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Venta</TableHead>
                      <TableHead className="font-semibold">Cliente</TableHead>
                      <TableHead className="font-semibold">Vendedor</TableHead>
                      <TableHead className="font-semibold text-right">Precio</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.map((venta) => {
                      const TipoIcon = getTipoVentaIcon(venta.tipoVenta)
                      return (
                        <TableRow key={venta.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <TipoIcon className="h-4 w-4 text-gray-500" />
                                <Badge variant="outline" className="text-xs">
                                  {venta.tipoVenta === 'LOTE' ? 'Lote' : 'Unidad'}
                                </Badge>
                              </div>
                              <div>
                                <div className="font-mono text-sm font-medium text-gray-900">
                                  #{venta.id.slice(0, 8)}...
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(venta.createdAt)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <FiUser className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {venta.cliente.nombre} {venta.cliente.apellido}
                                </div>
                                {venta.cliente.email && (
                                  <div className="text-sm text-gray-500 truncate max-w-32">
                                    {venta.cliente.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <FiUser className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{venta.vendedor.nombre}</div>
                                <div className="text-sm text-gray-500 truncate max-w-32">
                                  {venta.vendedor.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(venta.precioVenta)}
                            </div>
                            {venta.metodoPago && (
                              <div className="text-xs text-gray-500">
                                {venta.metodoPago}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getEstadoBadge(venta.estado)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FiCalendar className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(venta.fechaVenta)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedVentaId(venta.id)
                                  setShowDetalleModal(true)
                                }}
                                className="flex items-center gap-1"
                              >
                                <FiEye className="h-3 w-3" />
                                Ver
                              </Button>
                              
                              {/* Botón de cuotas - para ventas a cuotas */}
                              {(venta.metodoPago === 'CUOTAS' || venta.metodoPago === 'cuotas') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    console.log('🔍 Abriendo cuotas para venta:', venta.id)
                                    setSelectedVentaId(venta.id)
                                    setShowCuotasModal(true)
                                  }}
                                  className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                  title="Ver Cuotas"
                                >
                                  <FiDollarSign className="h-3 w-3" />
                                  Cuotas
                                </Button>
                              )}
                              
                              {/* Botón de tabla de amortización - para todas las ventas con cuotas */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log('🔍 Abriendo amortización para venta:', venta.id, 'metodoPago:', venta.metodoPago, 'tipoVenta:', venta.tipoVenta)
                                  setSelectedVentaId(venta.id)
                                  setShowAmortizacionModal(true)
                                }}
                                className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                title="Ver Tabla de Amortización"
                              >
                                <FiTrendingUp className="h-3 w-3" />
                                Amortización
                              </Button>
                              
                              {/* Botón de reprogramar cuotas - solo para ventas aprobadas con cuotas */}
                              {venta.estado === 'APROBADA' && (venta.metodoPago === 'CUOTAS' || venta.metodoPago === 'cuotas') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      console.log('🔍 Cargando datos de venta para reprogramación:', venta.id)
                                      const response = await fetch(`/api/ventas/${venta.id}`)
                                      if (!response.ok) throw new Error('Error al cargar datos de venta')
                                      
                                      const ventaData = await response.json()
                                      setSelectedVenta(ventaData)
                                      setShowReprogramarModal(true)
                                    } catch (error) {
                                      console.error('Error al cargar venta:', error)
                                      toast({
                                        title: 'Error',
                                        description: 'No se pudo cargar los datos de la venta',
                                        variant: 'destructive'
                                      })
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                  title="Reprogramar Cuotas"
                                >
                                  <FiEdit2 className="h-3 w-3" />
                                  Reprogramar
                                </Button>
                              )}
                              
                              {/* Botón de editar */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log('Editar venta:', venta.id)
                                  // TODO: Implementar edición
                                }}
                                className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                title="Editar Venta"
                              >
                                <FiEdit className="h-3 w-3" />
                                Editar
                              </Button>
                              
                              {/* Botón de eliminar */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log('Eliminar venta:', venta.id)
                                  // TODO: Implementar eliminación
                                }}
                                className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                title="Eliminar Venta"
                              >
                                <FiX className="h-3 w-3" />
                                Eliminar
                              </Button>
                              
                              {canApprove(venta) && venta.estado === 'PENDIENTE' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Implementar aprobación
                                    console.log('Aprobar:', venta.id)
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white p-2"
                                  title="Aprobar Venta"
                                >
                                  <FiCheck className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación mejorada */}
              {pagination && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                      {pagination.total} ventas
                    </div>
                    
                    {/* Selector de elementos por página */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Mostrar:</span>
                      <Select
                        value={pagination.limit.toString()}
                        onValueChange={(value) => {
                          setPagination(prev => ({
                            ...prev,
                            limit: parseInt(value),
                            page: 1 // Reset a la primera página
                          }))
                        }}
                      >
                        <SelectTrigger className="w-20 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      className="flex items-center gap-1"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    
                    {/* Números de página */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={pagination.page === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page }))}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      })}
                      
                      {/* Mostrar "..." si hay más páginas */}
                      {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      
                      {/* Mostrar última página si no está en el rango visible */}
                      {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPagination(prev => ({ ...prev, page: pagination.totalPages }))}
                          className="w-8 h-8 p-0"
                        >
                          {pagination.totalPages}
                        </Button>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      className="flex items-center gap-1"
                    >
                      Siguiente
                      <FiChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Tabla de Amortización */}
      <VentaAmortizacionModal
        isOpen={showAmortizacionModal}
        onClose={() => setShowAmortizacionModal(false)}
        ventaId={selectedVentaId}
      />

      {/* Modal de Cuotas */}
      <CuotasModal
        isOpen={showCuotasModal}
        onClose={() => setShowCuotasModal(false)}
        ventaId={selectedVentaId}
      />

      {/* Modal de Reprogramación de Cuotas */}
      <ReprogramarCuotasModal
        isOpen={showReprogramarModal}
        onClose={() => setShowReprogramarModal(false)}
        venta={selectedVenta}
        onReprogramacionSuccess={() => {
          fetchVentas() // Recargar la lista de ventas
          setShowReprogramarModal(false)
        }}
      />

      {/* Modal de Detalle de Venta */}
      <VentaDetalleModal
        isOpen={showDetalleModal}
        onClose={() => setShowDetalleModal(false)}
        ventaId={selectedVentaId}
      />
    </div>
  )
} 