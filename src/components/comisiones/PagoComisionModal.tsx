'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { FiDollarSign, FiUser, FiHome, FiCalendar, FiPercent, FiUpload, FiX, FiCheck } from 'react-icons/fi'
import { VentaConComision, PagoComisionFormData } from '@/types/comision'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PagoComisionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  venta: VentaConComision
}

export default function PagoComisionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  venta 
}: PagoComisionModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PagoComisionFormData>({
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0],
    formaPago: '',
    observaciones: '',
    comprobantes: []
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      toast({
        title: 'Error',
        description: 'El monto debe ser mayor a 0',
        variant: 'destructive'
      })
      return
    }

    if (!formData.fechaPago) {
      toast({
        title: 'Error',
        description: 'La fecha de pago es requerida',
        variant: 'destructive'
      })
      return
    }

    if (!formData.formaPago) {
      toast({
        title: 'Error',
        description: 'Debe seleccionar una forma de pago',
        variant: 'destructive'
      })
      return
    }

    const montoPago = parseFloat(formData.monto)
    if (montoPago > venta.montoPendiente) {
      toast({
        title: 'Error',
        description: `El monto excede el pendiente. Máximo permitido: ${formatCurrency(venta.montoPendiente)}`,
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('monto', formData.monto)
      formDataToSend.append('fechaPago', formData.fechaPago)
      formDataToSend.append('formaPago', formData.formaPago)
      formDataToSend.append('observaciones', formData.observaciones || '')
      
      // Agregar ID de la venta
      if (venta.tipoVenta === 'LOTE') {
        formDataToSend.append('ventaLoteId', venta.id)
      } else {
        formDataToSend.append('ventaUnidadCementerioId', venta.id)
      }

      // Agregar comprobantes si existen
      formData.comprobantes.forEach((comprobante, index) => {
        formDataToSend.append(`comprobante_${index}`, comprobante.archivo)
        formDataToSend.append(`comprobante_${index}_data`, JSON.stringify(comprobante.datos))
      })

      const response = await fetch('/api/comisiones/pagos', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        toast({
          title: 'Pago registrado',
          description: 'El pago de comisión se registró correctamente',
          variant: 'default'
        })
        onSuccess()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar el pago')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al registrar el pago',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    files.forEach((file, index) => {
      const comprobante = {
        archivo: file,
        datos: {
          tipo: 'COMPROBANTE_COMISION',
          monto: parseFloat(formData.monto) || 0,
          fecha: formData.fechaPago,
          descripcion: `Comprobante de pago de comisión - ${file.name}`
        }
      }
      
      setFormData(prev => ({
        ...prev,
        comprobantes: [...prev.comprobantes, comprobante]
      }))
    })
  }

  const removeComprobante = (index: number) => {
    setFormData(prev => ({
      ...prev,
      comprobantes: prev.comprobantes.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiDollarSign className="h-5 w-5 text-green-600" />
            Registrar Pago de Comisión
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de la venta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <FiUser className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{venta.vendedor.nombre}</p>
                    <p className="text-sm text-gray-600">{venta.vendedor.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <FiHome className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{venta.unidad.codigo}</p>
                    <p className="text-sm text-gray-600">
                      {venta.tipoVenta === 'LOTE' ? 'Lote' : 'Unidad Cementerio'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiDollarSign className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Comisión Total</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(venta.comisionVendedor)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FiPercent className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Pendiente</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(venta.montoPendiente)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulario de pago */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto a Pagar *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.monto}
                      onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                      placeholder="0.00"
                      max={venta.montoPendiente}
                    />
                    <p className="text-xs text-gray-500">
                      Máximo: {formatCurrency(venta.montoPendiente)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaPago">Fecha de Pago *</Label>
                    <Input
                      type="date"
                      value={formData.fechaPago}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaPago: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="formaPago">Forma de Pago *</Label>
                    <Select
                      value={formData.formaPago}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, formaPago: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar forma de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                        <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                        <SelectItem value="DEPOSITO">Depósito</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="YAPE">Yape</SelectItem>
                        <SelectItem value="PLIN">Plin</SelectItem>
                        <SelectItem value="OTRO">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Observaciones adicionales sobre el pago..."
                    rows={3}
                  />
                </div>

                {/* Comprobantes */}
                <div className="space-y-2">
                  <Label>Comprobantes de Pago</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <FiUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Arrastra archivos aquí o haz clic para seleccionar
                      </p>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Seleccionar Archivos
                      </Button>
                    </div>
                  </div>

                  {/* Lista de comprobantes */}
                  {formData.comprobantes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Archivos seleccionados:</p>
                      {formData.comprobantes.map((comprobante, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{comprobante.archivo.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeComprobante(index)}
                          >
                            <FiX className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Registrando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FiCheck className="h-4 w-4" />
                        <span>Registrar Pago</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 