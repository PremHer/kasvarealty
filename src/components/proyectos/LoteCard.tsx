import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from 'next-auth/react';
import { Plus, Loader2, Home, Trash2, Edit, MapPin, DollarSign, Ruler, ChevronDown, ChevronUp, Calendar, User, FileText, Info, PowerOff, Power } from "lucide-react";
import { LoteWithRelations } from '@/types/lote';
import { EstadoLote } from '@prisma/client';
import LoteModal from './LoteModal';
import DeleteLoteAlert from './delete-lote-alert';
import LotePendienteSelector from './LotePendienteSelector';
import ToggleLoteStatusAlert from './toggle-lote-status-alert';
import { loteService, LotePendiente } from '@/lib/services/loteService';
import { toast } from 'sonner';

interface LoteCardProps {
  proyectoId: string;
  manzanaId: string;
  manzanaCodigo: string;
  manzanaIsActive: boolean;
  onLotesChanged?: () => void;
}

export function LoteCard({ proyectoId, manzanaId, manzanaCodigo, manzanaIsActive, onLotesChanged }: LoteCardProps) {
  const [lotes, setLotes] = useState<LoteWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteWithRelations | null>(null);
  const [expandedLotes, setExpandedLotes] = useState<Set<string>>(new Set());
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [loteToDelete, setLoteToDelete] = useState<LoteWithRelations | null>(null);
  const [isToggleStatusAlertOpen, setIsToggleStatusAlertOpen] = useState(false);
  const [loteToToggleStatus, setLoteToToggleStatus] = useState<LoteWithRelations | null>(null);
  const [isPendienteSelectorOpen, setIsPendienteSelectorOpen] = useState(false);
  const [lotesPendientes, setLotesPendientes] = useState<LotePendiente[]>([]);
  const [lotePendienteSeleccionado, setLotePendienteSeleccionado] = useState<LotePendiente | null>(null);
  const { data: session } = useSession();

  // Verificar permisos para gestionar lotes
  const canManageLotes = [
    'SUPER_ADMIN',
    'GERENTE_GENERAL',
    'PROJECT_MANAGER'
  ].includes(session?.user?.role || '');

  useEffect(() => {
    cargarLotes();
  }, [proyectoId, manzanaId]);

  const cargarLotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes?manzanaId=${manzanaId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar lotes');
      }
      
      const lotesData = await response.json();
      setLotes(lotesData);
    } catch (error) {
      console.error('Error al cargar lotes:', error);
      setError('Error al cargar los lotes');
      setLotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearLote = async () => {
    try {
      // Detectar lotes pendientes
      const lotesPendientes = loteService.detectarLotesPendientes(lotes, manzanaCodigo);
      
      if (lotesPendientes.length > 0) {
        // Hay lotes pendientes, mostrar selector
        setLotesPendientes(lotesPendientes);
        setIsPendienteSelectorOpen(true);
      } else {
        // No hay lotes pendientes, crear lote normal
        setLoteSeleccionado(null);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error al detectar lotes pendientes:', error);
      // En caso de error, proceder con creación normal
      setLoteSeleccionado(null);
      setIsModalOpen(true);
    }
  };

  const handleLotePendienteSeleccionado = (lotePendiente: LotePendiente) => {
    // Crear lote con código específico
    setLotePendienteSeleccionado(lotePendiente);
    setLoteSeleccionado(null);
    setIsModalOpen(true);
  };

  const handleContinuarNormal = () => {
    // Continuar con creación normal (ignorar huecos)
    setLotePendienteSeleccionado(null);
    setLoteSeleccionado(null);
    setIsModalOpen(true);
  };

  const handleEditarLote = (lote: LoteWithRelations) => {
    setLoteSeleccionado(lote);
    setIsModalOpen(true);
  };

  const handleEliminarLote = (lote: LoteWithRelations) => {
    setLoteToDelete(lote);
    setIsDeleteAlertOpen(true);
  };

  const handleCambiarEstadoInactivo = async (lote: LoteWithRelations) => {
    setLoteToToggleStatus(lote);
    setIsToggleStatusAlertOpen(true);
  };

  const handleReactivarLote = async (lote: LoteWithRelations) => {
    setLoteToToggleStatus(lote);
    setIsToggleStatusAlertOpen(true);
  };

  const handleLoteDeleted = () => {
    cargarLotes();
    onLotesChanged?.();
  };

  const toggleLoteExpansion = (loteId: string) => {
    const newExpanded = new Set(expandedLotes);
    if (newExpanded.has(loteId)) {
      newExpanded.delete(loteId);
    } else {
      newExpanded.add(loteId);
    }
    setExpandedLotes(newExpanded);
  };

  const handleModalSuccess = () => {
    cargarLotes();
    onLotesChanged?.();
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800';
      case 'RESERVADO':
        return 'bg-yellow-100 text-yellow-800';
      case 'VENDIDO':
        return 'bg-red-100 text-red-800';
      case 'ENTREGADO':
        return 'bg-blue-100 text-blue-800';
      case 'INACTIVO':
        return 'bg-gray-100 text-gray-800';
      case 'RETIRADO':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return 'Disponible';
      case 'RESERVADO':
        return 'Reservado';
      case 'VENDIDO':
        return 'Vendido';
      case 'ENTREGADO':
        return 'Entregado';
      case 'INACTIVO':
        return 'Inactivo';
      case 'RETIRADO':
        return 'Retirado';
      default:
        return estado;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isLoteInactivo = (estado: EstadoLote) => {
    return estado === 'INACTIVO' || estado === 'RETIRADO';
  };

  return (
    <>
      <Card className="w-full border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">
              Lotes ({lotes.length})
            </CardTitle>
            {!manzanaIsActive && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                Manzana Inactiva
              </Badge>
            )}
          </div>
          {canManageLotes && (
            <Button
              variant="outline"
              size="sm"
              disabled={!manzanaIsActive}
              className={`bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 ${
                !manzanaIsActive ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleCrearLote}
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
                {!canManageLotes && (
                  <p className="text-sm mt-2">
                    Solo los Project Managers, Gerentes Generales y Super Admins pueden crear lotes.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {lotes.map((lote) => {
                const isExpanded = expandedLotes.has(lote.id);
                
                return (
                  <div
                    key={lote.id}
                    className={`p-4 border-2 rounded-lg transition-colors bg-card ${
                      isLoteInactivo(lote.estado) ? 'opacity-60 bg-gray-50' : 'hover:border-border'
                    }`}
                  >
                    {/* Header con información básica */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Home className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{lote.codigo}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEstadoColor(lote.estado)}>
                          {getEstadoLabel(lote.estado)}
                        </Badge>
                      </div>
                    </div>

                    {/* Información básica siempre visible */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {lote.precio && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            <span className="font-medium">S/. {lote.precio.toLocaleString()}</span>
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          <span className="font-medium">{lote.area} m²</span>
                        </span>
                      </div>
                    </div>

                    {/* Coordenadas en el cuerpo */}
                    {(lote.latitud && lote.longitud) && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="text-sm">
                            <span className="font-medium">Coordenadas:</span>
                            <span className="text-muted-foreground ml-1">
                              {lote.latitud.toFixed(6)}, {lote.longitud.toFixed(6)}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Botón para expandir/contraer */}
                    <div className="flex justify-center mb-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLoteExpansion(lote.id)}
                        className="text-primary hover:bg-primary/10"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Ocultar detalles
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Ver detalles
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Contenido expandido */}
                    {isExpanded && (
                      <div className="border-t pt-4 space-y-4">
                        {/* Linderos */}
                        {(lote.linderoFrente || lote.linderoFondo || lote.linderoIzquierda || lote.linderoDerecha) && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-blue-600" />
                              Linderos
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {lote.linderoFrente && (
                                <div><span className="font-medium">Frente:</span> {lote.linderoFrente}</div>
                              )}
                              {lote.linderoFondo && (
                                <div><span className="font-medium">Fondo:</span> {lote.linderoFondo}</div>
                              )}
                              {lote.linderoIzquierda && (
                                <div><span className="font-medium">Izquierda:</span> {lote.linderoIzquierda}</div>
                              )}
                              {lote.linderoDerecha && (
                                <div><span className="font-medium">Derecha:</span> {lote.linderoDerecha}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dimensiones */}
                        {(lote.dimensionFrente || lote.dimensionFondo || lote.dimensionIzquierda || lote.dimensionDerecha) && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Ruler className="h-4 w-4 text-green-600" />
                              Dimensiones
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {lote.dimensionFrente && (
                                <div><span className="font-medium">Frente:</span> {lote.dimensionFrente}m</div>
                              )}
                              {lote.dimensionFondo && (
                                <div><span className="font-medium">Fondo:</span> {lote.dimensionFondo}m</div>
                              )}
                              {lote.dimensionIzquierda && (
                                <div><span className="font-medium">Izquierda:</span> {lote.dimensionIzquierda}m</div>
                              )}
                              {lote.dimensionDerecha && (
                                <div><span className="font-medium">Derecha:</span> {lote.dimensionDerecha}m</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Características adicionales */}
                        {(lote.tipoTerreno || lote.servicios || lote.caracteristicas) && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Info className="h-4 w-4 text-purple-600" />
                              Características
                            </h5>
                            <div className="space-y-1 text-xs">
                              {lote.tipoTerreno && (
                                <div><span className="font-medium">Tipo de terreno:</span> {lote.tipoTerreno}</div>
                              )}
                              {lote.servicios && (
                                <div><span className="font-medium">Servicios:</span> {lote.servicios}</div>
                              )}
                              {lote.caracteristicas && (
                                <div><span className="font-medium">Características:</span> {lote.caracteristicas}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Descripción y observaciones */}
                        {(lote.descripcion || lote.observaciones) && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4 text-orange-600" />
                              Información adicional
                            </h5>
                            <div className="space-y-1 text-xs">
                              {lote.descripcion && (
                                <div>
                                  <span className="font-medium">Descripción:</span>
                                  <p className="text-muted-foreground mt-1">{lote.descripcion}</p>
                                </div>
                              )}
                              {lote.observaciones && (
                                <div>
                                  <span className="font-medium">Observaciones:</span>
                                  <p className="text-muted-foreground mt-1">{lote.observaciones}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Información de auditoría */}
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            Información de auditoría
                          </h5>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="font-medium">Creado:</span> {formatDate(lote.createdAt)}
                              {lote.creadoPorUsuario && (
                                <span className="text-muted-foreground ml-2">
                                  por {lote.creadoPorUsuario.nombre}
                                </span>
                              )}
                            </div>
                            {lote.updatedAt && lote.updatedAt !== lote.createdAt && (
                              <div>
                                <span className="font-medium">Actualizado:</span> {formatDate(lote.updatedAt)}
                                {lote.actualizadoPorUsuario && (
                                  <span className="text-muted-foreground ml-2">
                                    por {lote.actualizadoPorUsuario.nombre}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    {canManageLotes && (
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!manzanaIsActive}
                          className={`hover:bg-green-50 hover:text-green-600 ${
                            !manzanaIsActive ? 'opacity-50 cursor-not-allowed' : 'text-gray-600'
                          }`}
                          onClick={() => handleEditarLote(lote)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        {lote.estado !== 'INACTIVO' && lote.estado !== 'RETIRADO' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!manzanaIsActive}
                            className={`hover:bg-gray-50 hover:text-gray-600 ${
                              !manzanaIsActive ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => handleCambiarEstadoInactivo(lote)}
                          >
                            <PowerOff className="h-4 w-4 mr-1" />
                            Inactivar
                          </Button>
                        )}
                        {lote.estado === 'INACTIVO' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!manzanaIsActive}
                            className={`hover:bg-green-50 hover:text-green-600 ${
                              !manzanaIsActive ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => handleReactivarLote(lote)}
                          >
                            <Power className="h-4 w-4 mr-1" />
                            Reactivar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!manzanaIsActive}
                          className={`hover:bg-red-50 hover:text-red-600 ${
                            !manzanaIsActive ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          onClick={() => handleEliminarLote(lote)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setLotePendienteSeleccionado(null);
        }}
        manzanaId={manzanaId}
        manzanaCodigo={manzanaCodigo}
        proyectoId={proyectoId}
        lote={loteSeleccionado || undefined}
        lotePendiente={lotePendienteSeleccionado || undefined}
        onSuccess={handleModalSuccess}
      />

      <DeleteLoteAlert
        isOpen={isDeleteAlertOpen}
        onClose={() => setIsDeleteAlertOpen(false)}
        lote={loteToDelete}
        proyectoId={proyectoId}
        onLoteDeleted={handleLoteDeleted}
      />

      <LotePendienteSelector
        lotesPendientes={lotesPendientes}
        isOpen={isPendienteSelectorOpen}
        onClose={() => setIsPendienteSelectorOpen(false)}
        onLoteSeleccionado={handleLotePendienteSeleccionado}
        onContinuarNormal={handleContinuarNormal}
      />

      <ToggleLoteStatusAlert
        isOpen={isToggleStatusAlertOpen}
        onClose={() => {
          setIsToggleStatusAlertOpen(false);
          setLoteToToggleStatus(null);
        }}
        lote={loteToToggleStatus}
        proyectoId={proyectoId}
        onStatusChanged={handleModalSuccess}
      />
    </>
  );
}

export default LoteCard; 