import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from 'next-auth/react';
import { Plus, Loader2, Home, Trash2 } from "lucide-react";
import { loteService, Lote } from '@/lib/services/loteService';
import { toast } from 'sonner';

interface LoteCardProps {
  proyectoId: string;
  manzanaId: string;
  codigo: string;
}

export function LoteCard({ proyectoId, manzanaId, codigo }: LoteCardProps) {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cantidad, setCantidad] = useState('1');
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = useSession();

  // Verificar permisos para gestionar lotes
  const canManageLotes = [
    'SUPER_ADMIN',
    'GERENTE_GENERAL',
    'PROJECT_MANAGER'
  ].includes(session?.user?.role || '');

  useEffect(() => {
    cargarLotes();
  }, [proyectoId]);

  const cargarLotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const lotesData = await loteService.obtenerLotes(proyectoId);
      setLotes(lotesData.filter(lote => lote.manzanaId === manzanaId));
    } catch (error) {
      // No mostramos el error al usuario ya que es normal que no haya lotes al inicio
      setLotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearLotes = async () => {
    try {
      setIsCreating(true);
      const cantidadNum = parseInt(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        toast.error('Por favor ingrese una cantidad válida');
        return;
      }

      await loteService.crearLotesEnBulk(proyectoId, cantidadNum);
      toast.success('Lotes creados exitosamente');
      setIsDialogOpen(false);
      cargarLotes();
    } catch (error) {
      toast.error('Error al crear los lotes');
      console.error('Error al crear lotes:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEliminarLote = async (loteId: string) => {
    try {
      await loteService.eliminarLote(loteId);
      toast.success('Lote eliminado exitosamente');
      cargarLotes();
    } catch (error) {
      toast.error('Error al eliminar el lote');
      console.error('Error al eliminar lote:', error);
    }
  };

  return (
    <Card className="w-full border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">
            Lotes
          </CardTitle>
        </div>
        {canManageLotes && (
          <Button
            variant="outline"
            size="sm"
            className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lote
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-destructive text-center">{error}</div>
        ) : lotes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="bg-muted/50 p-4 rounded-lg inline-block">
              <Home className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p>No hay lotes registrados</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {lotes.map((lote) => (
              <div
                key={lote.id}
                className="flex items-center justify-between p-3 border-2 rounded-lg hover:border-border transition-colors bg-card"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Home className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Lote {lote.numero}</span>
                </div>
                {canManageLotes && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleEliminarLote(lote.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevos Lotes</DialogTitle>
            <DialogDescription>
              Ingresa la cantidad de lotes que deseas crear para esta manzana.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cantidad">Cantidad de Lotes</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                disabled={isCreating}
                className="border-2 focus:border-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreating}
              className="border-2"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCrearLotes} 
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Lotes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default LoteCard; 