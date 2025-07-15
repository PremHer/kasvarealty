'use client'

import { useState, useEffect } from 'react'
import { FiUser, FiMail, FiPhone, FiMapPin, FiDollarSign, FiCalendar, FiFileText, FiDownload, FiEye, FiX, FiShield, FiCheckCircle, FiClock, FiCreditCard, FiTrendingUp, FiHome, FiUserCheck } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'

interface Comprobante {
  id: string
  nombreArchivo: string
  driveFileUrl?: string
  driveDownloadUrl?: string
  mimeType: string
  tamanio: number
  createdAt: string
  tipo: string
  monto: number
  descripcion?: string
}

interface VentaDetailsExpandedProps {
  venta: {
    id: string
    tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
    estado: string
    precioVenta: number
    fechaVenta: string
    tipoVentaVenta: 'CONTADO' | 'CUOTAS'
    numeroCuotas?: number
    montoInicial?: number
    saldoPendiente?: number
    cliente: {
      id: string
      nombre: string
      apellido?: string
      email?: string
      telefono?: string
      direccion?: string
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
}

export default function VentaDetailsExpanded({ venta }: VentaDetailsExpandedProps) {
  const { toast } = useToast()
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loadingComprobantes, setLoadingComprobantes] = useState(true)

  useEffect(() => {
    fetchComprobantes()
  }, [venta.id])

  const fetchComprobantes = async () => {
    try {
      setLoadingComprobantes(true)
      // Determinar el parámetro correcto según el tipo de venta
      const paramName = venta.tipoVenta === 'LOTE' ? 'ventaLoteId' : 'ventaUnidadCementerioId'
      const response = await fetch(`/api/comprobantes-pago?${paramName}=${venta.id}`)
      if (response.ok) {
        const data = await response.json()
        setComprobantes(data || [])
      }
    } catch (error) {
      console.error('Error al cargar comprobantes:', error)
    } finally {
      setLoadingComprobantes(false)
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleVerComprobante = async (comprobante: Comprobante) => {
    try {
      if (comprobante.driveFileUrl) {
        window.open(comprobante.driveFileUrl, '_blank')
      } else if (comprobante.driveDownloadUrl) {
        const response = await fetch(comprobante.driveDownloadUrl)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = comprobante.nombreArchivo
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (error) {
      console.error('Error al abrir comprobante:', error)
      toast({
        title: 'Error',
        description: 'No se pudo abrir el comprobante',
        variant: 'destructive'
      })
    }
  }

  const handleDescargarComprobante = async (comprobante: Comprobante) => {
    try {
      if (comprobante.driveDownloadUrl) {
        const response = await fetch(comprobante.driveDownloadUrl)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = comprobante.nombreArchivo
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }
    } catch (error) {
      console.error('Error al descargar comprobante:', error)
      toast({
        title: 'Error',
        description: 'No se pudo descargar el comprobante',
        variant: 'destructive'
      })
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'APROBADA':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'DESAPROBADA':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'CANCELADA':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'ENTREGADA':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTipoVentaColor = (tipo: string) => {
    switch (tipo) {
      case 'CUOTAS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CONTADO':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-t-2 border-blue-200 p-6">
      <div className="max-w-full space-y-6">
        
        {/* Header con información principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Detalles de Venta
              </h3>
              <p className="text-sm text-gray-600">
                ID: {venta.id.slice(-8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`px-3 py-1 text-xs font-medium border ${getEstadoColor(venta.estado)}`}>
              {venta.estado}
            </Badge>
            <Badge className={`px-3 py-1 text-xs font-medium border ${getTipoVentaColor(venta.tipoVentaVenta)}`}>
              {venta.tipoVentaVenta === 'CUOTAS' ? 'A Cuotas' : 'Contado'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Información de la venta */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Información de los Clientes */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                  <FiUser className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Cliente{venta.clientes && venta.clientes.length > 0 ? 's' : ''}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Cliente principal */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <span className="text-sm font-semibold text-blue-600">
                    {venta.cliente?.nombre?.charAt(0) || 'C'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {venta.cliente ? `${venta.cliente.nombre} ${venta.cliente.apellido || ''}` : 'Cliente no disponible'}
                  </div>
                  {venta.cliente?.email && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                      <FiMail className="w-3 h-3" />
                      {venta.cliente.email}
                    </div>
                  )}
                  <div className="text-xs text-blue-600 font-medium">Cliente principal</div>
                </div>
              </div>

              {/* Clientes adicionales */}
              {venta.clientes && venta.clientes.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600">Clientes adicionales:</div>
                    {venta.clientes.map((clienteRel, index) => (
                      <div key={clienteRel.cliente.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <span className="text-xs font-semibold text-green-600">
                            {clienteRel.cliente.nombre?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {`${clienteRel.cliente.nombre} ${clienteRel.cliente.apellido || ''}`}
                          </div>
                          {clienteRel.cliente.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                              <FiMail className="w-2 h-2" />
                              {clienteRel.cliente.email}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Información del Vendedor */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                  <FiUserCheck className="w-4 h-4 text-orange-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-900">Vendedor</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
                  <span className="text-sm font-semibold text-orange-600">
                    {venta.vendedor?.nombre?.charAt(0) || 'V'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {venta.vendedor?.nombre || 'Vendedor no disponible'}
                  </div>
                  {venta.vendedor?.email && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 truncate">
                      <FiMail className="w-3 h-3" />
                      {venta.vendedor.email}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Unidad */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                  <FiHome className="w-4 h-4 text-green-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-900">Unidad</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <span className="text-sm font-semibold text-green-600">
                    {venta.unidad?.codigo?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {venta.unidad?.codigo || 'Sin código'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {venta.tipoVenta === 'LOTE' ? 'Lote' : 'Unidad Cementerio'}
                    {venta.unidad?.manzana && ` • ${venta.unidad.manzana}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información financiera */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Detalles de pago */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                  <FiDollarSign className="w-4 h-4 text-green-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-900">Información de Pago</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Precio de Venta</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(venta.precioVenta)}</span>
              </div>
              
              {venta.tipoVentaVenta === 'CUOTAS' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Número de Cuotas</span>
                      <span className="text-sm font-semibold text-blue-600">{venta.numeroCuotas || 0}</span>
                    </div>
                    {venta.montoInicial && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Monto Inicial</span>
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(venta.montoInicial)}</span>
                      </div>
                    )}
                    {venta.saldoPendiente && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Saldo Pendiente</span>
                        <span className="text-sm font-semibold text-orange-600">{formatCurrency(venta.saldoPendiente)}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fechas y estado */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                  <FiCalendar className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-900">Fechas y Estado</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Fecha de Venta</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(venta.fechaVenta)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Fecha de Registro</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(venta.createdAt)}</span>
                </div>
              </div>
              
              {venta.aprobador && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <FiShield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Aprobado por:</span>
                    <span className="text-sm font-semibold text-gray-900">{venta.aprobador.nombre}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comprobantes de Pago */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                  <FiFileText className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-900">Comprobantes de Pago</CardTitle>
              </div>
              {comprobantes.length > 0 && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                  {comprobantes.length} archivo{comprobantes.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingComprobantes ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <p className="text-sm text-gray-600">Cargando comprobantes...</p>
                </div>
              </div>
            ) : comprobantes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                  <FiFileText className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-sm text-gray-600">No hay comprobantes registrados</p>
                <p className="text-xs text-gray-500 mt-1">Los comprobantes aparecerán aquí cuando se suban</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comprobantes.map((comprobante) => (
                  <div key={comprobante.id} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                        <FiFileText className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {comprobante.nombreArchivo}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            {comprobante.tipo}
                          </Badge>
                          <span className="font-medium">{formatCurrency(comprobante.monto)}</span>
                          <span>•</span>
                          <span>{formatDate(comprobante.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerComprobante(comprobante)}
                        className="h-8 w-8 p-0 border-purple-200 text-purple-600 hover:bg-purple-50"
                        title="Ver comprobante"
                      >
                        <FiEye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDescargarComprobante(comprobante)}
                        className="h-8 w-8 p-0 border-purple-200 text-purple-600 hover:bg-purple-50"
                        title="Descargar comprobante"
                      >
                        <FiDownload className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 