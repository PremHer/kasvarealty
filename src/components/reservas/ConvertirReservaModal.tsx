'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { FiLoader } from 'react-icons/fi'
import type { ReservaWithRelations } from '@/types/reserva'

interface ConvertirReservaModalProps {
  isOpen: boolean
  onClose: () => void
  reserva: ReservaWithRelations | null
  onSuccess: () => void
}

export default function ConvertirReservaModal({ isOpen, onClose, reserva, onSuccess }: ConvertirReservaModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    precioVenta: 0,
    tipoVenta: 'CONTADO',
    numeroCuotas: 1,
    montoCuota: 0,
    frecuenciaCuota: 'MENSUAL',
    formaPago: 'EFECTIVO',
    montoInicial: 0,
    observaciones: '',
  })

  // Mutation para convertir reserva a venta
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!reserva) throw new Error('No hay reserva seleccionada')
      
      const response = await fetch(`/api/reservas/${reserva.id}/convertir-venta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al convertir la reserva')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] })
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      onSuccess()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (reserva && isOpen) {
      const precioBase = reserva.lote?.precio || reserva.unidadCementerio?.precio || 0
      setFormData({
        precioVenta: precioBase,
        tipoVenta: 'CONTADO',
        numeroCuotas: 1,
        montoCuota: precioBase,
        frecuenciaCuota: 'MENSUAL',
        formaPago: 'EFECTIVO',
        montoInicial: 0,
        observaciones: '',
      })
    }
  }, [reserva, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleClose = () => {
    setFormData({
      precioVenta: 0,
      tipoVenta: 'CONTADO',
      numeroCuotas: 1,
      montoCuota: 0,
      frecuenciaCuota: 'MENSUAL',
      formaPago: 'EFECTIVO',
      montoInicial: 0,
      observaciones: '',
    })
    onClose()
  }

  const handleTipoVentaChange = (value: string) => {
    setFormData({
      ...formData,
      tipoVenta: value,
      numeroCuotas: value === 'CUOTAS' ? 12 : 1,
      montoCuota: value === 'CUOTAS' ? formData.precioVenta / 12 : formData.precioVenta,
    })
  }

  const handlePrecioVentaChange = (value: number) => {
    setFormData({
      ...formData,
      precioVenta: value,
      montoCuota: formData.tipoVenta === 'CUOTAS' ? value / formData.numeroCuotas : value,
    })
  }

  const handleNumeroCuotasChange = (value: number) => {
    setFormData({
      ...formData,
      numeroCuotas: value,
      montoCuota: formData.precioVenta / value,
    })
  }

  if (!reserva) return null

  const clienteNombre = reserva.cliente.razonSocial || 
    `${reserva.cliente.nombre} ${reserva.cliente.apellido || ''}`.trim()
  const unidadInfo = reserva.lote 
    ? `Lote ${reserva.lote.numero} (${reserva.lote.area}m²)`
    : reserva.unidadCementerio 
    ? `${reserva.unidadCementerio.tipoUnidad} ${reserva.unidadCementerio.codigo}`
    : 'N/A'

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convertir Reserva a Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información de la reserva */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Información de la Reserva</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Número:</span> {reserva.numeroReserva}
              </div>
              <div>
                <span className="font-medium">Cliente:</span> {clienteNombre}
              </div>
              <div>
                <span className="font-medium">Proyecto:</span> {reserva.proyecto.nombre}
              </div>
              <div>
                <span className="font-medium">Unidad:</span> {unidadInfo}
              </div>
              <div>
                <span className="font-medium">Vendedor:</span> {reserva.vendedor.nombre}
              </div>
              <div>
                <span className="font-medium">Monto Reserva:</span> S/ {reserva.montoReserva.toFixed(2)}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="precioVenta">Precio de Venta *</Label>
                <Input
                  id="precioVenta"
                  type="number"
                  step="0.01"
                  value={formData.precioVenta}
                  onChange={(e) => handlePrecioVentaChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="tipoVenta">Tipo de Venta *</Label>
                <Select
                  value={formData.tipoVenta}
                  onValueChange={handleTipoVentaChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTADO">Contado</SelectItem>
                    <SelectItem value="CUOTAS">A Cuotas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tipoVenta === 'CUOTAS' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroCuotas">Número de Cuotas</Label>
                  <Input
                    id="numeroCuotas"
                    type="number"
                    min="1"
                    value={formData.numeroCuotas}
                    onChange={(e) => handleNumeroCuotasChange(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <Label htmlFor="montoCuota">Monto por Cuota</Label>
                  <Input
                    id="montoCuota"
                    type="number"
                    step="0.01"
                    value={formData.montoCuota.toFixed(2)}
                    readOnly
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frecuenciaCuota">Frecuencia de Cuota</Label>
                <Select
                  value={formData.frecuenciaCuota}
                  onValueChange={(value) => setFormData({ ...formData, frecuenciaCuota: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENSUAL">Mensual</SelectItem>
                    <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                    <SelectItem value="SEMANAL">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="formaPago">Forma de Pago</Label>
                <Select
                  value={formData.formaPago}
                  onValueChange={(value) => setFormData({ ...formData, formaPago: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="TARJETA">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="montoInicial">Monto Inicial</Label>
              <Input
                id="montoInicial"
                type="number"
                step="0.01"
                value={formData.montoInicial}
                onChange={(e) => setFormData({ ...formData, montoInicial: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <FiLoader className="mr-2 h-4 w-4 animate-spin" />}
                Convertir a Venta
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 