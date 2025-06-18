'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { LoteWithRelations } from '@/types/lote'

interface DeleteLoteAlertProps {
  lote: LoteWithRelations | null
  proyectoId: string
  isOpen: boolean
  onClose: () => void
  onLoteDeleted: () => void
}

export default function DeleteLoteAlert({
  lote,
  proyectoId,
  isOpen,
  onClose,
  onLoteDeleted
}: DeleteLoteAlertProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!lote) {
      toast({
        title: 'Error',
        description: 'Lote no válido',
        variant: 'destructive'
      })
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes/${lote.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Error al eliminar el lote')
      }

      toast({
        title: '¡Éxito!',
        description: `El lote ${lote.codigo} se ha eliminado exitosamente`,
        variant: 'default',
        duration: 3000
      })

      onLoteDeleted()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Hubo un error al eliminar el lote',
        variant: 'destructive',
        duration: 5000
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!lote) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <span>Eliminar Lote</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="text-gray-600">
            ¿Estás seguro que deseas eliminar el lote <span className="font-semibold text-gray-900">{lote.codigo}</span>?
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">Detalles del lote:</div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div><span className="font-medium">Código:</span> {lote.codigo}</div>
                <div><span className="font-medium">Área:</span> {lote.area} m²</div>
                <div><span className="font-medium">Estado:</span> {lote.estado}</div>
                {lote.precio && (
                  <div><span className="font-medium">Precio:</span> S/. {lote.precio.toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium text-red-800">Esta acción no se puede deshacer</div>
                <div className="text-sm text-red-600">
                  Se eliminarán todos los datos asociados a este lote de forma permanente.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
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
          >
            {isDeleting ? (
              <>
                <Trash2 className="mr-2 h-4 w-4 animate-pulse" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Lote
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 