'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MapPin, 
  Calculator, 
  DollarSign,
  TrendingUp,
  Package,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';

interface ManzanasStats {
  totalManzanas: number;
  totalArea: number;
  totalLotes: number;
  lotesDisponibles: number;
  lotesVendidos: number;
  lotesReservados: number;
}

interface ManzanasStatsProps {
  proyectoId: string;
  refreshTrigger?: number;
}

export default function ManzanasStats({ proyectoId, refreshTrigger }: ManzanasStatsProps) {
  const [stats, setStats] = useState<ManzanasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    cargarEstadisticas();
  }, [proyectoId, refreshTrigger]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proyectos/${proyectoId}/manzanas/estadisticas`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas de Manzanas
          </CardTitle>
          <Button variant="ghost" size="sm" disabled>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas de Manzanas
          </CardTitle>
          <Button variant="ghost" size="sm" disabled>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            No se pudieron cargar las estadísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  const porcentajeVendidos = stats.totalLotes > 0 
    ? ((stats.lotesVendidos / stats.totalLotes) * 100).toFixed(1)
    : '0';

  const porcentajeReservados = stats.totalLotes > 0 
    ? ((stats.lotesReservados / stats.totalLotes) * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estadísticas de Manzanas
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:bg-muted/50"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Manzanas</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalManzanas}</div>
                <p className="text-xs text-muted-foreground">
                  Manzanas activas en el proyecto
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Área Total</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalArea.toFixed(2)} m²
                </div>
                <p className="text-xs text-muted-foreground">
                  Área total de todas las manzanas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLotes}</div>
                <p className="text-xs text-muted-foreground">
                  Lotes en todas las manzanas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lotes Disponibles</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.lotesDisponibles}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lotes disponibles para venta
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lotes Vendidos</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.lotesVendidos}
                </div>
                <p className="text-xs text-muted-foreground">
                  {porcentajeVendidos}% del total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lotes Reservados</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.lotesReservados}
                </div>
                <p className="text-xs text-muted-foreground">
                  {porcentajeReservados}% del total
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 