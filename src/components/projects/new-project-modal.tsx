'use client'

import { FiX } from 'react-icons/fi'
import { useProjectForm } from '@/hooks/useProjectForm'
import toast from 'react-hot-toast'
import ProjectTypeSelect from './components/ProjectTypeSelect'
import DeveloperCompanySelect from './components/DeveloperCompanySelect'
import dynamic from 'next/dynamic'
import { ProjectFormData } from '@/types/project'
import { useSession } from 'next-auth/react'

const MapPicker = dynamic(() => import('../MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Cargando mapa...</p>
    </div>
  )
})

interface NewProjectModalProps {
  onClose: () => void
  onProjectCreated: () => void
}

export default function NewProjectModal({
  onClose,
  onProjectCreated
}: NewProjectModalProps) {
  const { data: session } = useSession()
  const { formData, handleChange, handleSubmit, isSubmitting, error } = useProjectForm({
    onSubmit: async (data: ProjectFormData) => {
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Error al crear el proyecto')
        }

        toast.success('Proyecto creado exitosamente')
        onProjectCreated()
        onClose()
      } catch (error) {
        console.error('Error al crear proyecto:', error)
        toast.error('No se pudo crear el proyecto')
        throw error
      }
    }
  })

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Nuevo Proyecto</h3>
            <p className="mt-1 text-sm text-gray-500">
              Complete los detalles del proyecto para comenzar
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
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
                  </label>
                  <ProjectTypeSelect
                    value={formData.type}
                    onChange={(value) => handleChange({ target: { name: 'type', value } } as any)}
                    required
                  />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="flex justify-end space-x-3 mt-6">
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
              {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 