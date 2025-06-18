'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Calculator,
  Building2,
  Pencil,
  Loader2,
  ChevronUp,
  ChevronDown,
  Home,
  Ruler,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import LoteCard from "@/components/proyectos/LoteCard";
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
import { useSession } from 'next-auth/react';

interface Manzana {
  id: string;
  codigo: string;
  nombre: string;
  areaTotal: number;
  cantidadLotes: number;
  isActive: boolean;
  descripcion?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

interface ManzanasListProps {
  proyectoId: string;
  onManzanasChange?: () => void;
}

const ManzanasList = ({ proyectoId, onManzanasChange }: ManzanasListProps) => {
  const [loading, setLoading] = useState(true);
  const [manzanas, setManzanas] = useState<Manzana[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [cantidadManzanas, setCantidadManzanas] = useState(0);
  const [expandedManzanas, setExpandedManzanas] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; manzanaId: string | null; manzanaName: string }>({
    open: false,
    manzanaId: null,
    manzanaName: ''
  });
  const [infoManzanasACrear, setInfoManzanasACrear] = useState<any>(null);
  const [calculandoInfo, setCalculandoInfo] = useState(false);
  const [mostrarInactivas, setMostrarInactivas] = useState(true);
  const [cambiandoEstados, setCambiandoEstados] = useState<Set<string>>(new Set());
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const { toast } = useToast();
  const session = useSession();

  // Verificar permisos para gestionar manzanas
  const canManageManzanas = [
    'SUPER_ADMIN',
    'GERENTE_GENERAL',
    'PROJECT_MANAGER'
  ].includes(session.data?.user?.role || '');

  const toggleManzana = (manzanaId: string) => {
    setExpandedManzanas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(manzanaId)) {
        newSet.delete(manzanaId);
      } else {
        newSet.add(manzanaId);
      }
      return newSet;
    });
  };

  const cargarManzanas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proyectos/${proyectoId}/manzanas?incluirInactivas=true`);
      if (!response.ok) throw new Error('Error al cargar manzanas');
      const data = await response.json();
      setManzanas(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las manzanas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [proyectoId, toast]);

  const cargarManzanasYNotificar = useCallback(async () => {
    await cargarManzanas();
    onManzanasChange?.();
  }, [cargarManzanas, onManzanasChange]);

  const handleLotesChanged = useCallback(async () => {
    // Recargar manzanas cuando cambien los lotes para actualizar estadísticas
    await cargarManzanas();
    // Notificar cambio para actualizar estadísticas generales
    onManzanasChange?.();
  }, [cargarManzanas, onManzanasChange]);

  const calcularManzanasACrear = useCallback(async (cantidad: number) => {
    if (cantidad <= 0) {
      setInfoManzanasACrear(null);
      return;
    }

    try {
      setCalculandoInfo(true);
      const response = await fetch(`/api/proyectos/${proyectoId}/manzanas?calcular=true&cantidad=${cantidad}`);
      if (!response.ok) throw new Error('Error al calcular manzanas');
      const data = await response.json();
      setInfoManzanasACrear(data);
    } catch (error) {
      console.error('Error al calcular manzanas:', error);
      setInfoManzanasACrear(null);
    } finally {
      setCalculandoInfo(false);
    }
  }, [proyectoId]);

  const handleCreateManzanas = async () => {
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/manzanas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: cantidadManzanas })
      });

      if (!response.ok) throw new Error('Error al crear manzanas');

      await cargarManzanasYNotificar();
      setShowCreateDialog(false);
      setCantidadManzanas(0);
      toast({
        title: "Éxito",
        description: "Manzanas creadas correctamente"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear las manzanas",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (manzanaId: string, manzanaName: string) => {
    setDeleteDialog({
      open: true,
      manzanaId,
      manzanaName
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.manzanaId) return;

    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/manzanas/${deleteDialog.manzanaId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar manzana');
      }

      await cargarManzanasYNotificar();
      toast({
        title: "Éxito",
        description: "Manzana eliminada correctamente"
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la manzana",
        variant: "destructive"
      });
    } finally {
      setDeleteDialog({ open: false, manzanaId: null, manzanaName: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, manzanaId: null, manzanaName: '' });
  };

  const handleToggleStatus = async (manzanaId: string, currentStatus: boolean) => {
    try {
      // Agregar al set de estados cambiando
      setCambiandoEstados(prev => new Set(prev).add(manzanaId));

      const response = await fetch(`/api/proyectos/${proyectoId}/manzanas/${manzanaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado de manzana');
      }

      // Actualizar el estado local inmediatamente
      setManzanas(prevManzanas => 
        prevManzanas.map(manzana => 
          manzana.id === manzanaId 
            ? { ...manzana, isActive: !currentStatus }
            : manzana
        )
      );

      onManzanasChange?.();
      toast({
        title: "Éxito",
        description: `Manzana ${currentStatus ? 'desactivada' : 'activada'} correctamente`
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado de la manzana",
        variant: "destructive"
      });
    } finally {
      // Remover del set de estados cambiando
      setCambiandoEstados(prev => {
        const newSet = new Set(prev);
        newSet.delete(manzanaId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    cargarManzanas();
  }, [cargarManzanas]);

  useEffect(() => {
    calcularManzanasACrear(cantidadManzanas);
  }, [cantidadManzanas, calcularManzanasACrear]);

  const obtenerRangoManzanas = () => {
    if (manzanasFiltradas.length === 0) return 'Sin manzanas';
    
    const codigos = manzanasFiltradas.map(m => m.codigo).sort();
    const primerCodigo = codigos[0];
    const ultimoCodigo = codigos[codigos.length - 1];
    
    return primerCodigo === ultimoCodigo ? primerCodigo : `${primerCodigo} - ${ultimoCodigo}`;
  };

  // Filtrar manzanas según el estado y búsqueda
  const manzanasFiltradas = manzanas.filter(manzana => {
    // Primero filtrar por estado activo/inactivo
    const cumpleEstado = mostrarInactivas ? true : manzana.isActive;
    
    // Luego filtrar por término de búsqueda
    const cumpleBusqueda = terminoBusqueda === '' || 
      manzana.codigo.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      manzana.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase());
    
    return cumpleEstado && cumpleBusqueda;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manzanas</h2>
          <p className="text-muted-foreground">
            {manzanasFiltradas.length} manzana{manzanasFiltradas.length !== 1 ? 's' : ''} mostrada{manzanasFiltradas.length !== 1 ? 's' : ''} 
            {terminoBusqueda && (
              <span className="text-blue-600 font-medium">
                {' '}• Búsqueda: "{terminoBusqueda}"
              </span>
            )}
            {mostrarInactivas && !terminoBusqueda && (
              <span>
                {' '}• {manzanas.filter(m => m.isActive).length} activa{manzanas.filter(m => m.isActive).length !== 1 ? 's' : ''}, {manzanas.filter(m => !m.isActive).length} inactiva{manzanas.filter(m => !m.isActive).length !== 1 ? 's' : ''}
              </span>
            )}
            {' '}• Rango: {obtenerRangoManzanas()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="mostrar-inactivas"
              checked={mostrarInactivas}
              onCheckedChange={setMostrarInactivas}
              className="data-[state=unchecked]:bg-gray-400 data-[state=checked]:bg-green-600 hover:data-[state=unchecked]:bg-gray-500 hover:data-[state=checked]:bg-green-700"
            />
            <Label htmlFor="mostrar-inactivas" className="text-sm font-medium">
              {mostrarInactivas ? 'Ocultar inactivas' : 'Mostrar inactivas'}
            </Label>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar manzanas..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="w-64 px-3 py-2 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {terminoBusqueda && (
              <button
                onClick={() => setTerminoBusqueda('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {canManageManzanas && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Manzanas
            </Button>
          )}
        </div>
      </div>

      {manzanasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {terminoBusqueda ? 'No se encontraron manzanas' : 'No hay manzanas'}
          </h3>
          <p className="mt-2 text-muted-foreground max-w-sm">
            {terminoBusqueda 
              ? `No se encontraron manzanas que coincidan con "${terminoBusqueda}". Intenta con otro término de búsqueda.`
              : canManageManzanas 
                ? 'Crea la primera manzana para comenzar a gestionar tu proyecto.'
                : 'No hay manzanas disponibles en este proyecto.'
            }
          </p>
          {!terminoBusqueda && canManageManzanas && (
            <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Manzana
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {manzanasFiltradas.map((manzana) => (
            <Card key={manzana.id} className={`w-full border-2 hover:border-border transition-colors ${
              !manzana.isActive ? 'opacity-75 bg-gray-50/50 border-gray-200' : ''
            }`}>
              <CardHeader 
                className={`flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer transition-colors rounded-t-lg ${
                  manzana.isActive 
                    ? 'bg-muted/30 hover:bg-muted/50' 
                    : 'bg-gray-100/70 hover:bg-gray-100/90'
                }`}
                onClick={() => toggleManzana(manzana.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {manzana.nombre}
                    </CardTitle>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex items-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span>
                        {manzana.areaTotal.toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} m²
                      </span>
                      <span className="text-xs text-muted-foreground">(activos)</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-primary" />
                      <span>
                        {manzana.cantidadLotes} lotes
                      </span>
                      <span className="text-xs text-muted-foreground">(activos)</span>
                    </div>
                  </div>
                  {!manzana.isActive && (
                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-md border border-orange-200">
                      <Info className="h-3 w-3 inline mr-1" />
                      No se pueden administrar lotes en una manzana inactiva
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cambiandoEstados.has(manzana.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-300 hover:scale-105 ${
                      manzana.isActive 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 shadow-sm' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 shadow-sm'
                    } ${cambiandoEstados.has(manzana.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(manzana.id, manzana.isActive);
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {cambiandoEstados.has(manzana.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                          manzana.isActive ? 'bg-green-600' : 'bg-red-600'
                        }`} />
                      )}
                      {cambiandoEstados.has(manzana.id) ? 'Cambiando...' : (manzana.isActive ? 'Activa' : 'Inactiva')}
                    </div>
                  </Button>
                  {canManageManzanas && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(manzana.id, manzana.nombre);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleManzana(manzana.id);
                    }}
                  >
                    {expandedManzanas.has(manzana.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {expandedManzanas.has(manzana.id) && (
                <CardContent className="pt-4 bg-background">
                  <LoteCard 
                    proyectoId={proyectoId} 
                    manzanaId={manzana.id} 
                    manzanaCodigo={manzana.codigo}
                    manzanaIsActive={manzana.isActive}
                    onLotesChanged={handleLotesChanged}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de creación */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Manzana</DialogTitle>
            <DialogDescription>
              Ingresa la cantidad de manzanas que deseas crear. Se generarán automáticamente los códigos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cantidad">Cantidad de Manzanas</Label>
              <Input
                id="cantidad"
                type="number"
                min="1"
                max="26"
                value={cantidadManzanas}
                onChange={(e) => setCantidadManzanas(parseInt(e.target.value) || 0)}
              />
            </div>
            {cantidadManzanas > 0 && (
              <div className="rounded-lg bg-muted p-4 text-sm">
                <div className="font-medium mb-3">Se crearán las siguientes manzanas:</div>
                <div className="space-y-2">
                  {calculandoInfo ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculando manzanas a crear...
                    </div>
                  ) : infoManzanasACrear ? (
                    <div className="space-y-2">
                      {infoManzanasACrear.enEspaciosVacios > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground font-medium">Rellenar espacios vacíos:</span>
                          <div className="flex flex-wrap gap-1">
                            {infoManzanasACrear.rellenarEspaciosVacios.map((codigo: string) => (
                              <span 
                                key={codigo} 
                                className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-medium border border-orange-200"
                              >
                                {codigo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {infoManzanasACrear.nuevas > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground font-medium">
                            {infoManzanasACrear.nuevas === 1 ? 'Nueva manzana:' : 'Nuevas manzanas:'}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {infoManzanasACrear.nuevasManzanas.map((codigo: string) => (
                              <span 
                                key={codigo} 
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium border border-green-200"
                              >
                                {codigo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Error al calcular las manzanas a crear.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateManzanas} 
              disabled={cantidadManzanas <= 0}
            >
              Crear Manzanas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de eliminación */}
      <AlertDialog open={deleteDialog.open} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Eliminar Manzana</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-left">
                <p>¿Estás seguro de que deseas eliminar la manzana <strong>"{deleteDialog.manzanaName}"</strong>?</p>
                <br />
                <p>Esta acción eliminará permanentemente:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>La manzana y todos sus datos</li>
                  <li>Todos los lotes asociados a esta manzana</li>
                  <li>Información de ventas relacionadas</li>
                </ul>
                <br />
                <p className="text-destructive font-medium">Esta acción no se puede deshacer.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Eliminar Manzana
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManzanasList; 