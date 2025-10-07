'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FiEdit2, FiDollarSign, FiCalendar, FiPercent, FiSave, FiX, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'

interface Cuota {
  id: string
  numeroCuota: number
  monto: number
  fechaVencimiento: string
  estado: string
  montoPagado: number
  montoCapital?: number
  montoInteres?: number
}

interface Venta {
  id: string
  tipoVenta: string
  modeloAmortizacion?: string
  tasaInteres?: number
  frecuenciaCuota?: string
  cuotas: Cuota[]
}

interface ReprogramarCuotasModalProps {
  isOpen: boolean
  onClose: () => void
  venta: Venta | null
  onReprogramacionSuccess: () => void
}

interface CuotaModificada {
  numeroCuota: number
  monto: number
  fechaVencimiento: string
}

interface DescuentoAplicado {
  numeroCuota: number
  montoDescuento: number
  motivo: string
}

interface CambiosPlan {
  modeloAmortizacion?: string
  tasaInteres?: number
  frecuenciaCuota?: string
}

export default function ReprogramarCuotasModal({
  isOpen,
  onClose,
  venta,
  onReprogramacionSuccess
}: ReprogramarCuotasModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [motivoReprogramacion, setMotivoReprogramacion] = useState('')
  
  // Estados para cuotas modificadas
  const [cuotasModificadas, setCuotasModificadas] = useState<CuotaModificada[]>([])
  const [descuentosAplicados, setDescuentosAplicados] = useState<DescuentoAplicado[]>([])
  
  // Estados para cambios de plan
  const [aplicarCambiosPlan, setAplicarCambiosPlan] = useState(false)
  const [cambiosPlan, setCambiosPlan] = useState<CambiosPlan>({
    modeloAmortizacion: venta?.modeloAmortizacion || 'FRANCES',
    tasaInteres: venta?.tasaInteres || 0,
    frecuenciaCuota: venta?.frecuenciaCuota || 'MENSUAL'
  })

  // Estados para validaciones
  const [errores, setErrores] = useState<string[]>([])

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && venta) {
      setCambiosPlan({
        modeloAmortizacion: venta.modeloAmortizacion || 'FRANCES',
        tasaInteres: venta.tasaInteres || 0,
        frecuenciaCuota: venta.frecuenciaCuota || 'MENSUAL'
      })
      setCuotasModificadas([])
      setDescuentosAplicados([])
      setMotivoReprogramacion('')
      setErrores([])
    }
  }, [isOpen, venta])

  // Obtener cuotas que se pueden modificar (no pagadas completamente)
  const cuotasModificables = venta?.cuotas.filter(cuota => 
    cuota.estado !== 'PAGADA' && cuota.montoPagado < cuota.monto
  ) || []

  // Función para modificar una cuota
  const modificarCuota = (numeroCuota: number, campo: 'monto' | 'fechaVencimiento', valor: string | number) => {
    setCuotasModificadas(prev => {
      const existente = prev.find(c => c.numeroCuota === numeroCuota)
      if (existente) {
        return prev.map(c => 
          c.numeroCuota === numeroCuota 
            ? { ...c, [campo]: valor }
            : c
        )
      } else {
        const cuotaOriginal = venta?.cuotas.find(c => c.numeroCuota === numeroCuota)
        return [...prev, {
          numeroCuota,
          monto: campo === 'monto' ? Number(valor) : cuotaOriginal?.monto || 0,
          fechaVencimiento: campo === 'fechaVencimiento' ? String(valor) : cuotaOriginal?.fechaVencimiento || ''
        }]
      }
    })
  }

  // Función para aplicar descuento
  const aplicarDescuento = (numeroCuota: number, montoDescuento: number, motivo: string) => {
    setDescuentosAplicados(prev => {
      const existente = prev.find(d => d.numeroCuota === numeroCuota)
      if (existente) {
        return prev.map(d => 
          d.numeroCuota === numeroCuota 
            ? { ...d, montoDescuento, motivo }
            : d
        )
      } else {
        return [...prev, { numeroCuota, montoDescuento, motivo }]
      }
    })
  }

  // Función para remover descuento
  const removerDescuento = (numeroCuota: number) => {
    setDescuentosAplicados(prev => prev.filter(d => d.numeroCuota !== numeroCuota))
  }

  // Función para obtener el monto actual de una cuota (considerando modificaciones y descuentos)
  const getMontoActual = (cuota: Cuota) => {
    const modificacion = cuotasModificadas.find(m => m.numeroCuota === cuota.numeroCuota)
    const descuento = descuentosAplicados.find(d => d.numeroCuota === cuota.numeroCuota)
    
    let montoBase = modificacion?.monto || cuota.monto
    const descuentoAplicado = descuento?.montoDescuento || 0
    
    return Math.max(0, montoBase - descuentoAplicado)
  }

  // Función para validar datos antes de enviar
  const validarDatos = (): boolean => {
    const nuevosErrores: string[] = []

    if (!motivoReprogramacion.trim()) {
      nuevosErrores.push('Debe especificar un motivo para la reprogramación')
    }

    // Validar que no haya fechas en el pasado
    const fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0)

    cuotasModificadas.forEach(mod => {
      const fechaCuota = new Date(mod.fechaVencimiento)
      fechaCuota.setHours(0, 0, 0, 0)
      
      if (fechaCuota < fechaActual) {
        nuevosErrores.push(`La cuota ${mod.numeroCuota} no puede tener fecha en el pasado`)
      }
    })

    // Validar que los montos no sean negativos
    cuotasModificadas.forEach(mod => {
      if (mod.monto < 0) {
        nuevosErrores.push(`La cuota ${mod.numeroCuota} no puede tener monto negativo`)
      }
    })

    // Validar descuentos
    descuentosAplicados.forEach(desc => {
      const cuota = venta?.cuotas.find(c => c.numeroCuota === desc.numeroCuota)
      if (cuota && desc.montoDescuento > cuota.monto) {
        nuevosErrores.push(`El descuento de la cuota ${desc.numeroCuota} no puede ser mayor al monto original`)
      }
    })

    setErrores(nuevosErrores)
    return nuevosErrores.length === 0
  }

  // Función para enviar reprogramación
  const handleSubmit = async () => {
    if (!validarDatos()) {
      toast({
        title: 'Error de validación',
        description: 'Por favor corrija los errores antes de continuar',
        variant: 'destructive'
      })
      return
    }

    if (!venta) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/ventas/${venta.id}/reprogramar-cuotas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cuotasModificadas,
          descuentosAplicados,
          cambiosPlan: aplicarCambiosPlan ? cambiosPlan : undefined,
          motivoReprogramacion
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al reprogramar cuotas')
      }

      const result = await response.json()
      
      toast({
        title: '✅ Reprogramación exitosa',
        description: 'Las cuotas han sido reprogramadas correctamente'
      })

      onReprogramacionSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error al reprogramar cuotas:', error)
      toast({
        title: '❌ Error',
        description: error.message || 'Error al reprogramar las cuotas',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!venta) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiEdit2 className="h-5 w-5" />
            Reprogramar Cuotas - Venta #{venta.id.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            Modifica cuotas, aplica descuentos o cambia el plan de amortización para esta venta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Motivo de reprogramación */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la Reprogramación *</Label>
            <Textarea
              id="motivo"
              value={motivoReprogramacion}
              onChange={(e) => setMotivoReprogramacion(e.target.value)}
              placeholder="Especifique el motivo de la reprogramación..."
              className="min-h-[80px]"
            />
          </div>

          {/* Errores de validación */}
          {errores.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <FiAlertTriangle className="h-4 w-4" />
                  Errores de Validación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-red-600">
                  {errores.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Cambios de Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiPercent className="h-4 w-4" />
                Cambios de Plan de Amortización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="aplicar-cambios"
                  checked={aplicarCambiosPlan}
                  onCheckedChange={setAplicarCambiosPlan}
                />
                <Label htmlFor="aplicar-cambios">Aplicar cambios al plan de amortización</Label>
              </div>

              {aplicarCambiosPlan && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Modelo de Amortización</Label>
                    <Select
                      value={cambiosPlan.modeloAmortizacion}
                      onValueChange={(value) => setCambiosPlan(prev => ({ ...prev, modeloAmortizacion: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRANCES">Francés</SelectItem>
                        <SelectItem value="ALEMAN">Alemán</SelectItem>
                        <SelectItem value="JAPONES">Japonés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tasa de Interés Anual (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={cambiosPlan.tasaInteres}
                      onChange={(e) => setCambiosPlan(prev => ({ 
                        ...prev, 
                        tasaInteres: parseFloat(e.target.value) || 0 
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frecuencia de Cuotas</Label>
                    <Select
                      value={cambiosPlan.frecuenciaCuota}
                      onValueChange={(value) => setCambiosPlan(prev => ({ ...prev, frecuenciaCuota: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MENSUAL">Mensual</SelectItem>
                        <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
                        <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                        <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                        <SelectItem value="ANUAL">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Cuotas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiDollarSign className="h-4 w-4" />
                Cuotas Modificables ({cuotasModificables.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cuotasModificables.map((cuota) => {
                  const modificacion = cuotasModificadas.find(m => m.numeroCuota === cuota.numeroCuota)
                  const descuento = descuentosAplicados.find(d => d.numeroCuota === cuota.numeroCuota)
                  const montoActual = getMontoActual(cuota)
                  const saldoPendiente = cuota.monto - cuota.montoPagado

                  return (
                    <div key={cuota.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Cuota {cuota.numeroCuota}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={cuota.estado === 'PAGADA' ? 'default' : 'secondary'}>
                            {cuota.estado}
                          </Badge>
                          {modificacion && <Badge variant="outline">Modificada</Badge>}
                          {descuento && <Badge variant="outline" className="text-green-600">Con Descuento</Badge>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Monto */}
                        <div className="space-y-2">
                          <Label>Monto</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={modificacion?.monto || cuota.monto}
                              onChange={(e) => modificarCuota(cuota.numeroCuota, 'monto', e.target.value)}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-500">S/</span>
                          </div>
                          {cuota.montoPagado > 0 && (
                            <p className="text-xs text-gray-500">
                              Pagado: S/ {cuota.montoPagado.toFixed(2)} | 
                              Pendiente: S/ {saldoPendiente.toFixed(2)}
                            </p>
                          )}
                        </div>

                        {/* Fecha de Vencimiento */}
                        <div className="space-y-2">
                          <Label>Fecha de Vencimiento</Label>
                          <Input
                            type="date"
                            value={modificacion?.fechaVencimiento || cuota.fechaVencimiento.split('T')[0]}
                            onChange={(e) => modificarCuota(cuota.numeroCuota, 'fechaVencimiento', e.target.value)}
                          />
                        </div>

                        {/* Descuento */}
                        <div className="space-y-2">
                          <Label>Descuento</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={descuento?.montoDescuento || ''}
                              onChange={(e) => {
                                const monto = parseFloat(e.target.value) || 0
                                if (monto > 0) {
                                  aplicarDescuento(cuota.numeroCuota, monto, descuento?.motivo || 'Descuento aplicado')
                                } else {
                                  removerDescuento(cuota.numeroCuota)
                                }
                              }}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-500">S/</span>
                          </div>
                          {descuento && (
                            <Input
                              placeholder="Motivo del descuento"
                              value={descuento.motivo}
                              onChange={(e) => aplicarDescuento(cuota.numeroCuota, descuento.montoDescuento, e.target.value)}
                              className="text-xs"
                            />
                          )}
                        </div>
                      </div>

                      {/* Resumen */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Monto Original:</span>
                          <span>S/ {cuota.monto.toFixed(2)}</span>
                        </div>
                        {modificacion && modificacion.monto !== cuota.monto && (
                          <div className="flex justify-between text-sm">
                            <span>Monto Modificado:</span>
                            <span>S/ {modificacion.monto.toFixed(2)}</span>
                          </div>
                        )}
                        {descuento && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Descuento Aplicado:</span>
                            <span>-S/ {descuento.montoDescuento.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1">
                          <span>Monto Final:</span>
                          <span>S/ {montoActual.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {cuotasModificables.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FiCheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>No hay cuotas modificables</p>
                  <p className="text-sm">Todas las cuotas están pagadas o no se pueden modificar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <FiX className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || cuotasModificables.length === 0}>
            <FiSave className="h-4 w-4 mr-2" />
            {isLoading ? 'Reprogramando...' : 'Reprogramar Cuotas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
