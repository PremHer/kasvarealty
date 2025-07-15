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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, AlertTriangle, User, DollarSign, Calendar, MapPin, Home, Shield } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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

interface DeleteVentaAlertProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  venta: Venta | null
  isLoading?: boolean
}

export function DeleteVentaAlert({
  isOpen,
  onClose,
  onConfirm,
  venta,
  isLoading = false
}: DeleteVentaAlertProps) {
  const [password, setPassword] = useState('')
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
    setIsPasswordValid(value.length >= 6) // Mínimo 6 caracteres
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
      } else {
        setIsPasswordValid(false)
      }
    } catch (error) {
      setIsPasswordValid(false)
    } finally {
      setIsValidating(false)
    }
  }

  const handleConfirm = () => {
    if (isPasswordValid) {
      onConfirm()
      setPassword('')
      setIsPasswordValid(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setIsPasswordValid(false)
    onClose()
  }

  if (!venta) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            Confirmar Eliminación de Venta
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-6 pt-4">
              {/* Banner de advertencia */}
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      Acción irreversible
                    </h3>
                    <p className="text-red-700 leading-relaxed">
                      Esta acción eliminará permanentemente la venta y todos sus datos asociados. 
                      Esta operación no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de la venta */}
              <Card className="border-2 border-red-100 bg-red-50/30">
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
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estado:</span>
                            <span className={`font-medium ${
                              venta.estado === 'PENDIENTE' ? 'text-yellow-600' :
                              venta.estado === 'APROBADA' ? 'text-green-600' :
                              venta.estado === 'DESAPROBADA' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {venta.estado}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tipo de venta:</span>
                            <span className="font-medium text-gray-700">
                              {venta.tipoVentaVenta === 'CUOTAS' ? 'Cuotas' : 'Contado'}
                            </span>
                          </div>
                          {venta.tipoVentaVenta === 'CUOTAS' && venta.numeroCuotas && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Número de cuotas:</span>
                              <span className="font-medium text-gray-700">{venta.numeroCuotas}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validación de contraseña */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Confirmación de seguridad</h4>
                    <p className="text-sm text-gray-600">Ingresa tu contraseña para confirmar la eliminación</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Contraseña
                    </Label>
                    <div className="flex gap-2 mt-1">
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
              </div>

              {/* Advertencia final */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-800 mb-2">
                      Eliminación permanente
                    </h3>
                    <p className="text-orange-700 leading-relaxed">
                      Al confirmar, esta venta será eliminada permanentemente de la base de datos. 
                      Todos los datos asociados (cuotas, documentos, etc.) también serán eliminados.
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
            disabled={isLoading || !isPasswordValid}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 font-medium"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Eliminando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Confirmar Eliminación</span>
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 