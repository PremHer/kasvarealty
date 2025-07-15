'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { 
  FiDollarSign, 
  FiCalendar, 
  FiCheck, 
  FiX, 
  FiClock, 
  FiAlertCircle,
  FiDownload,
  FiPlus,
  FiRefreshCw,
  FiFileText,
  FiList,
  FiEye,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PagoCuota {
  id: string
  monto: number
  fechaPago: string
  formaPago?: string
  voucherPago?: string
  observaciones?: string
  creadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  }
  comprobante?: {
    id: string
    nombreArchivo: string
    driveFileUrl: string
    driveDownloadUrl?: string
    mimeType: string
    tamanio: number
  }
  createdAt: string
}

interface Cuota {
  id: string
  numeroCuota: number
  monto: number
  fechaVencimiento: string
  fechaPago?: string
  montoPagado: number
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'CANCELADA' | 'PARCIAL'
  observaciones?: string
  ventaId: string
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
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
  unidad: {
    id: string
    codigo: string
    tipo: string
  }
  proyecto: {
    id: string
    nombre: string
  }
  createdAt: string
  updatedAt: string
}

interface CuotasModalProps {
  isOpen: boolean
  onClose: () => void
  ventaId: string
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
}

export default function CuotasModal({ isOpen, onClose, ventaId, tipoVenta }: CuotasModalProps) {
  const [cuotas, setCuotas] = useState<Cuota[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCuotas: 0,
    cuotasPagadas: 0,
    cuotasPendientes: 0,
    cuotasVencidas: 0,
    montoTotal: 0,
    montoPagado: 0,
    montoPendiente: 0
  })
  
  // Estados para gestión de pagos integrada
  const [expandedCuota, setExpandedCuota] = useState<string | null>(null)
  const [pagos, setPagos] = useState<PagoCuota[]>([])
  const [loadingPagos, setLoadingPagos] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [creandoPago, setCreandoPago] = useState(false)
  const [formData, setFormData] = useState({
    monto: '',
    fechaPago: format(new Date(), 'yyyy-MM-dd'),
    formaPago: '',
    voucherPago: '',
    observaciones: '',
    comprobanteArchivo: null as File | null,
    comprobanteNombre: ''
  })
  
  const { toast } = useToast()

  const fetchCuotas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cuotas?ventaId=${ventaId}`)
      if (!response.ok) {
        throw new Error('Error al cargar cuotas')
      }
      const data = await response.json()
      setCuotas(data.cuotas)
      calcularEstadisticas(data.cuotas)
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

  const calcularEstadisticas = (cuotasData: Cuota[]) => {
    const totalCuotas = cuotasData.length
    const cuotasPagadas = cuotasData.filter(c => c.estado === 'PAGADA').length
    const cuotasPendientes = cuotasData.filter(c => c.estado === 'PENDIENTE').length
    const cuotasVencidas = cuotasData.filter(c => c.estado === 'VENCIDA').length
    const montoTotal = cuotasData.reduce((sum, c) => sum + c.monto, 0)
    const montoPagado = cuotasData.reduce((sum, c) => sum + c.montoPagado, 0)
    const montoPendiente = montoTotal - montoPagado

    setStats({
      totalCuotas,
      cuotasPagadas,
      cuotasPendientes,
      cuotasVencidas,
      montoTotal,
      montoPagado,
      montoPendiente
    })
  }

  useEffect(() => {
    if (isOpen && ventaId) {
      fetchCuotas()
    }
  }, [isOpen, ventaId])

  const handlePagoCreado = () => {
    fetchCuotas()
  }

  const handleCuotaActualizada = (cuotaActualizada: any) => {
    setCuotas(prevCuotas => {
      const cuotasActualizadas = prevCuotas.map(cuota => 
        cuota.id === cuotaActualizada.id 
          ? {
              ...cuota,
              montoPagado: cuotaActualizada.montoPagado,
              estado: cuotaActualizada.estado,
              fechaPago: cuotaActualizada.fechaPago
            }
          : cuota
      )
      
      calcularEstadisticas(cuotasActualizadas)
      return cuotasActualizadas
    })
  }

  const getEstadoBadge = (estado: string) => {
    const estados = {
      PENDIENTE: { label: 'Pendiente', variant: 'secondary' as const, icon: FiClock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
      PAGADA: { label: 'Pagada', variant: 'default' as const, icon: FiCheck, color: 'text-green-600 bg-green-50 border-green-200' },
      VENCIDA: { label: 'Vencida', variant: 'destructive' as const, icon: FiAlertCircle, color: 'text-red-600 bg-red-50 border-red-200' },
      CANCELADA: { label: 'Cancelada', variant: 'destructive' as const, icon: FiX, color: 'text-gray-600 bg-gray-50 border-gray-200' },
      PARCIAL: { label: 'Parcial', variant: 'outline' as const, icon: FiDollarSign, color: 'text-blue-600 bg-blue-50 border-blue-200' }
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
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  const isCuotaVencida = (fechaVencimiento: string) => {
    return new Date(fechaVencimiento) < new Date()
  }

  // Funciones para gestión de pagos integrada
  const fetchPagos = async (cuotaId: string) => {
    try {
      setLoadingPagos(true)
      const response = await fetch(`/api/cuotas/${cuotaId}/pagos`)
      if (!response.ok) {
        throw new Error('Error al cargar pagos')
      }
      const data = await response.json()
      console.log('Datos de pagos recibidos:', data)
      console.log('Pagos con comprobantes:', data.pagos?.map((p: any) => ({
        id: p.id,
        monto: p.monto,
        comprobanteId: p.comprobanteId,
        comprobante: p.comprobante ? {
          id: p.comprobante.id,
          nombreArchivo: p.comprobante.nombreArchivo,
          tamanio: p.comprobante.tamanio
        } : null
      })))
      setPagos(data.pagos || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los pagos',
        variant: 'destructive'
      })
    } finally {
      setLoadingPagos(false)
    }
  }

  const handleFileUpload = (file: File) => {
    if (file) {
      // Validar tipo de archivo (PDF, JPG, PNG)
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!tiposPermitidos.includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Solo se permiten archivos PDF, JPG o PNG',
          variant: 'destructive'
        })
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'El archivo no puede ser mayor a 5MB',
          variant: 'destructive'
        })
        return
      }

      setFormData(prev => ({
        ...prev,
        comprobanteArchivo: file,
        comprobanteNombre: file.name
      }))
    }
  }

  const handleVerComprobante = async (comprobante: any) => {
    try {
      if (comprobante?.driveFileUrl) {
        const newWindow = window.open(comprobante.driveFileUrl, '_blank')
        
        if (!newWindow || newWindow.closed) {
          await handleMakePublic(comprobante.id)
        }
      } else {
        toast({
          title: 'Error',
          description: 'No se puede abrir el comprobante. URL no disponible.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error al abrir comprobante:', error)
      await handleMakePublic(comprobante.id)
    }
  }

  const handleDescargarComprobante = async (comprobante: any) => {
    try {
      if (!comprobante) {
        toast({
          title: 'Error',
          description: 'Información del comprobante no disponible',
          variant: 'destructive'
        })
        return
      }

      if (comprobante.driveDownloadUrl) {
        const link = document.createElement('a')
        link.href = comprobante.driveDownloadUrl
        link.download = comprobante.nombreArchivo
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (comprobante.driveFileUrl) {
        const newWindow = window.open(comprobante.driveFileUrl, '_blank')
        
        if (!newWindow || newWindow.closed) {
          await handleMakePublic(comprobante.id)
        }
      } else {
        toast({
          title: 'Error',
          description: 'No hay enlaces disponibles para descargar el comprobante',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error al descargar comprobante:', error)
      await handleMakePublic(comprobante.id)
    }
  }

  const handleMakePublic = async (comprobanteId: string) => {
    try {
      toast({
        title: 'Configurando acceso...',
        description: 'Haciendo público el archivo para que puedas acceder',
        variant: 'default'
      })

      const response = await fetch(`/api/comprobantes-pago/${comprobanteId}/make-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Archivo configurado',
          description: 'El archivo ahora es accesible públicamente',
          variant: 'default'
        })
        
        if (expandedCuota) {
          await fetchPagos(expandedCuota)
        }
      } else {
        throw new Error('Error al hacer público el archivo')
      }
    } catch (error) {
      console.error('Error al hacer público el archivo:', error)
      toast({
        title: 'Error',
        description: 'No se pudo configurar el acceso al archivo',
        variant: 'destructive'
      })
    }
  }

  const handleCrearPago = async () => {
    if (!expandedCuota) return

    try {
      setCreandoPago(true)
      
      const formDataToSend = new FormData()
      formDataToSend.append('monto', formData.monto)
      formDataToSend.append('fechaPago', formData.fechaPago)
      formDataToSend.append('formaPago', formData.formaPago)
      formDataToSend.append('voucherPago', formData.voucherPago)
      formDataToSend.append('observaciones', formData.observaciones)
      
      // Agregar archivo de comprobante si existe, usando la misma estructura que en ventas
      if (formData.comprobanteArchivo) {
        formDataToSend.append('comprobante_0', formData.comprobanteArchivo)
        formDataToSend.append('comprobante_0_data', JSON.stringify({
          tipo: 'CUOTA',
          monto: parseFloat(formData.monto),
          fecha: formData.fechaPago,
          descripcion: `Comprobante de pago - ${formData.formaPago || 'Pago'}`
        }))
      }

      const response = await fetch(`/api/cuotas/${expandedCuota}/pagos`, {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear pago')
      }

      const responseData = await response.json()
      console.log('Respuesta del pago creado:', responseData)
      console.log('Pago con comprobante:', responseData.pago?.comprobante)
      
      await fetchPagos(expandedCuota)
      await fetchCuotas()
      
      setFormData({
        monto: '',
        fechaPago: format(new Date(), 'yyyy-MM-dd'),
        formaPago: '',
        voucherPago: '',
        observaciones: '',
        comprobanteArchivo: null,
        comprobanteNombre: ''
      })
      setShowForm(false)
      
      // Verificar el estado del archivo
      if (formData.comprobanteArchivo) {
        if (responseData.archivoGuardado) {
          if (responseData.pago.comprobante?.driveFileId === 'LOCAL_BACKUP') {
            toast({
              title: 'Pago registrado',
              description: 'El pago se registró correctamente. El archivo se guardó localmente como respaldo.',
              variant: 'default'
            })
          } else {
            toast({
              title: 'Pago registrado',
              description: 'El pago se registró correctamente con el archivo subido a Google Drive',
              variant: 'default'
            })
          }
        } else {
          toast({
            title: 'Pago registrado',
            description: 'El pago se registró correctamente, pero no se pudo guardar el archivo',
            variant: 'destructive'
          })
        }
      } else {
        toast({
          title: 'Pago registrado',
          description: 'La información se ha actualizado correctamente',
          variant: 'default'
        })
      }
      
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el pago',
        variant: 'destructive'
      })
    } finally {
      setCreandoPago(false)
    }
  }

  const handleToggleExpansion = async (cuotaId: string) => {
    if (expandedCuota === cuotaId) {
      setExpandedCuota(null)
      setPagos([])
      setShowForm(false)
    } else {
      setExpandedCuota(cuotaId)
      await fetchPagos(cuotaId)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiDollarSign className="h-5 w-5" />
            Gestión de Cuotas
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCuotas}
              className="ml-auto"
            >
              <FiRefreshCw className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Cuotas</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCuotas}</p>
              </div>
              <FiDollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Pagadas</p>
                <p className="text-2xl font-bold text-green-900">{stats.cuotasPagadas}</p>
              </div>
              <FiCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.cuotasPendientes}</p>
              </div>
              <FiClock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-900">{stats.cuotasVencidas}</p>
              </div>
              <FiAlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm font-medium text-gray-600">Monto Total</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.montoTotal)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-600">Monto Pagado</p>
            <p className="text-xl font-bold text-green-900">{formatCurrency(stats.montoPagado)}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm font-medium text-orange-600">Monto Pendiente</p>
            <p className="text-xl font-bold text-orange-900">{formatCurrency(stats.montoPendiente)}</p>
          </div>
        </div>

        {/* Tabla de cuotas */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cuotas de la Venta</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: 'Funcionalidad en desarrollo',
                  description: 'La exportación de cuotas estará disponible próximamente',
                  variant: 'default'
                })
              }}
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <FiRefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Cargando cuotas...</p>
            </div>
          ) : cuotas.length === 0 ? (
            <div className="text-center py-8">
              <FiDollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cuotas registradas</h3>
              <p className="text-gray-500">Esta venta no tiene cuotas configuradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Cuota</TableHead>
                    <TableHead className="font-semibold">Monto</TableHead>
                    <TableHead className="font-semibold">Vencimiento</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Pago</TableHead>
                    <TableHead className="font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuotas.map((cuota) => (
                    <React.Fragment key={cuota.id}>
                    <TableRow 
                      className={`hover:bg-gray-50 transition-colors ${
                        isCuotaVencida(cuota.fechaVencimiento) && cuota.estado === 'PENDIENTE' 
                          ? 'bg-red-50' 
                          : ''
                      }`}
                    >
                      <TableCell>
                        <div className="font-medium">Cuota {cuota.numeroCuota}</div>
                        {cuota.observaciones && (
                          <div className="text-xs text-gray-500 mt-1">
                            {cuota.observaciones}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{formatCurrency(cuota.monto)}</div>
                        {cuota.montoPagado > 0 && (
                          <div className="text-sm text-gray-500">
                            Pagado: {formatCurrency(cuota.montoPagado)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatDate(cuota.fechaVencimiento)}</div>
                        {isCuotaVencida(cuota.fechaVencimiento) && cuota.estado === 'PENDIENTE' && (
                          <div className="text-xs text-red-600 font-medium">
                            Vencida
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(cuota.estado)}
                      </TableCell>
                      <TableCell>
                        {cuota.fechaPago ? (
                          <div>
                            <div className="font-medium">{formatDate(cuota.fechaPago)}</div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(cuota.montoPagado)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin pago</span>
                        )}
                      </TableCell>
                      <TableCell>
                          <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                              onClick={() => handleToggleExpansion(cuota.id)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              title="Ver pagos"
                        >
                              {expandedCuota === cuota.id ? (
                                <FiChevronUp className="h-3 w-3" />
                              ) : (
                                <FiChevronDown className="h-3 w-3" />
                              )}
                              Pagos
                        </Button>
                          </div>
                      </TableCell>
                    </TableRow>
                      
                      {/* Fila expandible para gestión de pagos */}
                      {expandedCuota === cuota.id && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <div className="bg-gray-50 border-t border-gray-200 p-6">
                              {/* Resumen de la cuota */}
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Cuota {cuota.numeroCuota}</h3>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-blue-700">Monto total:</span>
                                        <span className="font-semibold text-blue-900">{formatCurrency(cuota.monto)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-blue-700">Monto pagado:</span>
                                        <span className="font-semibold text-green-600">{formatCurrency(cuota.montoPagado)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-blue-700">Monto pendiente:</span>
                                        <span className="font-semibold text-orange-600">{formatCurrency(cuota.monto - cuota.montoPagado)}</span>
                                      </div>
            </div>
        </div>

                <div>
                                    <div className="mb-2">
                                      {getEstadoBadge(cuota.estado)}
                                    </div>
                                    <div className="text-sm text-blue-700">
                                      <div>Vencimiento: {formatDate(cuota.fechaVencimiento)}</div>
                                      <div>Progreso: {((cuota.montoPagado / cuota.monto) * 100).toFixed(1)}%</div>
                                    </div>
                </div>

                <div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                      <div 
                                        className="h-3 rounded-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${Math.min((cuota.montoPagado / cuota.monto) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {cuota.montoPagado} de {cuota.monto} pagado
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Botones de acción */}
                              <div className="mb-4 flex gap-2">
                                {cuota.monto - cuota.montoPagado > 0 && (
                                  <Button 
                                    onClick={() => setShowForm(!showForm)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <FiPlus className="w-4 h-4 mr-2" />
                                    {showForm ? 'Cancelar' : 'Agregar Pago'}
                                  </Button>
                                )}
                                <Button 
                                  onClick={async () => {
                                    await fetchPagos(cuota.id)
                                  }}
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <FiRefreshCw className="w-4 h-4 mr-2" />
                                  Actualizar
                                </Button>
                              </div>

                              {/* Formulario de pago */}
                              {showForm && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                                  <h4 className="font-medium text-gray-900 mb-4">Registrar Nuevo Pago</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="monto">Monto</Label>
                  <Input
                                        id="monto"
                    type="number"
                    step="0.01"
                                        value={formData.monto}
                                        onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                                        placeholder={`Máximo: ${formatCurrency(cuota.monto - cuota.montoPagado)}`}
                                        max={cuota.monto - cuota.montoPagado}
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        Monto pendiente: {formatCurrency(cuota.monto - cuota.montoPagado)}
                                      </p>
                </div>

                <div>
                  <Label htmlFor="fechaPago">Fecha de Pago</Label>
                  <Input
                    id="fechaPago"
                    type="date"
                                        value={formData.fechaPago}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fechaPago: e.target.value }))}
                  />
                </div>

                <div>
                                      <Label htmlFor="formaPago">Forma de Pago</Label>
                                      <Select value={formData.formaPago} onValueChange={(value) => setFormData(prev => ({ ...prev, formaPago: value }))}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Seleccionar forma de pago" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                          <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                          <SelectItem value="DEPOSITO">Depósito</SelectItem>
                                          <SelectItem value="CHEQUE">Cheque</SelectItem>
                                          <SelectItem value="TARJETA_CREDITO">Tarjeta de Crédito</SelectItem>
                                          <SelectItem value="TARJETA_DEBITO">Tarjeta de Débito</SelectItem>
                                          <SelectItem value="YAPE">Yape</SelectItem>
                                          <SelectItem value="PLIN">Plin</SelectItem>
                                          <SelectItem value="OTRO">Otro</SelectItem>
                                        </SelectContent>
                                      </Select>
                </div>

                <div>
                                      <Label htmlFor="voucherPago">Voucher/Comprobante</Label>
                  <Input
                    id="voucherPago"
                                        value={formData.voucherPago}
                                        onChange={(e) => setFormData(prev => ({ ...prev, voucherPago: e.target.value }))}
                    placeholder="Número de voucher"
                  />
                </div>

                                    <div className="md:col-span-2">
                                      <Label htmlFor="observaciones">Observaciones</Label>
                                      <Textarea
                                        id="observaciones"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                                        placeholder="Observaciones sobre el pago"
                                        rows={3}
                                      />
                                    </div>

                                    <div className="md:col-span-2">
                  <Label htmlFor="comprobanteArchivo">Comprobante de Pago</Label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="comprobanteArchivo"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(file)
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                                        {formData.comprobanteNombre && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                        <FiFileText className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-700">{formData.comprobanteNombre}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Formatos permitidos: PDF, JPG, PNG (máximo 5MB)
                    </p>
                  </div>
                </div>
              </div>

                                  <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                                    <Button 
                                      onClick={handleCrearPago}
                                      disabled={creandoPago || !formData.monto || parseFloat(formData.monto) <= 0}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {creandoPago ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                          Creando...
                                        </>
                                      ) : (
                                        <>
                                          <FiCheck className="w-4 h-4 mr-2" />
                                          Registrar Pago
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Historial de pagos */}
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm text-gray-700">Historial de Pagos</h4>
                                
                                {loadingPagos ? (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-gray-600">Cargando pagos...</p>
                                  </div>
                                ) : pagos.length === 0 ? (
                                  <div className="text-center py-4">
                                    <FiDollarSign className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">No hay pagos registrados</h4>
                                    <p className="text-xs text-gray-500">Esta cuota aún no tiene pagos registrados</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {pagos.map((pago: PagoCuota) => (
                                      <div key={pago.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="text-sm font-medium text-gray-900">
                                                ${pago.monto.toFixed(2)}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {new Date(pago.fechaPago).toLocaleDateString('es-ES')}
                                              </span>
                                            </div>
                                            {pago.formaPago && (
                                              <p className="text-xs text-gray-600 mt-1">
                                                Forma de pago: {pago.formaPago}
                                              </p>
                                            )}
                                            {pago.observaciones && (
                                              <p className="text-xs text-gray-600 mt-1">
                                                {pago.observaciones}
                                              </p>
                                            )}
                                            {pago.creadoPorUsuario && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                Registrado por: {pago.creadoPorUsuario.nombre}
                                              </p>
                                            )}
                                            {pago.comprobante && (
                                              <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                                <div className="flex-1">
                                                  <span className="text-xs text-blue-700 font-medium">
                                                    Comprobante: {pago.comprobante.nombreArchivo}
                                                  </span>
                                                  <div className="text-xs text-blue-600">
                                                    {(pago.comprobante.tamanio / 1024).toFixed(1)} KB
                                                  </div>
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleVerComprobante(pago.comprobante)}
                                                    className="h-7 px-2 text-xs bg-white hover:bg-blue-50"
                                                    title="Ver comprobante"
                                                  >
                                                    <FiEye className="h-3 w-3 mr-1" />
                                                    Ver
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDescargarComprobante(pago.comprobante)}
                                                    className="h-7 px-2 text-xs bg-white hover:bg-blue-50"
                                                    title="Descargar comprobante"
                                                  >
                                                    <FiDownload className="h-3 w-3 mr-1" />
                                                    Descargar
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleMakePublic(pago.comprobante?.id || '')}
                                                    className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                                    title="Hacer público el archivo"
                                                  >
                                                    <FiRefreshCw className="h-3 w-3 mr-1" />
                                                    Hacer Público
                </Button>
              </div>
            </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 