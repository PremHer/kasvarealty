'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, GripVertical, Edit2, Save, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Caracteristica {
  id?: string
  nombre: string
  descripcion?: string
  activa: boolean
  orden: number
}

interface CaracteristicasTabProps {
  proyectoId: string
}

export default function CaracteristicasTab({ proyectoId }: CaracteristicasTabProps) {
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
    if (proyectoId) {
      loadCaracteristicas()
    }
  }, [proyectoId])

  // Debug: Log del estado de editingId
  useEffect(() => {
    console.log('🔍 Debug - editingId cambió:', editingId)
  }, [editingId])

  // Debug: Log del estado de características (solo cuando cambie la cantidad)
  useEffect(() => {
    console.log('🔍 Debug - características cambió, cantidad:', caracteristicas.length)
  }, [caracteristicas.length])

  // Debug: Log del estado de editForm (solo cuando cambie el nombre)
  useEffect(() => {
    if (editForm.nombre) {
      console.log('🔍 Debug - editForm.nombre cambió:', editForm.nombre)
    }
  }, [editForm.nombre])

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
    console.log('🔍 Debug - handleAdd llamado')
    const nuevaCaracteristica: Caracteristica = {
      nombre: '',
      descripcion: '',
      activa: true,
      orden: caracteristicas.length
    }
    console.log('🔍 Debug - nueva característica creada:', nuevaCaracteristica)
    setCaracteristicas([...caracteristicas, nuevaCaracteristica])
    setEditingId('new')
    setEditForm(nuevaCaracteristica)
  }

  const handleEdit = (caracteristica: Caracteristica) => {
    console.log('🔍 Debug - handleEdit llamado:', caracteristica)
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

  const caracteristicasActivas = caracteristicas.filter(c => c.activa)

  return (
    <div className="space-y-6">
      {/* Advertencia si no hay características configuradas */}
      {caracteristicasActivas.length === 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>⚠️ Advertencia:</strong> No hay características configuradas para este proyecto. 
            Los contratos generados mostrarán características genéricas por defecto. 
            Es recomendable configurar las características específicas del proyecto para generar contratos más precisos.
          </AlertDescription>
        </Alert>
      )}

      {/* Información sobre características */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          ¿Qué son las características del proyecto?
        </h3>
        <p className="text-blue-800 text-sm">
          Las características del proyecto son los servicios, infraestructura y beneficios que se incluirán 
          en los contratos de venta. Estas aparecerán en la <strong>SEGUNDA cláusula</strong> del contrato 
          y ayudan a los compradores a entender qué incluye su compra.
        </p>
      </div>

      {/* Botón para agregar características */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Características del Proyecto</h3>
          <p className="text-sm text-gray-600">
            {caracteristicasActivas.length > 0 
              ? `${caracteristicasActivas.length} característica(s) configurada(s)`
              : 'No hay características configuradas'
            }
          </p>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Característica
        </Button>
      </div>

      {loading && <div className="text-center py-4">Cargando...</div>}

      {/* Lista de características */}
      <div className="space-y-4">
        {caracteristicas.map((caracteristica, index) => {
          const isEditing = editingId === (caracteristica.id || 'new')
          const uniqueKey = caracteristica.id || `new-${index}`
          
          return (
            <Card key={uniqueKey}>
              <CardContent className="p-4">
                {isEditing ? (
                  // Modo edición - Solo campo de nombre
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre de la Característica *</Label>
                      <Input
                        id="nombre"
                        value={editForm.nombre}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        placeholder="Ej: Habilitación para alumbrado público"
                        autoFocus
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
                        <div className="text-xs text-gray-500 mt-1">
                          Orden: {caracteristica.orden + 1} • 
                          Estado: {caracteristica.activa ? 'Activa' : 'Inactiva'}
                        </div>
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
          )})}
        </div>

        {/* Mensaje cuando no hay características */}
        {caracteristicas.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay características configuradas</h3>
            <p className="text-gray-600 mb-4">
              Comienza agregando las características de tu proyecto para que aparezcan en los contratos.
            </p>
            <Button onClick={handleAdd} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Característica
            </Button>
          </div>
        )}

        {/* Vista previa de cómo aparecerán en el contrato */}
        {caracteristicasActivas.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Vista previa en el contrato:</h4>
            <div className="bg-white border border-gray-200 rounded p-3 text-sm">
              <div className="text-gray-600 mb-2">SEGUNDA: OBJETO DEL CONTRATO</div>
              <div className="text-gray-800">
                El proyecto contará dentro de su conformación con las siguientes características:
              </div>
              <div className="mt-2 space-y-1">
                {caracteristicasActivas.map((car, index) => (
                  <div key={car.id || `preview-${index}`} className="text-gray-700">
                    • {car.nombre}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
