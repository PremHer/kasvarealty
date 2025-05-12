'use client'

import { useState } from 'react'
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

export default function DeleteEmpresaAlert({
  empresaId,
  empresaNombre,
  isOpen,
  onClose,
  onEmpresaDeleted
}: DeleteEmpresaAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/empresas/${empresaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la empresa')
      }

      toast({
        title: 'Empresa eliminada',
        description: 'La empresa se ha eliminado exitosamente',
        variant: 'default'
      })

      onEmpresaDeleted()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al eliminar la empresa',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <FiAlertTriangle className="h-6 w-6 text-red-600" />
            <span>Eliminar Empresa</span>
          </DialogTitle>
          <DialogDescription className="pt-4">
            <div className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro que deseas eliminar la empresa <span className="font-semibold text-gray-900">{empresaNombre}</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiAlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-800">Esta acción no se puede deshacer</p>
                    <p className="text-sm text-red-600">
                      Se eliminarán todos los datos asociados a esta empresa, incluyendo proyectos y registros relacionados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex space-x-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mr-2"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 