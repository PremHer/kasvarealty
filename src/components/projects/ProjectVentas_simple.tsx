'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FiPlus, FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle, FiXCircle, FiEye, FiCalendar, FiCreditCard, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi'
import { useToast } from '@/components/ui/use-toast'
import VentaModal from '@/components/ventas/VentaModal'
import CuotasModal from '@/components/ventas/CuotasModal'
import { ApproveVentaAlert } from '@/components/ventas/ApproveVentaAlert'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Venta {
  id: string
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
  estado: string
  precioVenta: number
  fechaVenta: string
  metodoPago?: string
  numeroCuotas?: number
  montoInicial?: number
  saldoPendiente?: number
  proyectoId?: string
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

interface ProjectVentasProps {
  proyectoId: string
  tipoProyecto: string
}

export default function ProjectVentas({ proyectoId, tipoProyecto }: ProjectVentasProps) {
  const { data: session } = useSession()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [stats, setStats] = useState({
    totalVentas: 0,
    ventasPendientes: 0,
    ventasAprobadas: 0,
    montoTotal: 0,
    ventasContado: 0,
    ventasCuotas: 0,
    cuotasPendientes: 0,
    cuotasVencidas: 0
  })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCuotasModalOpen, setIsCuotasModalOpen] = useState(false)
  const [modalTipoVenta, setModalTipoVenta] = useState<'LOTE' | 'UNIDAD_CEMENTERIO'>('LOTE')
  const [selectedVentaForCuotas, setSelectedVentaForCuotas] = useState<{id: string, tipo: 'LOTE' | 'UNIDAD_CEMENTERIO'} | null>(null)
  const [approveAlertOpen, setApproveAlertOpen] = useState(false)
  const [selectedVentaForApprove, setSelectedVentaForApprove] = useState<Venta | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const { toast } = useToast()

  const userRole = session?.user?.role || ''
  const canCreateSales = ['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'GERENTE_GENERAL'].includes(userRole)
  const canViewSales = ['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'GERENTE_GENERAL'].includes(userRole)
  const canManageCuotas = ['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'GERENTE_GENERAL'].includes(userRole)
  
  // Lógica para determinar si puede aprobar ventas
  const canApprove = (venta: Venta) => {
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

  // Determinar el tipo de venta según el tipo de proyecto
  const getTipoVenta = () => {
    if (tipoProyecto === 'LOTIZACION') return 'LOTE'
    if (tipoProyecto === 'CEMENTERIO') return 'UNIDAD_CEMENTERIO'
    return 'LOTE' // Por defecto
  }

  const fetchVentas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ventas?proyectoId=${proyectoId}`)
      if (!response.ok) {
        throw new Error('Error al cargar ventas')
      }
      const data = await response.json()
      console.log('Datos de ventas recibidos:', data.ventas)
      console.log('Primera venta:', data.ventas[0])
      setVentas(data.ventas)
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
    fetchVentas()
    fetchStats()
  }

  const handleViewCuotas = (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    setSelectedVentaForCuotas({ id: ventaId, tipo: tipoVenta })
    setIsCuotasModalOpen(true)
  }

  const handleEditVenta = (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    console.log('Editar venta:', ventaId, tipoVenta)
    toast({
      title: 'Funcionalidad en desarrollo',
      description: 'La edición de ventas estará disponible próximamente',
      variant: 'default'
    })
  }

  const handleDeleteVenta = async (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const response = await fetch(`/api/ventas/${ventaId}`, {
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
        fetchVentas()
        fetchStats()
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
    }
  }

  const handleApproveVenta = async (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
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

  const handleConfirmApprove = async () => {
    if (!selectedVentaForApprove) return

    setIsApproving(true)
    try {
      const response = await fetch(`/api/ventas/${selectedVentaForApprove.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion: 'APROBAR',
          observaciones: 'Venta aprobada desde el panel de proyecto'
        })
      })

      if (response.ok) {
        const tipoUnidad = selectedVentaForApprove.tipoVenta === 'LOTE' ? 'lote' : 'unidad de cementerio'
        toast({
          title: 'Venta aprobada exitosamente',
          description: `La venta ha sido aprobada y el ${tipoUnidad} marcado como vendido`,
          variant: 'default'
        })
        fetchVentas()
        fetchStats()
        setApproveAlertOpen(false)
        setSelectedVentaForApprove(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al aprobar la venta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error al aprobar',
        description: error instanceof Error ? error.message : 'No se pudo aprobar la venta',
        variant: 'destructive'
      })
    } finally {
      setIsApproving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const estados = {
      PENDIENTE: { label: 'Pendiente', variant: 'secondary' as const, icon: FiClock },
      APROBADA: { label: 'Aprobada', variant: 'default' as const, icon: FiCheckCircle },
      CANCELADA: { label: 'Cancelada', variant: 'destructive' as const, icon: FiXCircle },
      ENTREGADA: { label: 'Entregada', variant: 'default' as const, icon: FiCheckCircle }
    }
    
    const estadoInfo = estados[estado as keyof typeof estados] || { 
      label: estado, 
      variant: 'secondary' as const, 
      icon: FiClock 
    }
    
    return (
      <Badge variant={estadoInfo.variant} className="flex items-center gap-1">
        <estadoInfo.icon className="w-3 h-3" />
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
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <FiTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVentas}</div>
            <p className="text-xs text-muted-foreground">
              Ventas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <FiClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ventasPendientes}</div>
            <p className="text-xs text-muted-foreground">
              Esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <FiCheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ventasAprobadas}</div>
            <p className="text-xs text-muted-foreground">
              Ventas confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <FiDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.montoTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total de ventas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas de cuotas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Ventas a Cuotas</p>
                <p className="text-2xl font-bold text-blue-900">{stats.ventasCuotas}</p>
              </div>
              <FiCreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Cuotas Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.cuotasPendientes}</p>
              </div>
              <FiClock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Cuotas Vencidas</p>
                <p className="text-2xl font-bold text-red-900">{stats.cuotasVencidas}</p>
              </div>
              <FiXCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      {canCreateSales && (
        <div className="flex justify-end">
          <Button 
            onClick={() => handleCreateVenta(getTipoVenta())}
            className="flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Nueva Venta
          </Button>
        </div>
      )}

      {/* Lista de ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiDollarSign className="h-5 w-5" />
            Ventas del Proyecto
            {ventas.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {ventas.length} ventas
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando ventas...</div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-8">
              <FiDollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay ventas registradas
              </h3>
              <p className="text-gray-500">
                {canCreateSales 
                  ? 'Comienza registrando la primera venta del proyecto.'
                  : 'Aún no se han registrado ventas para este proyecto.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className="font-mono text-sm">
                      {venta.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {venta.unidad?.codigo || 'Sin código'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {venta.cliente ? `${venta.cliente.nombre} ${venta.cliente.apellido || ''}` : 'Cliente no disponible'}
                        </div>
                        {venta.cliente?.email && (
                          <div className="text-sm text-gray-500">{venta.cliente.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{venta.vendedor?.nombre || 'Vendedor no disponible'}</div>
                        <div className="text-sm text-gray-500">{venta.vendedor?.email || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(venta.precioVenta)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={venta.metodoPago === 'CUOTAS' ? 'default' : 'secondary'}>
                        {venta.metodoPago === 'CUOTAS' ? 'Cuotas' : 'Contado'}
                      </Badge>
                      {venta.metodoPago === 'CUOTAS' && venta.numeroCuotas && (
                        <div className="text-xs text-gray-500 mt-1">
                          {venta.numeroCuotas} cuotas
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getEstadoBadge(venta.estado)}</TableCell>
                    <TableCell>{formatDate(venta.fechaVenta)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Botón de Aprobar - solo para ventas pendientes */}
                        {canApprove(venta) && venta.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveVenta(venta.id, venta.tipoVenta)}
                            className="bg-green-600 hover:bg-green-700 text-white p-2"
                            title="Aprobar Venta"
                          >
                            <FiCheck className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {/* Botón de Cuotas - aparece si es venta a cuotas o si tiene cuotas */}
                        {(venta.metodoPago === 'CUOTAS' || (venta.numeroCuotas && venta.numeroCuotas > 0)) && canManageCuotas && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCuotas(venta.id, venta.tipoVenta)}
                            className="flex items-center gap-1"
                            title="Gestionar Cuotas"
                          >
                            <FiCreditCard className="w-3 h-3" />
                            Cuotas
                          </Button>
                        )}
                        
                        {/* Botón de Editar */}
                        {canCreateSales && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditVenta(venta.id, venta.tipoVenta)}
                            className="flex items-center gap-1"
                            title="Editar Venta"
                          >
                            <FiEdit2 className="w-3 h-3" />
                            Editar
                          </Button>
                        )}
                        
                        {/* Botón de Eliminar */}
                        {canCreateSales && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVenta(venta.id, venta.tipoVenta)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            title="Eliminar Venta"
                          >
                            <FiTrash2 className="w-3 h-3" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear venta */}
      <VentaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleVentaSuccess}
        tipoVenta={modalTipoVenta}
      />

      {/* Modal para ver cuotas */}
      <CuotasModal
        isOpen={isCuotasModalOpen}
        onClose={() => setIsCuotasModalOpen(false)}
        ventaId={selectedVentaForCuotas?.id || ''}
        tipoVenta={selectedVentaForCuotas?.tipo || 'LOTE'}
      />

      {/* Modal para aprobar venta */}
      <ApproveVentaAlert
        isOpen={approveAlertOpen}
        onClose={() => setApproveAlertOpen(false)}
        onConfirm={handleConfirmApprove}
        isApproving={isApproving}
        venta={selectedVentaForApprove}
      />
    </div>
  )
} 