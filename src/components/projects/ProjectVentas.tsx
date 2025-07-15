'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiCheck, FiCreditCard, FiTrendingUp, FiClock, FiCheckCircle, FiXCircle, FiX, FiShield, FiChevronDown, FiChevronUp, FiEye, FiChevronLeft, FiChevronRight, FiPackage } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from 'next-auth/react'
import VentaModal from '@/components/ventas/VentaModal'
import CuotasModal from '@/components/ventas/CuotasModal'
import VentaDetailsModal from '@/components/ventas/VentaDetailsModal'
import VentaDetailsExpanded from '@/components/ventas/VentaDetailsExpanded'
import { ApproveVentaAlert } from '@/components/ventas/ApproveVentaAlert'
import { DeleteVentaAlert } from '@/components/ventas/DeleteVentaAlert'

interface Venta {
  id: string
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
  estado: string
  precioVenta: number
  fechaVenta: string
  tipoVentaVenta: 'CONTADO' | 'CUOTAS' // Campo de la base de datos
  numeroCuotas?: number
  montoInicial?: number
  saldoPendiente?: number
  proyectoId?: string
  comisionVendedor?: number
  cliente: {
    id: string
    nombre: string
    apellido?: string
    email?: string
  }
  clientes?: Array<{
    cliente: {
      id: string
      nombre: string
      apellido?: string
      email?: string
    }
  }>
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
  unidad?: {
    id: string
    codigo: string
    manzana?: string
    manzanaCodigo?: string
    pabellon?: string
    pabellonCodigo?: string
  }
  createdAt: string
}

