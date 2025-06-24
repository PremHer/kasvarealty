import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, PowerOff, Power } from "lucide-react";
import { UnidadCementerioWithRelations } from '@/types/cementerio';
import { toast } from 'sonner';

interface ToggleUnidadCementerioStatusAlertProps {
  isOpen: boolean;
  onClose: () => void;
  unidad: UnidadCementerioWithRelations | null;
  proyectoId: string;
  onStatusChanged: () => void;
}

export default function ToggleUnidadCementerioStatusAlert({
  isOpen,
  onClose,
  unidad,
  proyectoId,
  onStatusChanged
}: ToggleUnidadCementerioStatusAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isInactivo = unidad?.estado === 'INACTIVO' || unidad?.estado === 'RETIRADO';

  const handleConfirm = async () => {
    if (!unidad) return;

    setIsLoading(true);
    try {
      const newEstado = isInactivo ? 'DISPONIBLE' : 'INACTIVO';
      
      const response = await fetch(`/api/proyectos/${proyectoId}/unidades-cementerio/${unidad.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: newEstado
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado de la unidad');
      }

      const actionText = isInactivo ? 'reactivada' : 'inactivada';
      toast.success(`Unidad ${actionText} correctamente`);
      onStatusChanged();
      onClose();
    } catch (error) {
      console.error('Error al cambiar estado de la unidad:', error);
      const actionText = isInactivo ? 'reactivar' : 'inactivar';
      toast.error(`Error al ${actionText} la unidad`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!unidad) return null;

  const actionText = isInactivo ? 'reactivar' : 'inactivar';
  const actionTextPast = isInactivo ? 'reactivada' : 'inactivada';
  const description = isInactivo 
    ? `¿Estás seguro de que quieres reactivar la unidad "${unidad.codigo}"? Esta unidad volverá a estar disponible para venta.`
    : `¿Estás seguro de que quieres inactivar la unidad "${unidad.codigo}"? Esta unidad ya no estará disponible para venta.`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isInactivo ? (
              <Power className="h-5 w-5 text-green-600" />
            ) : (
              <PowerOff className="h-5 w-5 text-gray-600" />
            )}
            {isInactivo ? 'Reactivar Unidad' : 'Inactivar Unidad'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={isInactivo ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                {isInactivo ? (
                  <Power className="mr-2 h-4 w-4" />
                ) : (
                  <PowerOff className="mr-2 h-4 w-4" />
                )}
                {actionText.charAt(0).toUpperCase() + actionText.slice(1)}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 