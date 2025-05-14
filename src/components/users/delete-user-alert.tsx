'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertCircle, AlertTriangle } from "lucide-react"

interface DeleteUserAlertProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName: string
  associatedData?: {
    proyectos: number
    proyectosList: string[]
    ventas: number
    ventasList: string[]
    actividades: number
    actividadesList: string[]
  }
}

export function DeleteUserAlert({
  isOpen,
  onClose,
  onConfirm,
  userName,
  associatedData
}: DeleteUserAlertProps) {
  const hasAssociatedProjects = associatedData?.proyectos && associatedData.proyectos > 0

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Confirmar eliminación
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasAssociatedProjects ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">No se puede eliminar este usuario</p>
                    <p className="text-sm text-red-600">
                      Este usuario tiene proyectos asociados que deben ser reasignados o eliminados antes de poder eliminarlo.
                      Te recomendamos desactivar el usuario en su lugar.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Proyectos asociados ({associatedData.proyectos}):</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {associatedData.proyectosList.map((proyecto, index) => (
                        <li key={index}>{proyecto}</li>
                      ))}
                    </ul>
                  </div>
                  {associatedData.ventas > 0 && (
                    <div>
                      <p className="font-medium">Ventas asociadas ({associatedData.ventas}):</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {associatedData.ventasList.map((venta, index) => (
                          <li key={index}>{venta}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {associatedData.actividades > 0 && (
                    <div>
                      <p className="font-medium">Actividades asociadas ({associatedData.actividades}):</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {associatedData.actividadesList.map((actividad, index) => (
                          <li key={index}>{actividad}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p>¿Estás seguro que deseas eliminar al usuario {userName}? Esta acción no se puede deshacer.</p>
                {associatedData && (
                  <div className="mt-4 space-y-4">
                    {associatedData.ventas > 0 && (
                      <div>
                        <p className="font-medium">Ventas asociadas ({associatedData.ventas}):</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {associatedData.ventasList.map((venta, index) => (
                            <li key={index}>{venta}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {associatedData.actividades > 0 && (
                      <div>
                        <p className="font-medium">Actividades asociadas ({associatedData.actividades}):</p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {associatedData.actividadesList.map((actividad, index) => (
                            <li key={index}>{actividad}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {!hasAssociatedProjects && (
          <AlertDialogAction
            onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700"
          >
            Eliminar
          </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}