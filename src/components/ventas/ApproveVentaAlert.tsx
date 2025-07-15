'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, AlertTriangle, DollarSign, User, Calendar, MapPin, Home, Shield, FileText, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

interface ApproveVentaAlertProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (action: 'APROBAR' | 'DESAPROBAR') => void
  venta: Venta | null
  isLoading?: boolean
}

export function ApproveVentaAlert({
  isOpen,
  onClose,
  onConfirm,
  venta,
  isLoading = false
}: ApproveVentaAlertProps) {
  const [selectedAction, setSelectedAction] = useState<'APROBAR' | 'DESAPROBAR' | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  }

  const IconComponent = venta?.tipoVenta === 'LOTE' ? MapPin : Home

  const getTipoUnidadLabel = () => {
    return venta?.tipoVenta === 'LOTE' ? 'Lote' : 'Unidad de Cementerio'
  }

  if (!venta) return null

  const handleConfirm = () => {
    if (selectedAction) {
      onConfirm(selectedAction)
    }
  }

  const handleClose = () => {
    setSelectedAction(null)
    onClose()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            Gestionar Estado de Venta
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-6 pt-4">
              {/* Banner de selección de acción */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full flex-shrink-0">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      Selecciona la acción a realizar
                    </h3>
                    <p className="text-blue-700 leading-relaxed">
                      Elige si deseas aprobar o desaprobar esta venta. Cada acción tendrá diferentes consecuencias en el estado de la unidad.
                    </p>
                  </div>
                </div>
              </div>

                              {/* Botones de acción */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Botón Aprobar */}
                  <Button
                    onClick={() => setSelectedAction('APROBAR')}
                    className={`h-auto min-h-[80px] p-4 text-left transition-all ${
                      selectedAction === 'APROBAR'
                        ? 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-600'
                        : 'bg-white hover:bg-green-50 border-2 border-green-200 text-green-700 hover:text-green-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                        selectedAction === 'APROBAR' ? 'bg-white' : 'bg-green-100'
                      }`}>
                        <CheckCircle className={`h-5 w-5 ${
                          selectedAction === 'APROBAR' ? 'text-green-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold mb-1">Aprobar Venta</div>
                        <div className="text-sm opacity-80 leading-tight">
                          Marcar como APROBADA y lote como VENDIDO
                        </div>
                      </div>
                    </div>
                  </Button>

                  {/* Botón Desaprobar */}
                  <Button
                    onClick={() => setSelectedAction('DESAPROBAR')}
                    className={`h-auto min-h-[80px] p-4 text-left transition-all ${
                      selectedAction === 'DESAPROBAR'
                        ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-600'
                        : 'bg-white hover:bg-red-50 border-2 border-red-200 text-red-700 hover:text-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                        selectedAction === 'DESAPROBAR' ? 'bg-white' : 'bg-red-100'
                      }`}>
                        <XCircle className={`h-5 w-5 ${
                          selectedAction === 'DESAPROBAR' ? 'text-red-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold mb-1">Desaprobar Venta</div>
                        <div className="text-sm opacity-80 leading-tight">
                          Marcar como DESAPROBADA y lote como DISPONIBLE
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>

              {/* Información principal de la venta */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información de la unidad */}
                <Card className="border-2 border-blue-100 bg-blue-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{getTipoUnidadLabel()}</h4>
                        <p className="text-sm text-gray-600">Información de la unidad</p>
                      </div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4">
                      <div className="text-lg font-bold text-blue-800 mb-2">
                          {venta.tipoVenta === 'LOTE' ? (
                            <>
                              {venta.unidad?.manzana || 'Manzana'} - {venta.unidad?.codigo || 'Lote'}
                            </>
                          ) : (
                            <>
                              {venta.unidad?.pabellon || 'Pabellón'} - {venta.unidad?.codigo || 'Unidad'}
                            </>
                          )}
                      </div>
                      {venta.tipoVenta === 'LOTE' && venta.unidad?.manzanaCodigo && (
                        <div className="text-sm text-blue-600">
                          Código de Manzana: {venta.unidad.manzanaCodigo}
                        </div>
                      )}
                      {venta.tipoVenta === 'UNIDAD_CEMENTERIO' && venta.unidad?.pabellonCodigo && (
                        <div className="text-sm text-blue-600">
                          Código de Pabellón: {venta.unidad.pabellonCodigo}
                      </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                    {/* Información financiera */}
                <Card className="border-2 border-green-100 bg-green-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Información Financiera</h4>
                        <p className="text-sm text-gray-600">Detalles del pago</p>
                      </div>
                    </div>
                    <div className="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Precio de venta:</span>
                        <span className="text-xl font-bold text-green-800">
                              {formatCurrency(venta.precioVenta)}
                            </span>
                          </div>
                          {venta.precioOriginal && venta.precioOriginal !== venta.precioVenta && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Precio original:</span>
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(venta.precioOriginal)}
                              </span>
                            </div>
                          )}
                          {venta.montoDescuento && venta.montoDescuento > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Descuento aplicado:</span>
                          <span className="text-sm font-medium text-red-600">
                                -{formatCurrency(venta.montoDescuento)}
                              </span>
                            </div>
                          )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-gray-600">Método de pago:</span>
                        <Badge variant={venta.tipoVentaVenta === 'CUOTAS' ? 'default' : 'secondary'} className="font-medium">
                              {venta.tipoVentaVenta === 'CUOTAS' ? 'Cuotas' : 'Contado'}
                            </Badge>
                          </div>
                          {venta.tipoVentaVenta === 'CUOTAS' && venta.numeroCuotas && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Número de cuotas:</span>
                          <span className="font-medium text-gray-900">{venta.numeroCuotas}</span>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
              </div>

              {/* Información del cliente y vendedor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cliente */}
                <Card className="border-2 border-purple-100 bg-purple-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Cliente</h4>
                        <p className="text-sm text-gray-600">Información del comprador</p>
                      </div>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="text-lg font-semibold text-purple-800">
                            {venta.cliente.nombre} {venta.cliente.apellido || ''}
                          </div>
                          {venta.cliente.email && (
                          <div className="text-sm text-purple-600 flex items-center gap-1">
                            <span className="font-medium">Email:</span> {venta.cliente.email}
                          </div>
                          )}
                          {venta.cliente.telefono && (
                          <div className="text-sm text-purple-600 flex items-center gap-1">
                            <span className="font-medium">Teléfono:</span> {venta.cliente.telefono}
                          </div>
                          )}
                        <div className="flex gap-4 pt-2">
                          {venta.cliente.dni && (
                            <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              DNI: {venta.cliente.dni}
                            </div>
                          )}
                          {venta.cliente.ruc && (
                            <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              RUC: {venta.cliente.ruc}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                    {/* Vendedor */}
                <Card className="border-2 border-orange-100 bg-orange-50/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                        <User className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Vendedor</h4>
                        <p className="text-sm text-gray-600">Responsable de la venta</p>
                      </div>
                    </div>
                    <div className="bg-white border border-orange-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="text-lg font-semibold text-orange-800">
                            {venta.vendedor.nombre}
                          </div>
                        <div className="text-sm text-orange-600">
                          {venta.vendedor.email}
                        </div>
                          {venta.comisionVendedor && (
                          <div className="pt-2 border-t border-orange-100">
                            <div className="text-sm text-orange-700">
                              <span className="font-medium">Comisión:</span> {formatCurrency(venta.comisionVendedor)}
                              {venta.porcentajeComision && (
                                <span className="text-xs ml-1">({venta.porcentajeComision}%)</span>
                              )}
                            </div>
                            </div>
                          )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fecha y detalles */}
                <Card className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        <Calendar className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Información Temporal</h4>
                        <p className="text-sm text-gray-600">Fechas y detalles</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Fecha de venta:</span>
                        <span className="font-medium text-gray-900">{formatDate(venta.fechaVenta)}</span>
                      </div>
                      {venta.fechaEntrega && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Fecha de entrega:</span>
                          <span className="font-medium text-gray-900">{formatDate(venta.fechaEntrega)}</span>
                        </div>
                      )}
                      {venta.estadoDocumentacion && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Estado documentación:</span>
                          <Badge variant="outline" className="text-xs">
                            {venta.estadoDocumentacion}
                          </Badge>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>

                {/* Observaciones y condiciones */}
                <Card className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Observaciones</h4>
                        <p className="text-sm text-gray-600">Información adicional</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {venta.observaciones && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 block mb-1">Observaciones:</span>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                            {venta.observaciones}
                          </p>
                        </div>
                      )}
                      {venta.condicionesEspeciales && (
                        <div>
                          <span className="text-sm font-medium text-gray-600 block mb-1">Condiciones especiales:</span>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                            {venta.condicionesEspeciales}
                          </p>
                        </div>
                      )}
                      {!venta.observaciones && !venta.condicionesEspeciales && (
                        <p className="text-sm text-gray-500 italic">Sin observaciones adicionales</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advertencia final */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      Acción irreversible
                    </h3>
                    <p className="text-yellow-700 leading-relaxed">
                      Una vez confirmada la acción, el estado de la venta y la unidad cambiarán permanentemente. 
                      Esta acción no se puede revertir fácilmente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            disabled={isLoading}
            className="px-6 py-2"
            onClick={handleClose}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || !selectedAction}
            className={`px-6 py-2 font-medium ${
              selectedAction === 'APROBAR'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : selectedAction === 'DESAPROBAR'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Procesando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {selectedAction === 'APROBAR' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmar Aprobación</span>
                  </>
                ) : selectedAction === 'DESAPROBAR' ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Confirmar Desaprobación</span>
              </>
            ) : (
              <>
                    <Shield className="h-4 w-4" />
                    <span>Selecciona una acción</span>
              </>
                )}
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 