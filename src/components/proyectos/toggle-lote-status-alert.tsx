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
import { LoteWithRelations } from '@/types/lote';
import { toast } from 'sonner';

interface ToggleLoteStatusAlertProps {
  isOpen: boolean;
  onClose: () => void;
  lote: LoteWithRelations | null;
  proyectoId: string;
  onStatusChanged: () => void;
}

export default function ToggleLoteStatusAlert({
  isOpen,
  onClose,
  lote,
  proyectoId,
  onStatusChanged
}: ToggleLoteStatusAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isInactivo = lote?.estado === 'INACTIVO';

  const handleConfirm = async () => {
    if (!lote) return;

    setIsLoading(true);
    try {
      const newEstado = isInactivo ? 'DISPONIBLE' : 'INACTIVO';
      
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes/${lote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: newEstado
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado del lote');
      }

      const actionText = isInactivo ? 'reactivado' : 'inactivado';
      toast.success(`Lote ${actionText} correctamente`);
      onStatusChanged();
      onClose();
    } catch (error) {
      console.error('Error al cambiar estado del lote:', error);
      const actionText = isInactivo ? 'reactivar' : 'inactivar';
      toast.error(`Error al ${actionText} el lote`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!lote) return null;

  const actionText = isInactivo ? 'reactivar' : 'inactivar';
  const actionTextPast = isInactivo ? 'reactivado' : 'inactivado';
  const description = isInactivo 
    ? `¿Estás seguro de que quieres reactivar el lote "${lote.codigo}"? Este lote volverá a estar disponible para venta.`
    : `¿Estás seguro de que quieres inactivar el lote "${lote.codigo}"? Este lote ya no estará disponible para venta.`;

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
            {isInactivo ? 'Reactivar Lote' : 'Inactivar Lote'}
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