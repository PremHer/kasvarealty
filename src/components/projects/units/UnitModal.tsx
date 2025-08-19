'use client'

import { useState } from 'react'
import { UnidadInmobiliaria, EstadoUnidad } from '@prisma/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

interface UnitModalProps {
  projectId: string
  unit?: UnidadInmobiliaria
  onClose: () => void
  onSave: (unit: Partial<UnidadInmobiliaria>) => Promise<void>
}

const unitTypes = [
  'CASA_INDIVIDUAL',
  'DEPARTAMENTO',
  'DUPLEX',
  'PENTHOUSE',
  'TOWNHOUSE',
  'LOCAL_COMERCIAL',
  'OFICINA',
  'BODEGA',
  'TERRENO'
]

const unitStatuses: EstadoUnidad[] = [
  'DISPONIBLE',
  'RESERVADO',
  'VENDIDO',
  'ENTREGADO'
]

export default function UnitModal({ projectId, unit, onClose, onSave }: UnitModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<UnidadInmobiliaria>>({
    codigo: unit?.codigo || '',
    tipo: unit?.tipo || unitTypes[0],
    estado: unit?.estado || 'DISPONIBLE',
    precio: unit?.precio || 0,
    area: unit?.area || 0,
    proyectoId: projectId
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSave(formData)
      toast({
        title: 'Éxito',
        description: unit ? 'Unidad actualizada correctamente' : 'Unidad creada correctamente',
        variant: 'default'
      })
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar la unidad',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{unit ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {unitTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => setFormData({ ...formData, estado: value as EstadoUnidad })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {unitStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="precio">Precio</Label>
            <Input
              id="precio"
              type="number"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Área (m²)</Label>
            <Input
              id="area"
              type="number"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : unit ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 