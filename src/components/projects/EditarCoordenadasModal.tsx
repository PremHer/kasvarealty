'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { FiMapPin, FiSave, FiX } from 'react-icons/fi'

interface EditarCoordenadasModalProps {
  isOpen: boolean
  onClose: () => void
  unidad: {
    id: string
    codigo: string
    numero?: string
    tipoUnidad?: string
    tipo: 'lote' | 'unidad_cementerio'
    latitud?: number
    longitud?: number
    dimensionFrente?: number
    dimensionFondo?: number
  } | null
  proyectoId: string
  onSuccess: () => void
}

export default function EditarCoordenadasModal({
  isOpen,
  onClose,
  unidad,
  proyectoId,
  onSuccess
}: EditarCoordenadasModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    latitud: '',
    longitud: '',
    dimensionFrente: '',
    dimensionFondo: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (unidad) {
      setFormData({
        latitud: unidad.latitud?.toString() || '',
        longitud: unidad.longitud?.toString() || '',
        dimensionFrente: unidad.dimensionFrente?.toString() || '',
        dimensionFondo: unidad.dimensionFondo?.toString() || ''
      })
    }
  }, [unidad])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unidad) return

    setIsLoading(true)

    try {
      const endpoint = unidad.tipo === 'lote' 
        ? `/api/proyectos/${proyectoId}/lotes/${unidad.id}`
        : `/api/proyectos/${proyectoId}/unidades-cementerio/${unidad.id}`

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitud: formData.latitud ? parseFloat(formData.latitud) : null,
          longitud: formData.longitud ? parseFloat(formData.longitud) : null,
          dimensionFrente: formData.dimensionFrente ? parseFloat(formData.dimensionFrente) : null,
          dimensionFondo: formData.dimensionFondo ? parseFloat(formData.dimensionFondo) : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar coordenadas')
      }

      toast({
        title: 'Coordenadas actualizadas',
        description: 'Las coordenadas se han actualizado correctamente.',
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar las coordenadas.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !unidad) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiMapPin className="h-5 w-5" />
            Editar Coordenadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {unidad.tipo === 'lote' 
                ? `Lote ${unidad.numero} - ${unidad.codigo}`
                : `${unidad.tipoUnidad} - ${unidad.codigo}`
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitud">Latitud</Label>
                <Input
                  id="latitud"
                  type="number"
                  step="any"
                  placeholder="Ej: -12.0464"
                  value={formData.latitud}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitud: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="longitud">Longitud</Label>
                <Input
                  id="longitud"
                  type="number"
                  step="any"
                  placeholder="Ej: -77.0428"
                  value={formData.longitud}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitud: e.target.value }))}
                />
              </div>
            </div>

            {unidad.tipo === 'lote' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dimensionFrente">Frente (m)</Label>
                  <Input
                    id="dimensionFrente"
                    type="number"
                    step="any"
                    placeholder="Ej: 15.5"
                    value={formData.dimensionFrente}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensionFrente: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dimensionFondo">Fondo (m)</Label>
                  <Input
                    id="dimensionFondo"
                    type="number"
                    step="any"
                    placeholder="Ej: 25.0"
                    value={formData.dimensionFondo}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensionFondo: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                <FiSave className="h-4 w-4 mr-2" />
                {isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                <FiX className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Consejo:</strong> Puedes obtener las coordenadas desde Google Maps haciendo clic derecho en el punto deseado y seleccionando "¿Qué hay aquí?"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 