interface Stats {
  totalVentas: number
  ventasPendientes: number
  ventasAprobadas: number
  montoTotal: number
  ventasCuotas: number
  cuotasPendientes: number
  cuotasVencidas: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ProjectVentasProps {
  proyectoId: string
  tipoProyecto: string
}

export default function ProjectVentas({ proyectoId, tipoProyecto }: ProjectVentasProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [stats, setStats] = useState<Stats>({
    totalVentas: 0,
    ventasPendientes: 0,
    ventasAprobadas: 0,
    montoTotal: 0,
    ventasCuotas: 0,
    cuotasPendientes: 0,
    cuotasVencidas: 0
  })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTipoVenta, setModalTipoVenta] = useState<'LOTE' | 'UNIDAD_CEMENTERIO'>('LOTE')
  const [isCuotasModalOpen, setIsCuotasModalOpen] = useState(false)
  const [selectedVentaForCuotas, setSelectedVentaForCuotas] = useState<{ id: string; tipo: 'LOTE' | 'UNIDAD_CEMENTERIO' } | null>(null)
  const [selectedVentaForDetails, setSelectedVentaForDetails] = useState<Venta | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [approveAlertOpen, setApproveAlertOpen] = useState(false)
  const [selectedVentaForApprove, setSelectedVentaForApprove] = useState<Venta | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [selectedVentaForDelete, setSelectedVentaForDelete] = useState<Venta | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedVenta, setExpandedVenta] = useState<string | null>(null)

  // Estado de paginación
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Permisos basados en el rol del usuario
  const userRole = session?.user?.role
  const userId = session?.user?.id
  const canViewSales = ['ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'GERENTE_GENERAL'].includes(userRole || '')
  const canCreateSales = ['ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'GERENTE_GENERAL'].includes(userRole || '')
  const canManageCuotas = ['ADMIN', 'SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'GERENTE_GENERAL'].includes(userRole || '')
  
  // Lógica para determinar si puede aprobar ventas
  const canApprove = (venta: Venta) => {
    // Roles que siempre pueden aprobar
    if (['SUPER_ADMIN', 'GERENTE_GENERAL', 'SALES_MANAGER'].includes(userRole || '')) {
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

  const getTipoVenta = () => {
    return tipoProyecto === 'CEMENTERIO' ? 'UNIDAD_CEMENTERIO' : 'LOTE'
  }

  const fetchVentas = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ventas?proyectoId=${proyectoId}&page=${page}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Error al cargar ventas')
      }
      const data = await response.json()
      console.log('Datos de ventas recibidos:', data.ventas)
      console.log('Información de paginación:', data.pagination)
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

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/ventas/stats?proyectoId=${proyectoId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  useEffect(() => {
    if (canViewSales) {
      fetchVentas()
      fetchStats()
    }
  }, [proyectoId, canViewSales])

  const handleCreateVenta = (tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    setModalTipoVenta(tipoVenta)
    setIsModalOpen(true)
  }

  const handleVentaSuccess = () => {
    fetchVentas(1) // Volver a la primera página
    fetchStats()
  }

  const handleViewCuotas = (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    setSelectedVentaForCuotas({ id: ventaId, tipo: tipoVenta })
    setIsCuotasModalOpen(true)
  }

  const handleRowClick = (venta: Venta) => {
    if (expandedVenta === venta.id) {
      setExpandedVenta(null)
    } else {
      setExpandedVenta(venta.id)
    }
  }

  const handleEditVenta = (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    console.log('Editar venta:', ventaId, tipoVenta)
    toast({
      title: 'Funcionalidad en desarrollo',
      description: 'La edición de ventas estará disponible próximamente',
      variant: 'default'
    })
  }

  const handleDeleteVenta = (venta: Venta) => {
    setSelectedVentaForDelete(venta)
    setDeleteAlertOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedVentaForDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/ventas/${selectedVentaForDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast({
          title: 'Venta eliminada',
          description: 'La venta se eliminó correctamente',
          variant: 'default'
        })
        fetchVentas(pagination.page) // Mantener la página actual
        fetchStats()
        setDeleteAlertOpen(false)
        setSelectedVentaForDelete(null)
      } else {
        throw new Error('Error al eliminar la venta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la venta',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleManageVenta = async (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    // Buscar la venta seleccionada
    const venta = ventas.find(v => v.id === ventaId)
    if (!venta) {
      toast({
        title: 'Error',
        description: 'No se encontró la venta seleccionada',
        variant: 'destructive'
      })
      return
    }

    // Configurar la venta para la alerta
    setSelectedVentaForApprove(venta)
    setApproveAlertOpen(true)
  }

  const handleConfirmApprove = async (action: 'APROBAR' | 'DESAPROBAR') => {
    if (!selectedVentaForApprove) return

    setIsApproving(true)
    try {
      const response = await fetch(`/api/ventas/${selectedVentaForApprove.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion: action,
          observaciones: action === 'APROBAR' 
            ? 'Venta aprobada desde el panel de proyecto'
            : 'Venta desaprobada desde el panel de proyecto'
        })
      })

      if (response.ok) {
        const message = action === 'APROBAR' ? 'Venta aprobada' : 'Venta desaprobada'
        toast({
          title: message,
          description: `La venta se ${action.toLowerCase()} correctamente`,
          variant: 'default'
        })
        fetchVentas(pagination.page) // Mantener la página actual
        fetchStats()
        setApproveAlertOpen(false)
        setSelectedVentaForApprove(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al procesar la venta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo procesar la venta',
        variant: 'destructive'
      })
    } finally {
      setIsApproving(false)
    }
  }

  // Funciones de paginación
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchVentas(newPage, pagination.limit)
    }
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
    fetchVentas(1, newLimit)
  }

  const getEstadoBadge = (estado: string) => {
    const config = {
      'PENDIENTE': {
        label: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: FiClock
      },
      'APROBADA': {
        label: 'Aprobada',
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: FiCheckCircle
      },
      'DESAPROBADA': {
        label: 'Desaprobada',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: FiXCircle
      },
      'CANCELADA': {
        label: 'Cancelada',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: FiX
      },
      'ENTREGADA': {
        label: 'Entregada',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: FiPackage
      }
    }

    const configItem = config[estado as keyof typeof config] || config['PENDIENTE']
    const IconComponent = configItem.icon

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${configItem.className}`}>
        <IconComponent className="w-3 h-3" />
        {configItem.label}
      </Badge>
    )
  }

  const getTipoVentaBadge = (tipoVenta: string) => {
    const config = {
      'CONTADO': {
        label: 'Contado',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: FiDollarSign
      },
      'CUOTAS': {
        label: 'Cuotas',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: FiCreditCard
      }
    }

    const configItem = config[tipoVenta as keyof typeof config] || config['CONTADO']
    const IconComponent = configItem.icon

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${configItem.className}`}>
        <IconComponent className="w-3 h-3" />
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

  // Generar array de páginas para mostrar
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }

  if (!canViewSales) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-gray-500">No tienes permisos para ver las ventas de este proyecto</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Estadísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-800">Total Ventas</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 bg-blue-200 rounded-full">
              <FiTrendingUp className="h-5 w-5 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.totalVentas}</div>
            <p className="text-xs text-blue-700 mt-1">
              Ventas registradas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-yellow-800">Pendientes</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-200 rounded-full">
              <FiClock className="h-5 w-5 text-yellow-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{stats.ventasPendientes}</div>
            <p className="text-xs text-yellow-700 mt-1">
              Esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-800">Aprobadas</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 bg-green-200 rounded-full">
              <FiCheckCircle className="h-5 w-5 text-green-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.ventasAprobadas}</div>
            <p className="text-xs text-green-700 mt-1">
              Ventas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-emerald-800">Monto Total</CardTitle>
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-200 rounded-full">
              <FiDollarSign className="h-5 w-5 text-emerald-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">{formatCurrency(stats.montoTotal)}</div>
            <p className="text-xs text-emerald-700 mt-1">
              Valor total de ventas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de cuotas */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-700 mb-1">Ventas a Cuotas</p>
                <p className="text-3xl font-bold text-indigo-900">{stats.ventasCuotas}</p>
                <p className="text-xs text-indigo-600 mt-1">Con financiamiento</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-200 rounded-full">
                <FiCreditCard className="h-6 w-6 text-indigo-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-700 mb-1">Cuotas Pendientes</p>
                <p className="text-3xl font-bold text-amber-900">{stats.cuotasPendientes}</p>
                <p className="text-xs text-amber-600 mt-1">Por cobrar</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-amber-200 rounded-full">
                <FiClock className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-700 mb-1">Cuotas Vencidas</p>
                <p className="text-3xl font-bold text-rose-900">{stats.cuotasVencidas}</p>
                <p className="text-xs text-rose-600 mt-1">Requieren atención</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-rose-200 rounded-full">
                <FiXCircle className="h-6 w-6 text-rose-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      {canCreateSales && (
        <div className="flex justify-end">
          <Button 
            onClick={() => handleCreateVenta(getTipoVenta())}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 font-semibold"
          >
            <div className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full">
              <FiPlus className="w-3 h-3" />
            </div>
            Nueva Venta
          </Button>
        </div>
      )}

      {/* Lista de ventas */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30 max-w-full overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <FiDollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
            Ventas del Proyecto
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Gestión y seguimiento de todas las ventas registradas
                </p>
              </div>
            </div>
            {ventas.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                {ventas.length} ventas
              </Badge>
                <Badge variant="outline" className="text-xs">
                  {ventas.filter(v => v.estado === 'PENDIENTE').length} pendientes
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 font-medium">Cargando ventas...</p>
              </div>
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6">
                <FiDollarSign className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No hay ventas registradas
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {canCreateSales 
                  ? 'Comienza registrando la primera venta del proyecto para ver las estadísticas y gestionar las transacciones.'
                  : 'Aún no se han registrado ventas para este proyecto. Los administradores pueden crear nuevas ventas.'
                }
              </p>
              {canCreateSales && (
                <Button 
                  onClick={() => handleCreateVenta(getTipoVenta())}
                  className="mt-6 bg-blue-600 hover:bg-blue-700"
                >
                  <FiPlus className="w-4 h-4 mr-2" />
                  Crear Primera Venta
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden max-w-full">
              <div className="overflow-x-auto max-w-full">
                <Table className="w-full max-w-full">
              <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Unidad</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Cliente</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Vendedor</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Precio</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Comisión</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Tipo de Venta</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Estado</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Fecha</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-right">Opciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {ventas.map((venta, index) => (
                      <React.Fragment key={venta.id}>
                  <TableRow 
                          className={`cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                          }`}
                    onClick={() => handleRowClick(venta)}
                  >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              venta.tipoVenta === 'LOTE' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {venta.tipoVenta === 'LOTE' ? (
                                <FiTrendingUp className="w-4 h-4" />
                              ) : (
                                <FiDollarSign className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 whitespace-nowrap">
                        {venta.unidad?.codigo || 'Sin código'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {venta.tipoVenta === 'LOTE' ? 'Lote' : 'Unidad Cementerio'}
                              </div>
                            </div>
                      </div>
                    </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="space-y-2">
                            {/* Cliente principal */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                <span className="text-sm font-semibold text-blue-600">
                                  {venta.cliente?.nombre?.charAt(0) || 'C'}
                                </span>
                              </div>
                      <div>
                                <div className="font-medium text-gray-900">
                          {venta.cliente ? `${venta.cliente.nombre} ${venta.cliente.apellido || ''}` : 'Cliente no disponible'}
                        </div>
                        {venta.cliente?.email && (
                                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {venta.cliente.email}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Clientes adicionales */}
                            {venta.clientes && venta.clientes.length > 0 && (
                              <div className="space-y-1">
                                {venta.clientes.map((clienteRel, index) => (
                                  <div key={clienteRel.cliente.id} className="flex items-center gap-2 ml-4">
                                    <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                                      <span className="text-xs font-semibold text-green-600">
                                        {clienteRel.cliente.nombre?.charAt(0) || 'C'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-gray-700 truncate">
                                        {`${clienteRel.cliente.nombre} ${clienteRel.cliente.apellido || ''}`}
                                      </div>
                                      {clienteRel.cliente.email && (
                                        <div className="text-xs text-gray-500 truncate max-w-[180px]">
                                          {clienteRel.cliente.email}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                        )}
                      </div>
                    </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                              <span className="text-sm font-semibold text-orange-600">
                                {venta.vendedor?.nombre?.charAt(0) || 'V'}
                              </span>
                            </div>
                      <div>
                              <div className="font-medium text-gray-900">
                                {venta.vendedor?.nombre || 'Vendedor no disponible'}
                              </div>
                              {venta.vendedor?.email && (
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {venta.vendedor.email}
                                </div>
                              )}
                            </div>
                      </div>
                    </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-right">
                            <div className="font-bold text-lg text-green-600">
                      {formatCurrency(venta.precioVenta)}
                            </div>
                          </div>
                    </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-right">
                            <div className="font-bold text-lg text-purple-600">
                      {formatCurrency(venta.comisionVendedor || 0)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                      {/* Mostrar badge solo si NO es cuotas */}
                      {venta.tipoVentaVenta !== 'CUOTAS' && (
                        getTipoVentaBadge(venta.tipoVentaVenta || 'CONTADO')
                      )}
                      {/* Botón de Cuotas - solo para ventas a cuotas */}
                      {venta.tipoVentaVenta === 'CUOTAS' && canManageCuotas && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewCuotas(venta.id, venta.tipoVenta)
                          }}
                          className="flex items-center gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                          title="Gestionar Cuotas"
                        >
                          <FiCreditCard className="w-3 h-3" />
                          <span className="text-xs">Cuotas</span>
                        </Button>
                      )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            {/* Mostrar badge solo si NO es pendiente */}
                            {venta.estado !== 'PENDIENTE' && (
                              getEstadoBadge(venta.estado)
                            )}
                            {/* Botón de gestión de venta - solo para ventas pendientes */}
                            {canApprove(venta) && venta.estado === 'PENDIENTE' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleManageVenta(venta.id, venta.tipoVenta)
                                }}
                                className="flex items-center justify-center w-full p-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                title="Gestionar Venta"
                              >
                                <FiShield className="w-3 h-3 mr-1" />
                                <span className="text-xs">Gestionar</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {formatDate(venta.fechaVenta)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(venta.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                    </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Botón de Editar */}
                        {canCreateSales && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditVenta(venta.id, venta.tipoVenta)}
                                className="flex items-center justify-center w-8 h-8 p-0 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                            title="Editar Venta"
                          >
                                <FiEdit2 className="w-3 h-3 text-gray-600" />
                          </Button>
                        )}
                        
                        {/* Botón de Eliminar */}
                        {canCreateSales && (
                          <Button
                            variant="outline"
                            size="sm"
                                onClick={() => handleDeleteVenta(venta)}
                                className="flex items-center justify-center w-8 h-8 p-0 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                            title="Eliminar Venta"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                      
                      {/* Fila expandible para detalles de venta */}
                      {expandedVenta === venta.id && (
                        <TableRow>
                          <TableCell colSpan={9} className="p-0">
                            <VentaDetailsExpanded venta={venta} />
                          </TableCell>
                        </TableRow>
                      )}
                      </React.Fragment>
                ))}
              </TableBody>
            </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controles de paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mostrar:</span>
              <Select value={pagination.limit.toString()} onValueChange={(value) => handleLimitChange(parseInt(value))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">elementos por página</span>
            </div>
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} ventas
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="flex items-center gap-1"
            >
              <FiChevronLeft className="w-4 h-4" />
              Primera
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <FiChevronLeft className="w-4 h-4" />
            </Button>

            {getPageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === pagination.page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <FiChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className="flex items-center gap-1"
            >
              Última
              <FiChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal para crear venta */}
      <VentaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleVentaSuccess}
        tipoVenta={modalTipoVenta}
        proyectoId={proyectoId}
      />

      {/* Modal para ver cuotas */}
      <CuotasModal
        isOpen={isCuotasModalOpen}
        onClose={() => setIsCuotasModalOpen(false)}
        ventaId={selectedVentaForCuotas?.id || ''}
        tipoVenta={selectedVentaForCuotas?.tipo || 'LOTE'}
      />

      {/* Modal para ver detalles de venta */}
      <VentaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        venta={selectedVentaForDetails}
      />

      {/* Modal para gestionar venta */}
      <ApproveVentaAlert
        isOpen={approveAlertOpen}
        onClose={() => setApproveAlertOpen(false)}
        onConfirm={handleConfirmApprove}
        venta={selectedVentaForApprove}
      />

      {/* Modal para eliminar venta */}
      <DeleteVentaAlert
        isOpen={deleteAlertOpen}
        onClose={() => setDeleteAlertOpen(false)}
        onConfirm={handleConfirmDelete}
        venta={selectedVentaForDelete}
        isLoading={isDeleting}
      />
    </div>
  )
} 