'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, GripVertical, Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

interface Caracteristica {
  id?: string
  nombre: string
  descripcion?: string
  activa: boolean
  orden: number
}

interface CaracteristicasProyectoModalProps {
  proyectoId: string
  isOpen: boolean
  onClose: () => void
}

export default function CaracteristicasProyectoModal({
  proyectoId,
  isOpen,
  onClose
}: CaracteristicasProyectoModalProps) {
  const [caracteristicas, setCaracteristicas] = useState<Caracteristica[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Caracteristica>({
    nombre: '',
    descripcion: '',
    activa: true,
    orden: 0
  })

  // Cargar características del proyecto
  useEffect(() => {
    if (isOpen && proyectoId) {
      loadCaracteristicas()
    }
  }, [isOpen, proyectoId])

  const loadCaracteristicas = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${proyectoId}/caracteristicas`)
      if (response.ok) {
        const data = await response.json()
        setCaracteristicas(data.sort((a: Caracteristica, b: Caracteristica) => a.orden - b.orden))
      }
    } catch (error) {
      console.error('Error al cargar características:', error)
      toast.error('Error al cargar las características del proyecto')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    const nuevaCaracteristica: Caracteristica = {
      nombre: '',
      descripcion: '',
      activa: true,
      orden: caracteristicas.length
    }
    setCaracteristicas([...caracteristicas, nuevaCaracteristica])
    setEditingId('new')
    setEditForm(nuevaCaracteristica)
  }

  const handleEdit = (caracteristica: Caracteristica) => {
    setEditingId(caracteristica.id || 'new')
    setEditForm(caracteristica)
  }

  const handleSave = async () => {
    if (!editForm.nombre.trim()) {
      toast.error('El nombre de la característica es obligatorio')
      return
    }

    try {
      setLoading(true)
      
      if (editingId === 'new') {
        // Crear nueva característica
        const response = await fetch(`/api/projects/${proyectoId}/caracteristicas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        })
        
        if (response.ok) {
          toast.success('Característica creada exitosamente')
          await loadCaracteristicas()
        }
      } else {
        // Actualizar característica existente
        const response = await fetch(`/api/projects/${proyectoId}/caracteristicas/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        })
        
        if (response.ok) {
          toast.success('Característica actualizada exitosamente')
          await loadCaracteristicas()
        }
      }
      
      setEditingId(null)
      setEditForm({ nombre: '', descripcion: '', activa: true, orden: 0 })
    } catch (error) {
      console.error('Error al guardar característica:', error)
      toast.error('Error al guardar la característica')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta característica?')) return

    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${proyectoId}/caracteristicas/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Característica eliminada exitosamente')
        await loadCaracteristicas()
      }
    } catch (error) {
      console.error('Error al eliminar característica:', error)
      toast.error('Error al eliminar la característica')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ nombre: '', descripcion: '', activa: true, orden: 0 })
  }

  const moveCaracteristica = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = caracteristicas.findIndex(c => c.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= caracteristicas.length) return

    const newCaracteristicas = [...caracteristicas]
    const temp = newCaracteristicas[currentIndex]
    newCaracteristicas[currentIndex] = newCaracteristicas[newIndex]
    newCaracteristicas[newIndex] = temp

    // Actualizar orden
    newCaracteristicas.forEach((c, index) => {
      c.orden = index
    })

    setCaracteristicas(newCaracteristicas)

    // Guardar el nuevo orden en la base de datos
    try {
      await Promise.all(
        newCaracteristicas.map(c => 
          fetch(`/api/projects/${proyectoId}/caracteristicas/${c.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(c)
          })
        )
      )
    } catch (error) {
      console.error('Error al actualizar orden:', error)
      toast.error('Error al actualizar el orden')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Características del Proyecto</h2>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar Característica
          </Button>
        </div>

        {loading && <div className="text-center py-4">Cargando...</div>}

        <div className="space-y-4">
          {caracteristicas.map((caracteristica, index) => (
            <Card key={caracteristica.id || index}>
              <CardContent className="p-4">
                {editingId === caracteristica.id ? (
                  // Modo edición
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        placeholder="Ej: Habilitación para alumbrado público"
                      />
                    </div>
                    <div>
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={editForm.descripcion || ''}
                        onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                        placeholder="Descripción opcional de la característica"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="activa"
                        checked={editForm.activa}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, activa: checked })}
                      />
                      <Label htmlFor="activa">Activa</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Modo visualización
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCaracteristica(caracteristica.id!, 'up')}
                          disabled={index === 0}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveCaracteristica(caracteristica.id!, 'down')}
                          disabled={index === caracteristicas.length - 1}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex-1">
                        <div className={`font-medium ${!caracteristica.activa ? 'line-through text-gray-500' : ''}`}>
                          {caracteristica.nombre}
                        </div>
                        {caracteristica.descripcion && (
                          <div className="text-sm text-gray-600 mt-1">
                            {caracteristica.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(caracteristica)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {caracteristica.id && (
                        <Button
                          onClick={() => handleDelete(caracteristica.id!)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {caracteristicas.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No hay características configuradas para este proyecto.
            <br />
            Haz clic en "Agregar Característica" para comenzar.
          </div>
        )}
      </div>
    </div>
  )
}
