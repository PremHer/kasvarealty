'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Shield, 
  AlertTriangle, 
  User, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Home, 
  Lock,
  FileText,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'

interface Venta {
  id: string
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
  estado: string
  precioVenta: number
  fechaVenta: string
  tipoVentaVenta: 'CONTADO' | 'CUOTAS'
  numeroCuotas?: number
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

interface ForceDeleteVentaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  venta: Venta | null
}

export function ForceDeleteVentaModal({
  isOpen,
  onClose,
  onSuccess,
  venta
}: ForceDeleteVentaModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [codigoTemporal, setCodigoTemporal] = useState('')
  const [justificacion, setJustificacion] = useState('')
  const [documentacion, setDocumentacion] = useState('')
  const [confirmarImpactoFinanciero, setConfirmarImpactoFinanciero] = useState(false)
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

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

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setIsPasswordValid(false) // Reset validation
  }

  const handleValidatePassword = async () => {
    if (!password) return

    setIsValidating(true)
    try {
      const response = await fetch('/api/auth/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        setIsPasswordValid(true)
        toast({
          title: 'Contraseña válida',
          description: 'Contraseña verificada correctamente',
          variant: 'default'
        })
      } else {
        setIsPasswordValid(false)
        toast({
          title: 'Contraseña incorrecta',
          description: 'Verifica tu contraseña e intenta nuevamente',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error validando contraseña:', error)
      setIsPasswordValid(false)
      toast({
        title: 'Error',
        description: 'Error al validar la contraseña',
        variant: 'destructive'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleForceDelete = async () => {
    if (!venta || !isPasswordValid || !codigoTemporal || !justificacion || !confirmarImpactoFinanciero) {
      toast({
        title: 'Campos incompletos',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive'
      })
      return
    }

    if (justificacion.length < 50) {
      toast({
        title: 'Justificación insuficiente',
        description: 'La justificación debe tener al menos 50 caracteres',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ventas/${venta.id}/force-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password,
          codigoTemporal,
          justificacion,
          documentacion,
          confirmarImpactoFinanciero
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Mostrar mensaje con información del producto liberado
        const mensaje = data.productoLiberado 
          ? `${data.message}. ${data.productoLiberado.tipo === 'LOTE' ? 'Lote' : 'Unidad'} ${data.productoLiberado.codigo} (${data.productoLiberado.ubicacion}) ha sido liberado y está disponible para nuevas ventas.`
          : data.message

        toast({
          title: 'Venta eliminada forzadamente',
          description: mensaje,
          variant: 'default'
        })
        onSuccess()
        onClose()
        resetForm()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la venta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar la venta',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setPassword('')
    setCodigoTemporal('')
    setJustificacion('')
    setDocumentacion('')
    setConfirmarImpactoFinanciero(false)
    setIsPasswordValid(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!venta) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-purple-900">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            Eliminación Forzada de Venta
          </DialogTitle>
          <DialogDescription className="text-purple-700">
            Esta operación eliminará permanentemente la venta y todos sus datos asociados, incluyendo pagos registrados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Banner de advertencia crítica */}
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    ⚠️ ELIMINACIÓN FORZADA - OPERACIÓN CRÍTICA
                  </h3>
                  <p className="text-red-700 leading-relaxed">
                    <strong>Esta venta tiene pagos registrados y será eliminada completamente.</strong>
                    <br /><br />
                    <strong>Impacto inmediato:</strong><br />
                    • Pérdida total de historial financiero<br />
                    • Eliminación de todos los comprobantes de pago<br />
                    • Imposibilidad de reembolsos legales<br />
                    • Problemas potenciales con auditorías fiscales<br />
                    <br />
                    <strong>Esta operación NO se puede deshacer.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Información de la venta */}
            <Card className="border-2 border-purple-100 bg-purple-50/30">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información básica */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <IconComponent className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{getTipoUnidadLabel()}</h4>
                        <p className="text-sm text-gray-600">
                          {venta.tipoVenta === 'LOTE' ? (
                            <>
                              {venta.unidad?.manzana || 'Manzana'} - {venta.unidad?.codigo || 'Lote'}
                            </>
                          ) : (
                            <>
                              {venta.unidad?.pabellon || 'Pabellón'} - {venta.unidad?.codigo || 'Unidad'}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-gray-900">Cliente:</span>
                        <span className="text-gray-700">
                          {venta.cliente.nombre} {venta.cliente.apellido || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-gray-900">Precio:</span>
                        <span className="text-gray-700 font-semibold">
                          {formatCurrency(venta.precioVenta)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Fecha:</span>
                        <span className="text-gray-700">{formatDate(venta.fechaVenta)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estado y detalles */}
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-gray-900">Estado:</span>
                          <span className="text-red-600 font-semibold">CON PAGOS REGISTRADOS</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900">Tipo:</span>
                          <span className="text-gray-700">{venta.tipoVentaVenta}</span>
                        </div>
                        {venta.numeroCuotas && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-gray-900">Cuotas:</span>
                            <span className="text-gray-700">{venta.numeroCuotas}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de eliminación forzada */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Autenticación y Justificación
              </h3>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña de tu cuenta *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className={`flex-1 ${
                      password.length > 0 && !isPasswordValid 
                        ? 'border-red-300 focus:border-red-500' 
                        : isPasswordValid 
                        ? 'border-green-300 focus:border-green-500' 
                        : ''
                    }`}
                  />
                  <Button
                    onClick={handleValidatePassword}
                    disabled={password.length < 6 || isValidating}
                    variant="outline"
                    size="sm"
                    className="px-4"
                  >
                    {isValidating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                    ) : (
                      'Validar'
                    )}
                  </Button>
                </div>
                {password.length > 0 && (
                  <div className={`text-sm ${
                    isPasswordValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPasswordValid ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Contraseña válida
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        Contraseña incorrecta
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Código temporal */}
              <div className="space-y-2">
                <Label htmlFor="codigoTemporal" className="text-sm font-medium text-gray-700">
                  Código temporal de seguridad *
                </Label>
                <Input
                  id="codigoTemporal"
                  type="text"
                  value={codigoTemporal}
                  onChange={(e) => setCodigoTemporal(e.target.value)}
                  placeholder="Ingresa el código temporal (para desarrollo: cualquier código)"
                  className="flex-1"
                />
                <p className="text-xs text-gray-500">
                  En producción, este código se enviará por SMS o email
                </p>
              </div>

              {/* Justificación */}
              <div className="space-y-2">
                <Label htmlFor="justificacion" className="text-sm font-medium text-gray-700">
                  Justificación detallada (mínimo 50 caracteres) *
                </Label>
                <Textarea
                  id="justificacion"
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Describe detalladamente por qué necesitas eliminar esta venta con pagos registrados..."
                  rows={4}
                  className="flex-1"
                />
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    {justificacion.length}/50 caracteres mínimos
                  </span>
                  <span className={justificacion.length >= 50 ? 'text-green-600' : 'text-red-600'}>
                    {justificacion.length >= 50 ? '✓ Suficiente' : '✗ Insuficiente'}
                  </span>
                </div>
              </div>

              {/* Documentación */}
              <div className="space-y-2">
                <Label htmlFor="documentacion" className="text-sm font-medium text-gray-700">
                  Documentación de respaldo (opcional)
                </Label>
                <Textarea
                  id="documentacion"
                  value={documentacion}
                  onChange={(e) => setDocumentacion(e.target.value)}
                  placeholder="Referencias a documentos, órdenes judiciales, reportes de auditoría, etc."
                  rows={3}
                  className="flex-1"
                />
              </div>

              {/* Confirmación de impacto financiero */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="confirmarImpactoFinanciero"
                    checked={confirmarImpactoFinanciero}
                    onChange={(e) => setConfirmarImpactoFinanciero(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="confirmarImpactoFinanciero" className="text-sm font-medium text-gray-700">
                      Confirmo que entiendo el impacto financiero y legal *
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Entiendo que esta operación eliminará todos los registros financieros y puede causar problemas legales y fiscales.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-none pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleForceDelete}
            disabled={
              isLoading || 
              !isPasswordValid || 
              !codigoTemporal || 
              justificacion.length < 50 || 
              !confirmarImpactoFinanciero
            }
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 font-medium"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Eliminando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Eliminación Forzada</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 