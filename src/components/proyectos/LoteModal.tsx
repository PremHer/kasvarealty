'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LoteFormData, LoteWithRelations } from '@/types/lote';
import { LotePendiente } from '@/lib/services/loteService';

interface LoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  manzanaId: string;
  manzanaCodigo: string;
  proyectoId: string;
  lote?: LoteWithRelations;
  lotePendiente?: LotePendiente;
  onSuccess: () => void;
}

const estadosLote = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'bg-green-100 text-green-800' },
  { value: 'RESERVADO', label: 'Reservado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'VENDIDO', label: 'Vendido', color: 'bg-red-100 text-red-800' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-blue-100 text-blue-800' },
  { value: 'INACTIVO', label: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
  { value: 'RETIRADO', label: 'Retirado', color: 'bg-orange-100 text-orange-800' }
];

const tiposTerreno = [
  'Plano',
  'Inclinado',
  'Mixto',
  'Elevado',
  'Bajo'
];

const serviciosDisponibles = [
  'Agua potable',
  'Luz eléctrica',
  'Desagüe',
  'Internet',
  'Teléfono',
  'Gas natural',
  'Pavimentación',
  'Alumbrado público'
];

export default function LoteModal({
  isOpen,
  onClose,
  manzanaId,
  manzanaCodigo,
  proyectoId,
  lote,
  lotePendiente,
  onSuccess
}: LoteModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState<LoteFormData>({
    codigo: '',
    numero: '',
    precio: '',
    latitud: '',
    longitud: '',
    linderoFrente: '',
    linderoFondo: '',
    linderoIzquierda: '',
    linderoDerecha: '',
    dimensionFrente: '',
    dimensionFondo: '',
    dimensionIzquierda: '',
    dimensionDerecha: '',
    descripcion: ''
  });

  const [estado, setEstado] = useState('DISPONIBLE');

  // Verificar permisos
  const canEditLotes = session?.user?.role && [
    'SUPER_ADMIN',
    'GERENTE_GENERAL',
    'PROJECT_MANAGER'
  ].includes(session.user.role);

  useEffect(() => {
    if (lote) {
      setFormData({
        codigo: lote.codigo || '',
        numero: lote.numero || '',
        precio: lote.precio?.toString() || '',
        latitud: lote.latitud?.toString() || '',
        longitud: lote.longitud?.toString() || '',
        linderoFrente: lote.linderoFrente || '',
        linderoFondo: lote.linderoFondo || '',
        linderoIzquierda: lote.linderoIzquierda || '',
        linderoDerecha: lote.linderoDerecha || '',
        dimensionFrente: lote.dimensionFrente?.toString() || '',
        dimensionFondo: lote.dimensionFondo?.toString() || '',
        dimensionIzquierda: lote.dimensionIzquierda?.toString() || '',
        dimensionDerecha: lote.dimensionDerecha?.toString() || '',
        descripcion: lote.descripcion || ''
      });
      setEstado(lote.estado);
    } else if (lotePendiente) {
      // Configurar para lote pendiente
      setFormData({
        codigo: lotePendiente.codigo,
        numero: lotePendiente.numero,
        precio: '',
        latitud: '',
        longitud: '',
        linderoFrente: '',
        linderoFondo: '',
        linderoIzquierda: '',
        linderoDerecha: '',
        dimensionFrente: '',
        dimensionFondo: '',
        dimensionIzquierda: '',
        dimensionDerecha: '',
        descripcion: ''
      });
      setEstado('DISPONIBLE');
    } else {
      // Reset form for new lote
      setFormData({
        codigo: '',
        numero: '',
        precio: '',
        latitud: '',
        longitud: '',
        linderoFrente: '',
        linderoFondo: '',
        linderoIzquierda: '',
        linderoDerecha: '',
        dimensionFrente: '',
        dimensionFondo: '',
        dimensionIzquierda: '',
        dimensionDerecha: '',
        descripcion: ''
      });
      setEstado('DISPONIBLE');
    }
  }, [lote, lotePendiente]);

  const handleInputChange = (field: keyof LoteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEditLotes) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para crear/editar lotes.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const url = lote 
        ? `/api/proyectos/${proyectoId}/lotes/${lote.id}`
        : `/api/proyectos/${proyectoId}/lotes`;
      
      const method = lote ? 'PUT' : 'POST';
      
      // Para crear un nuevo lote, no enviamos código ni número (se generan automáticamente)
      const requestData = lote 
        ? {
            ...formData,
            manzanaId,
            estado
          }
        : lotePendiente
        ? {
            ...formData,
            manzanaId,
            codigo: lotePendiente.codigo,
            numero: lotePendiente.numero,
            estado: 'DISPONIBLE'
          }
        : {
            ...formData,
            manzanaId,
            // No enviamos código ni número para nuevos lotes
            estado: 'DISPONIBLE'
          };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      const result = await response.json();
      
      toast({
        title: lote ? 'Lote actualizado' : 'Lote creado',
        description: lote 
          ? 'El lote se ha actualizado correctamente.'
          : `Lote ${result.codigo} creado exitosamente.`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar la solicitud.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calcularArea = () => {
    const frente = parseFloat(formData.dimensionFrente) || 0;
    const fondo = parseFloat(formData.dimensionFondo) || 0;
    const izquierda = parseFloat(formData.dimensionIzquierda) || 0;
    const derecha = parseFloat(formData.dimensionDerecha) || 0;

    // Si tenemos las cuatro dimensiones, calculamos área usando promedios
    if (frente && fondo && izquierda && derecha) {
      // Si es rectangular (frente = derecha y fondo = izquierda)
      if (frente === derecha && izquierda === fondo) {
        return (frente * fondo).toFixed(2);
      } else {
        // Para lotes irregulares, usamos el promedio de las dimensiones opuestas
        const largo = (frente + fondo) / 2;
        const ancho = (izquierda + derecha) / 2;
        const area = largo * ancho;
        return area.toFixed(2);
      }
    }
    
    // Si tenemos frente y fondo, usamos esos (área rectangular)
    if (frente && fondo) {
      return (frente * fondo).toFixed(2);
    }
    
    // Si solo tenemos frente e izquierda
    if (frente && izquierda) {
      return (frente * izquierda).toFixed(2);
    }
    
    return '0.00';
  };

  const obtenerSiguienteNumero = async () => {
    if (lote) {
      return lote.numero;
    }
    
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes?manzanaId=${manzanaId}`);
      if (response.ok) {
        const lotes = await response.json();
        const ultimoLote = lotes.length > 0 ? lotes[lotes.length - 1] : null;
        
        if (ultimoLote) {
          const ultimoNumero = parseInt(ultimoLote.numero);
          const siguienteNumero = ultimoNumero + 1;
          return siguienteNumero.toString().padStart(2, '0');
        } else {
          return '01';
        }
      }
    } catch (error) {
      console.error('Error al obtener siguiente número:', error);
    }
    
    return '01';
  };

  const [siguienteNumero, setSiguienteNumero] = useState<string>('01');

  useEffect(() => {
    if (!lote) {
      obtenerSiguienteNumero().then(numero => setSiguienteNumero(numero));
    }
  }, [lote, manzanaId, proyectoId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {lote ? 'Editar Lote' : lotePendiente ? 'Crear Lote Pendiente' : 'Nuevo Lote'}
              </h2>
              <p className="text-gray-600">
                {lote 
                  ? `Editando lote ${lote.numero} en manzana ${manzanaCodigo}` 
                  : lotePendiente
                  ? `Creando lote ${lotePendiente.codigo} en manzana ${manzanaCodigo}`
                  : `Creando lote ${siguienteNumero} en manzana ${manzanaCodigo}`
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>

          {lotePendiente && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="font-medium text-orange-900">
                  Creando lote pendiente: {lotePendiente.codigo}
                </span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Este lote se creará con el código {lotePendiente.codigo} para llenar un hueco en la secuencia.
              </p>
            </div>
          )}

          {!canEditLotes && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                No tienes permisos para crear/editar lotes. Solo los Project Managers, 
                Gerentes Generales y Super Admins pueden realizar esta acción.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="dimensiones">Dimensiones</TabsTrigger>
                <TabsTrigger value="linderos">Linderos</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="precio">Precio (S/.)</Label>
                      <Input
                        id="precio"
                        type="number"
                        step="0.01"
                        value={formData.precio}
                        onChange={(e) => handleInputChange('precio', e.target.value)}
                        placeholder="0.00"
                        disabled={!canEditLotes}
                      />
                    </div>

                    <div>
                      <Label htmlFor="latitud">Latitud</Label>
                      <Input
                        id="latitud"
                        type="number"
                        step="0.000001"
                        value={formData.latitud}
                        onChange={(e) => handleInputChange('latitud', e.target.value)}
                        placeholder="-12.345678"
                        disabled={!canEditLotes}
                      />
                    </div>

                    <div>
                      <Label htmlFor="longitud">Longitud</Label>
                      <Input
                        id="longitud"
                        type="number"
                        step="0.000001"
                        value={formData.longitud}
                        onChange={(e) => handleInputChange('longitud', e.target.value)}
                        placeholder="-78.901234"
                        disabled={!canEditLotes}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => handleInputChange('descripcion', e.target.value)}
                      placeholder="Descripción general del lote..."
                      className="h-[120px]"
                      disabled={!canEditLotes}
                    />
                  </div>
                </div>

                <div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-green-900">Estado por defecto: Disponible</span>
                      </div>
                      <p className="text-sm text-green-700">
                        El lote se creará con estado "Disponible" por defecto.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dimensiones" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Dimensiones (metros)</CardTitle>
                    <CardDescription>
                      Ingresa las dimensiones del lote. El área se calculará automáticamente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dimensionFrente">Frente</Label>
                        <Input
                          id="dimensionFrente"
                          type="number"
                          step="0.01"
                          value={formData.dimensionFrente}
                          onChange={(e) => handleInputChange('dimensionFrente', e.target.value)}
                          placeholder="0.00"
                          disabled={!canEditLotes}
                        />
                      </div>

                      <div>
                        <Label htmlFor="dimensionFondo">Fondo</Label>
                        <Input
                          id="dimensionFondo"
                          type="number"
                          step="0.01"
                          value={formData.dimensionFondo}
                          onChange={(e) => handleInputChange('dimensionFondo', e.target.value)}
                          placeholder="0.00"
                          disabled={!canEditLotes}
                        />
                      </div>

                      <div>
                        <Label htmlFor="dimensionIzquierda">Izquierda</Label>
                        <Input
                          id="dimensionIzquierda"
                          type="number"
                          step="0.01"
                          value={formData.dimensionIzquierda}
                          onChange={(e) => handleInputChange('dimensionIzquierda', e.target.value)}
                          placeholder="0.00"
                          disabled={!canEditLotes}
                        />
                      </div>

                      <div>
                        <Label htmlFor="dimensionDerecha">Derecha</Label>
                        <Input
                          id="dimensionDerecha"
                          type="number"
                          step="0.01"
                          value={formData.dimensionDerecha}
                          onChange={(e) => handleInputChange('dimensionDerecha', e.target.value)}
                          placeholder="0.00"
                          disabled={!canEditLotes}
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-blue-900">Área calculada:</span>
                        <span className="text-lg font-bold text-blue-900">
                          {calcularArea()} m²
                        </span>
                      </div>
                      <div className="text-sm text-blue-700">
                        {(() => {
                          const frente = parseFloat(formData.dimensionFrente) || 0;
                          const fondo = parseFloat(formData.dimensionFondo) || 0;
                          const izquierda = parseFloat(formData.dimensionIzquierda) || 0;
                          const derecha = parseFloat(formData.dimensionDerecha) || 0;
                          
                          if (frente && fondo && izquierda && derecha) {
                            if (frente === derecha && izquierda === fondo) {
                              return "Cálculo rectangular: Frente × Fondo";
                            } else {
                              return "Cálculo promedio: ((Frente + Fondo) / 2) × ((Izquierda + Derecha) / 2)";
                            }
                          } else if (frente && fondo) {
                            return "Cálculo rectangular: Frente × Fondo";
                          } else if (frente && izquierda) {
                            return "Estimación: Frente × Izquierda";
                          } else {
                            return "Ingresa las dimensiones para calcular el área";
                          }
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="linderos" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Linderos</CardTitle>
                    <CardDescription>
                      Descripción de los límites del lote
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="linderoFrente">Frente</Label>
                      <Input
                        id="linderoFrente"
                        value={formData.linderoFrente}
                        onChange={(e) => handleInputChange('linderoFrente', e.target.value)}
                        placeholder="Ej: Calle principal"
                        disabled={!canEditLotes}
                      />
                    </div>

                    <div>
                      <Label htmlFor="linderoFondo">Fondo</Label>
                      <Input
                        id="linderoFondo"
                        value={formData.linderoFondo}
                        onChange={(e) => handleInputChange('linderoFondo', e.target.value)}
                        placeholder="Ej: Lote vecino"
                        disabled={!canEditLotes}
                      />
                    </div>

                    <div>
                      <Label htmlFor="linderoIzquierda">Izquierda</Label>
                      <Input
                        id="linderoIzquierda"
                        value={formData.linderoIzquierda}
                        onChange={(e) => handleInputChange('linderoIzquierda', e.target.value)}
                        placeholder="Ej: Lote vecino"
                        disabled={!canEditLotes}
                      />
                    </div>

                    <div>
                      <Label htmlFor="linderoDerecha">Derecha</Label>
                      <Input
                        id="linderoDerecha"
                        value={formData.linderoDerecha}
                        onChange={(e) => handleInputChange('linderoDerecha', e.target.value)}
                        placeholder="Ej: Lote vecino"
                        disabled={!canEditLotes}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !canEditLotes}
              >
                {isLoading ? 'Guardando...' : (lote ? 'Actualizar Lote' : 'Crear Lote')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 