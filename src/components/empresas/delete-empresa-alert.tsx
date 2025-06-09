'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi'
import { useToast } from '@/components/ui/use-toast'

interface DeleteEmpresaAlertProps {
  empresaId: string
  empresaNombre: string
  isOpen: boolean
  onClose: () => void
  onEmpresaDeleted: () => void
}

interface AssociatedData {
  proyectos: number
  proyectosList: string[]
}

export default function DeleteEmpresaAlert({
  empresaId,
  empresaNombre,
  isOpen,
  onClose,
  onEmpresaDeleted
}: DeleteEmpresaAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [associatedData, setAssociatedData] = useState<AssociatedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchAssociatedData = async () => {
      if (isOpen && empresaId) {
        try {
          const response = await fetch(`/api/empresas/${empresaId}/associated-data`)
          if (response.ok) {
            const data = await response.json()
            setAssociatedData(data)
          }
        } catch (error) {
          console.error('Error al obtener datos asociados:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchAssociatedData()
  }, [isOpen, empresaId])

  const handleDelete = async () => {
    if (!empresaId) {
      toast({
        title: 'Error',
        description: 'ID de empresa no válido',
        variant: 'destructive'
      })
      return
    }

    if (associatedData?.proyectos && associatedData.proyectos > 0) {
      toast({
        title: 'No se puede eliminar',
        description: 'La empresa tiene proyectos asociados que deben ser eliminados primero',
        variant: 'destructive'
      })
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/empresas/${empresaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al eliminar la empresa')
      }

      toast({
        title: '¡Éxito!',
        description: 'La empresa se ha eliminado exitosamente',
        variant: 'success',
        duration: 3000
      })

      onEmpresaDeleted()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Hubo un error al eliminar la empresa',
        variant: 'destructive',
        duration: 5000
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const hasAssociatedProjects = associatedData?.proyectos && associatedData.proyectos > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <FiAlertTriangle className="h-6 w-6 text-green-600" />
            <span>Eliminar Empresa</span>
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-4 pt-4">
              {isLoading ? (
                <div>Cargando información...</div>
              ) : hasAssociatedProjects ? (
                <div className="space-y-4">
                  <div className="text-gray-600">
                    No se puede eliminar la empresa <span className="font-semibold text-gray-900">{empresaNombre}</span> porque tiene proyectos asociados.
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FiAlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-red-800">Proyectos asociados ({associatedData.proyectos}):</div>
                        <ul className="list-disc list-inside text-sm text-red-600">
                          {associatedData.proyectosList.map((proyecto, index) => (
                            <li key={index}>{proyecto}</li>
                          ))}
                        </ul>
                        <div className="text-sm text-red-600 mt-2">
                          Debes eliminar o reasignar estos proyectos antes de eliminar la empresa.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-gray-600">
                    ¿Estás seguro que deseas eliminar la empresa <span className="font-semibold text-gray-900">{empresaNombre}</span>?
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FiAlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-red-800">Esta acción no se puede deshacer</div>
                        <div className="text-sm text-red-600">
                          Se eliminarán todos los datos asociados a esta empresa.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mr-2"
          >
            Cancelar
          </Button>
          {!hasAssociatedProjects && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isDeleting ? (
                <>
                  <FiTrash2 className="mr-2 h-4 w-4 animate-pulse" />
                  Eliminando...
                </>
              ) : (
                <>
                  <FiTrash2 className="mr-2 h-4 w-4" />
                  Eliminar Empresa
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 