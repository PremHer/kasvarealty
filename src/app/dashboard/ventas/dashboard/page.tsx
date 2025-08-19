'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiUsers, 
  FiTarget,
  FiBarChart,
  FiCalendar,
  FiMapPin,
  FiHome
} from 'react-icons/fi'

interface MetricasVentas {
  totalVentas: number
  totalComisiones: number
  cantidadVentas: number
  cantidadVendedores: number
  promedioVenta: number
  promedioComision: number
  ventasLotes: number
  ventasUnidadesCementerio: number
  ventasPorMes: Array<{
    mes: string
    total: number
    cantidad: number
  }>
  topVendedores: Array<{
    vendedorId: string
    nombre: string
    totalVentas: number
    cantidadVentas: number
    comisiones: number
  }>
  ventasPorTipo: {
    lotes: number
    unidadesCementerio: number
  }
}

export default function DashboardVentasPage() {
  const [metricas, setMetricas] = useState<MetricasVentas | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const { toast } = useToast()

  // Cargar métricas
  const fetchMetricas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ periodo })
      
      const response = await fetch(`/api/ventas/stats?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMetricas(data)
      } else {
        throw new Error('Error al cargar métricas')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar las métricas de ventas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetricas()
  }, [periodo])

  const getPeriodoDisplay = (periodo: string) => {
    switch (periodo) {
      case 'mes': return 'Este Mes'
      case 'trimestre': return 'Este Trimestre'
      case 'año': return 'Este Año'
      default: return 'Este Mes'
    }
  }

  const getTendenciaColor = (valor: number, anterior: number) => {
    if (valor > anterior) return 'text-green-600'
    if (valor < anterior) return 'text-red-600'
    return 'text-gray-600'
  }

  const getTendenciaIcon = (valor: number, anterior: number) => {
    if (valor > anterior) return <FiTrendingUp className="h-4 w-4 text-green-600" />
    if (valor < anterior) return <FiTrendingDown className="h-4 w-4 text-red-600" />
    return <FiBarChart className="h-4 w-4 text-gray-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Cargando métricas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard de Ventas</h1>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Este Mes</SelectItem>
            <SelectItem value="trimestre">Este Trimestre</SelectItem>
            <SelectItem value="año">Este Año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tarjetas de métricas principales */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
              <FiDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metricas.totalVentas)}</div>
              <p className="text-xs text-muted-foreground">
                {metricas.cantidadVentas} transacciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
              <FiTrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metricas.totalComisiones)}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {formatCurrency(metricas.promedioComision)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedores Activos</CardTitle>
              <FiUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas.cantidadVendedores}</div>
              <p className="text-xs text-muted-foreground">
                Con ventas en {getPeriodoDisplay(periodo).toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Venta</CardTitle>
              <FiBarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metricas.promedioVenta)}</div>
              <p className="text-xs text-muted-foreground">
                Valor promedio por transacción
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Distribución por tipo de venta */}
      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiHome className="h-5 w-5" />
                Ventas por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="h-4 w-4 text-blue-600" />
                    <span>Lotes</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{metricas.ventasLotes}</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(metricas.ventasLotes * metricas.promedioVenta)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FiHome className="h-4 w-4 text-green-600" />
                    <span>Unidades Cementerio</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{metricas.ventasUnidadesCementerio}</div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(metricas.ventasUnidadesCementerio * metricas.promedioVenta)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiUsers className="h-5 w-5" />
                Top Vendedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metricas.topVendedores.slice(0, 5).map((vendedor, index) => (
                  <div key={vendedor.vendedorId} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{vendedor.nombre}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(vendedor.totalVentas)}</div>
                      <div className="text-sm text-gray-500">{vendedor.cantidadVentas} ventas</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico de ventas por mes */}
      {metricas && metricas.ventasPorMes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiCalendar className="h-5 w-5" />
              Ventas por Mes - {getPeriodoDisplay(periodo)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metricas.ventasPorMes.map((mes, index) => (
                <div key={mes.mes} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{mes.mes}</span>
                    <Badge variant="outline">{mes.cantidad} ventas</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(mes.total)}</div>
                    {index > 0 && (
                      <div className={`text-sm ${getTendenciaColor(mes.total, metricas.ventasPorMes[index - 1].total)}`}>
                        {getTendenciaIcon(mes.total, metricas.ventasPorMes[index - 1].total)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de rendimiento (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiBarChart className="h-5 w-5" />
            Análisis de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <FiBarChart className="h-12 w-12 mx-auto mb-2" />
              <p>Gráfico de rendimiento</p>
              <p className="text-sm">(Implementar con librería de gráficos)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/dashboard/ventas">Ver Todas las Ventas</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/vendedores/estadisticas">Estadísticas de Vendedores</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/vendedores">Gestionar Vendedores</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 