'use client'

import { FiX } from 'react-icons/fi'
import { useProjectForm } from '@/hooks/useProjectForm'
import { useToast } from '@/components/ui/use-toast'
import ProjectTypeSelect from './components/ProjectTypeSelect'
import DeveloperCompanySelect from './components/DeveloperCompanySelect'
import dynamic from 'next/dynamic'
import { Project, ProjectFormData } from '@/types/project'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState, useEffect } from 'react'


const MapPicker = dynamic(() => import('../MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Cargando mapa...</p>
    </div>
  )
})

interface EditProjectModalProps {
  project: Project
  onClose: () => void
  onProjectUpdated: (updatedProject: Project) => void
}

export default function EditProjectModal({ project, onClose, onProjectUpdated }: EditProjectModalProps) {
  const { toast } = useToast()
  const [hasRelatedData, setHasRelatedData] = useState(false)
  const [isCheckingData, setIsCheckingData] = useState(true)

  
  const { formData, handleChange, handleSubmit, isSubmitting, error } = useProjectForm({
    initialData: {
      name: project.name || '',
      description: project.description || '',
      location: project.location || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      type: project.type || '',
      developerCompanyId: project.developerCompanyId || '',
      departamento: project.departamento || '',
      provincia: project.provincia || '',
      distrito: project.distrito || '',
      latitud: project.latitud?.toString() || '',
      longitud: project.longitud?.toString() || '',
      precioTerreno: project.precioTerreno?.toString() || '',
      inversionInicial: project.inversionInicial?.toString() || '',
      totalArea: project.totalArea?.toString() || '',
      // Campos del predio matriz para contratos
      extensionTotal: project.extensionTotal?.toString() || '',
      unidadCatastral: project.unidadCatastral || '',
      partidaRegistral: project.partidaRegistral || '',
      plazoIndependizacion: project.plazoIndependizacion?.toString() || ''
    },
    onSubmit: async (data: ProjectFormData) => {
      try {
        console.log('Enviando actualización al proyecto:', project.id)
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Error al actualizar el proyecto')
        }

        toast({
          title: '¡Éxito!',
          description: 'El proyecto se ha actualizado exitosamente',
          variant: 'success'
        })
        const updatedProject = await response.json()
        console.log('Proyecto actualizado:', updatedProject)
        onProjectUpdated(updatedProject)
        onClose()
      } catch (error) {
        console.error('Error al actualizar proyecto:', error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo actualizar el proyecto',
          variant: 'destructive'
        })
        throw error
      }
    }
  })

  // Verificar si el proyecto tiene datos relacionados
  useEffect(() => {
    const checkRelatedData = async () => {
      try {
        setIsCheckingData(true)
        
        // Verificar manzanas y lotes
        const manzanasResponse = await fetch(`/api/proyectos/${project.id}/manzanas`)
        const pabellonesResponse = await fetch(`/api/proyectos/${project.id}/pabellones`)
        
        const manzanas = manzanasResponse.ok ? await manzanasResponse.json() : []
        const pabellones = pabellonesResponse.ok ? await pabellonesResponse.json() : []
        
        // Contar lotes si hay manzanas
        let lotesCount = 0
        if (manzanas.length > 0) {
          for (const manzana of manzanas) {
            const lotesResponse = await fetch(`/api/proyectos/${project.id}/manzanas/${manzana.id}/lotes`)
            if (lotesResponse.ok) {
              const lotes = await lotesResponse.json()
              lotesCount += lotes.length
            }
          }
        }
        
        // Contar unidades de cementerio si hay pabellones
        let unidadesCount = 0
        if (pabellones.length > 0) {
          for (const pabellon of pabellones) {
            const unidadesResponse = await fetch(`/api/proyectos/${project.id}/pabellones/${pabellon.id}/unidades-cementerio`)
            if (unidadesResponse.ok) {
              const unidades = await unidadesResponse.json()
              unidadesCount += unidades.length
            }
          }
        }
        
        setHasRelatedData(manzanas.length > 0 || lotesCount > 0 || pabellones.length > 0 || unidadesCount > 0)
      } catch (error) {
        console.error('Error al verificar datos relacionados:', error)
        setHasRelatedData(false)
      } finally {
        setIsCheckingData(false)
      }
    }
    
    checkRelatedData()
  }, [project.id])

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="edit-project-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Editar Proyecto</DialogTitle>
          <p id="edit-project-description" className="text-sm text-gray-500">
            Modifique la información del proyecto según sea necesario
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Información Básica */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre del Proyecto
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 placeholder-gray-400"
                    placeholder="Ej: Residencial Los Pinos"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Tipo de Proyecto
                    {hasRelatedData && (
                      <span className="ml-2 text-xs text-orange-600 font-normal">
                        (No se puede cambiar)
                      </span>
                    )}
                  </label>
                  {isCheckingData ? (
                    <div className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-500">
                      Verificando datos relacionados...
                    </div>
                  ) : (
                    <>
                      <ProjectTypeSelect
                        value={formData.type}
                        onChange={(value) => handleChange({ target: { name: 'type', value } } as any)}
                        required
                        disabled={hasRelatedData}
                      />
                      {hasRelatedData && (
                        <p className="text-xs text-orange-600 mt-1">
                          El tipo de proyecto no se puede cambiar porque ya tiene datos relacionados. Para cambiar el tipo, primero debe eliminar todos los datos asociados al proyecto.
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="Describe el proyecto..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Seleccione la ubicación en el mapa
                  </label>
                  <div className="relative z-0">
                    <MapPicker 
                      onLocationSelect={(location) => {
                        const changes = [
                          { name: 'location', value: location.direccion },
                          { name: 'departamento', value: location.departamento || '' },
                          { name: 'provincia', value: location.provincia || '' },
                          { name: 'distrito', value: location.distrito || '' },
                          { name: 'latitud', value: location.latitud.toString() },
                          { name: 'longitud', value: location.longitud.toString() }
                        ]
                        changes.forEach(change => {
                          handleChange({
                            target: {
                              name: change.name,
                              value: change.value
                            }
                          } as React.ChangeEvent<HTMLInputElement>)
                        })
                      }}
                      initialLocation={
                        formData.latitud && formData.longitud
                          ? {
                              latitud: parseFloat(formData.latitud),
                              longitud: parseFloat(formData.longitud)
                            }
                          : undefined
                      }
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Haz clic en el mapa para seleccionar la ubicación exacta del proyecto
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="departamento" className="block text-sm font-medium text-gray-700">
                    Departamento
                  </label>
                  <input
                    type="text"
                    id="departamento"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="Ej: Lima"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">
                    Provincia
                  </label>
                  <input
                    type="text"
                    id="provincia"
                    name="provincia"
                    value={formData.provincia}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="Ej: Lima"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="distrito" className="block text-sm font-medium text-gray-700">
                    Distrito
                  </label>
                  <input
                    type="text"
                    id="distrito"
                    name="distrito"
                    value={formData.distrito}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="Ej: San Isidro"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="Ej: Av. Primavera 123"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="latitud" className="block text-sm font-medium text-gray-700">
                    Latitud
                  </label>
                  <input
                    type="number"
                    id="latitud"
                    name="latitud"
                    value={formData.latitud}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    step="any"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="longitud" className="block text-sm font-medium text-gray-700">
                    Longitud
                  </label>
                  <input
                    type="number"
                    id="longitud"
                    name="longitud"
                    value={formData.longitud}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    step="any"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Empresa Desarrolladora */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Empresa Desarrolladora</h3>
              <div className="space-y-2">
                <label htmlFor="developerCompanyId" className="block text-sm font-medium text-gray-700">
                  Seleccione la Empresa Desarrolladora
                </label>
                <DeveloperCompanySelect
                  value={formData.developerCompanyId}
                  onChange={(value) => handleChange({ target: { name: 'developerCompanyId', value } } as any)}
                  required
                />
              </div>
            </div>

            {/* Información Financiera */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Financiera</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="precioTerreno" className="block text-sm font-medium text-gray-700">
                    Precio del Terreno
                  </label>
                  <input
                    type="number"
                    id="precioTerreno"
                    name="precioTerreno"
                    value={formData.precioTerreno}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="inversionInicial" className="block text-sm font-medium text-gray-700">
                    Inversión Inicial
                  </label>
                  <input
                    type="number"
                    id="inversionInicial"
                    name="inversionInicial"
                    value={formData.inversionInicial}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="totalArea" className="block text-sm font-medium text-gray-700">
                    Área Total (m²)
                  </label>
                  <input
                    type="number"
                    id="totalArea"
                    name="totalArea"
                    value={formData.totalArea}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Información del Predio Matriz */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Predio Matriz</h3>
              <p className="text-sm text-gray-600 mb-4">Datos del terreno original que serán utilizados en los contratos de venta</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="extensionTotal" className="block text-sm font-medium text-gray-700">
                    Extensión Total (hectáreas)
                  </label>
                  <input
                    type="number"
                    id="extensionTotal"
                    name="extensionTotal"
                    value={formData.extensionTotal}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="unidadCatastral" className="block text-sm font-medium text-gray-700">
                    Unidad Catastral
                  </label>
                  <input
                    type="text"
                    id="unidadCatastral"
                    name="unidadCatastral"
                    value={formData.unidadCatastral}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="Ej: 311394"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="partidaRegistral" className="block text-sm font-medium text-gray-700">
                    Partida Registral
                  </label>
                  <input
                    type="text"
                    id="partidaRegistral"
                    name="partidaRegistral"
                    value={formData.partidaRegistral}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="Ej: 11140550"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="plazoIndependizacion" className="block text-sm font-medium text-gray-700">
                    Plazo de Independización (meses)
                  </label>
                  <input
                    type="number"
                    id="plazoIndependizacion"
                    name="plazoIndependizacion"
                    value={formData.plazoIndependizacion}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    placeholder="12"
                    min="1"
                    step="1"
                  />
                </div>
              </div>
            </div>



            {/* Información del Proyecto */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Proyecto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </DialogContent>
      

    </Dialog>
  )
} 