'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiDollarSign, FiUser, FiMapPin, FiCalendar, FiCheckCircle, FiClock, FiXCircle, FiCreditCard, FiFile, FiDownload, FiEye } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState, useEffect } from 'react'

interface ComprobantePago {
  id: string
  tipo: string
  monto: number
  fecha: string
  descripcion?: string
  nombreArchivo: string
  mimeType: string
  tamanio: number
  createdAt: string
}

interface Venta {
  id: string
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
  estado: string
  precioVenta: number
  precioOriginal?: number
  montoDescuento?: number
  motivoDescuento?: string
  fechaVenta: string
  tipoVentaVenta: 'CONTADO' | 'CUOTAS'
  numeroCuotas?: number
  montoInicial?: number
  saldoPendiente?: number
  comisionVendedor?: number
  porcentajeComision?: number
  formaPago?: string
  estadoDocumentacion?: string
  fechaEntrega?: string
  condicionesEspeciales?: string
  observaciones?: string
  cliente: {
    id: string
    nombre: string
    apellido?: string
    email?: string
    telefono?: string
    dni?: string
    ruc?: string
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

interface VentaDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  venta: Venta | null
}

export default function VentaDetailsModal({ isOpen, onClose, venta }: VentaDetailsModalProps) {
  const [comprobantes, setComprobantes] = useState<ComprobantePago[]>([])
  const [loadingComprobantes, setLoadingComprobantes] = useState(false)

  // Cargar comprobantes cuando se abre el modal
  useEffect(() => {
    if (isOpen && venta) {
      cargarComprobantes()
    }
  }, [isOpen, venta])

  const cargarComprobantes = async () => {
    if (!venta) return

    console.log('=== DEBUG VentaDetailsModal ===')
    console.log('Venta completa:', venta)
    console.log('venta.tipoVenta:', venta.tipoVenta)
    console.log('venta.tipoVentaVenta:', venta.tipoVentaVenta)
    console.log('venta.id:', venta.id)
      console.log('venta.estado:', venta.estado)
      console.log('venta.precioVenta:', venta.precioVenta)

    setLoadingComprobantes(true)
    try {
      let url = '/api/comprobantes-pago?'
      
      if (venta.tipoVenta === 'LOTE') {
        url += `ventaLoteId=${venta.id}`
        console.log('Cargando comprobantes para venta de LOTE:', venta.id)
      } else if (venta.tipoVenta === 'UNIDAD_CEMENTERIO') {
        url += `ventaUnidadCementerioId=${venta.id}`
        console.log('Cargando comprobantes para venta de UNIDAD_CEMENTERIO:', venta.id)
      } else {
        console.error('Tipo de venta no reconocido:', venta.tipoVenta)
        console.error('Tipos válidos esperados: LOTE, UNIDAD_CEMENTERIO')
        console.error('Valor recibido:', venta.tipoVenta)
        setLoadingComprobantes(false)
        return
      }

      console.log('URL de la API:', url)
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Comprobantes cargados:', data)
        console.log('Número de comprobantes:', data.length)
        if (data.length === 0) {
          console.log('No se encontraron comprobantes para esta venta')
        }
        setComprobantes(data)
      } else {
        console.error('Error al cargar comprobantes, status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error al cargar comprobantes:', error)
    } finally {
      setLoadingComprobantes(false)
    }
  }

  const descargarComprobante = async (comprobanteId: string, nombreArchivo: string) => {
    try {
      const response = await fetch(`/api/comprobantes-pago/${comprobanteId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = nombreArchivo
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Error al descargar comprobante')
      }
    } catch (error) {
      console.error('Error al descargar comprobante:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!venta) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  }

  const getEstadoBadge = (estado: string) => {
    const estados = {
      PENDIENTE: { label: 'Pendiente', variant: 'secondary' as const, icon: FiClock, color: 'text-yellow-600' },
      APROBADA: { label: 'Aprobada', variant: 'default' as const, icon: FiCheckCircle, color: 'text-green-600' },
      CANCELADA: { label: 'Cancelada', variant: 'destructive' as const, icon: FiXCircle, color: 'text-red-600' },
      ENTREGADA: { label: 'Entregada', variant: 'default' as const, icon: FiCheckCircle, color: 'text-blue-600' }
    }
    
    const estadoInfo = estados[estado as keyof typeof estados] || { 
      label: estado, 
      variant: 'secondary' as const, 
      icon: FiClock,
      color: 'text-gray-600'
    }
    
    return (
      <Badge variant={estadoInfo.variant} className={`flex items-center gap-1 ${estadoInfo.color}`}>
        <estadoInfo.icon className="w-3 h-3" />
        {estadoInfo.label}
      </Badge>
    )
  }

  const getTipoVentaBadge = (tipoVenta: string) => {
    if (tipoVenta === 'CONTADO') {
      return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Contado</Badge>
    } else {
      return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Cuotas</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="venta-details-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiDollarSign className="h-5 w-5" />
            Detalles de Venta - {venta.unidad?.codigo || 'Sin código'}
          </DialogTitle>
          <DialogDescription id="venta-details-description">
            Información detallada de la venta, incluyendo datos del cliente, unidad, comprobantes de pago y estado de la transacción.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID de Venta</label>
                  <p className="font-mono text-sm">{venta.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">{getEstadoBadge(venta.estado)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Venta</label>
                  <div className="mt-1">{getTipoVentaBadge(venta.tipoVentaVenta)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Venta</label>
                  <p className="flex items-center gap-1">
                    <FiCalendar className="w-4 h-4" />
                    {formatDate(venta.fechaVenta)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Unidad */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FiMapPin className="h-5 w-5" />
                Información de la Unidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Código de Unidad</label>
                  <p className="font-medium">{venta.unidad?.codigo || 'Sin código'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Unidad</label>
                  <p className="capitalize">{venta.tipoVenta.toLowerCase().replace('_', ' ')}</p>
                </div>
                {venta.unidad?.manzana && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Manzana</label>
                    <p>{venta.unidad.manzana} ({venta.unidad.manzanaCodigo})</p>
                  </div>
                )}
                {venta.unidad?.pabellon && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pabellón</label>
                    <p>{venta.unidad.pabellon} ({venta.unidad.pabellonCodigo})</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FiUser className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre Completo</label>
                  <p className="font-medium">
                    {venta.cliente.nombre} {venta.cliente.apellido || ''}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p>{venta.cliente.email || 'No especificado'}</p>
                </div>
                {venta.cliente.telefono && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p>{venta.cliente.telefono}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Documento</label>
                  <p>{venta.cliente.dni || venta.cliente.ruc || 'No especificado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FiDollarSign className="h-5 w-5" />
                Información Financiera
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Precio Original</label>
                  <p className="font-medium text-lg">{formatCurrency(venta.precioOriginal || venta.precioVenta)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Precio de Venta</label>
                  <p className="font-medium text-lg text-green-600">{formatCurrency(venta.precioVenta)}</p>
                </div>
                {venta.montoDescuento && venta.montoDescuento > 0 && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Descuento</label>
                      <p className="font-medium text-red-600">-{formatCurrency(venta.montoDescuento)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Motivo del Descuento</label>
                      <p>{venta.motivoDescuento || 'No especificado'}</p>
                    </div>
                  </>
                )}
                {venta.tipoVentaVenta === 'CUOTAS' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Monto Inicial</label>
                      <p className="font-medium">{formatCurrency(venta.montoInicial || 0)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Saldo Pendiente</label>
                      <p className="font-medium">{formatCurrency(venta.saldoPendiente || 0)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Número de Cuotas</label>
                      <p className="font-medium">{venta.numeroCuotas || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Forma de Pago</label>
                      <p>{venta.formaPago || 'No especificado'}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información del Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p className="font-medium">{venta.vendedor.nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p>{venta.vendedor.email}</p>
                </div>
                {venta.comisionVendedor && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Comisión</label>
                    <p className="font-medium">{formatCurrency(venta.comisionVendedor)}</p>
                  </div>
                )}
                {venta.porcentajeComision && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Porcentaje de Comisión</label>
                    <p>{venta.porcentajeComision}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          {(venta.estadoDocumentacion || venta.fechaEntrega || venta.condicionesEspeciales || venta.observaciones) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {venta.estadoDocumentacion && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado de Documentación</label>
                    <p>{venta.estadoDocumentacion}</p>
                  </div>
                )}
                {venta.fechaEntrega && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Entrega</label>
                    <p className="flex items-center gap-1">
                      <FiCalendar className="w-4 h-4" />
                      {formatDate(venta.fechaEntrega)}
                    </p>
                  </div>
                )}
                {venta.condicionesEspeciales && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Condiciones Especiales</label>
                    <p className="whitespace-pre-wrap">{venta.condicionesEspeciales}</p>
                  </div>
                )}
                {venta.observaciones && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Observaciones</label>
                    <p className="whitespace-pre-wrap">{venta.observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Información de Aprobación */}
          {venta.aprobador && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Aprobación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Aprobado por</label>
                    <p className="font-medium">{venta.aprobador.nombre}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email del Aprobador</label>
                    <p>{venta.aprobador.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comprobantes de Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FiFile className="h-5 w-5" />
                Comprobantes de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingComprobantes ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Cargando comprobantes...</p>
                </div>
              ) : comprobantes.length > 0 ? (
                <div className="space-y-3">
                  {comprobantes.map((comprobante) => (
                    <div key={comprobante.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FiFile className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{comprobante.nombreArchivo}</span>
                            <Badge variant="outline" className="text-xs">
                              {comprobante.tipo}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Monto:</span> {formatCurrency(comprobante.monto)}
                            </div>
                            <div>
                              <span className="font-medium">Fecha:</span> {formatDate(comprobante.fecha)}
                            </div>
                            <div>
                              <span className="font-medium">Tamaño:</span> {formatFileSize(comprobante.tamanio)}
                            </div>
                          </div>
                          {comprobante.descripcion && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Descripción:</span> {comprobante.descripcion}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => descargarComprobante(comprobante.id, comprobante.nombreArchivo)}
                            className="flex items-center gap-1"
                          >
                            <FiDownload className="w-3 h-3" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiFile className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay comprobantes de pago registrados para esta venta</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 