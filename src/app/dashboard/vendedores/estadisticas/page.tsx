'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target,
  BarChart3,
  Calendar
} from 'lucide-react'

interface EstadisticaVendedor {
  vendedorId: string
  cantidadVentas: number
  totalVentas: number
  totalComisiones: number
  promedioVenta: number
  promedioComision: number
  ventasLotes: number
  ventasUnidadesCementerio: number
  vendedor: {
    nombre: string
    email: string
  } | null
  perfil: {
    codigoVendedor: string
    especialidad: string
    metaMensual: number | null
    metaAnual: number | null
  } | null
  porcentajeCumplimiento: number | null
}

interface TotalesGenerales {
  totalVentas: number
  totalComisiones: number
  cantidadVentas: number
  cantidadVendedores: number
  promedioVenta: number
  promedioComision: number
}

export default function EstadisticasVendedoresPage() {
  const [estadisticas, setEstadisticas] = useState<EstadisticaVendedor[]>([])
  const [totales, setTotales] = useState<TotalesGenerales | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [vendedorId, setVendedorId] = useState('todos')
  const [vendedores, setVendedores] = useState<Array<{id: string, nombre: string}>>([])
  const { toast } = useToast()

  // Cargar estadísticas
  const fetchEstadisticas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        periodo,
        ...(vendedorId && vendedorId !== 'todos' && { vendedorId })
      })
      
      const response = await fetch(`/api/vendedores/estadisticas?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data.estadisticas)
        setTotales(data.totales)
      } else {
        throw new Error('Error al cargar estadísticas')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar las estadísticas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Cargar vendedores para filtro
  const fetchVendedores = async () => {
    try {
      const response = await fetch('/api/vendedores')
      if (response.ok) {
        const data = await response.json()
        setVendedores(data.vendedores.map((v: any) => ({
          id: v.usuario.id,
          nombre: v.usuario.nombre
        })))
      }
    } catch (error) {
      console.error('Error al cargar vendedores:', error)
    }
  }

  useEffect(() => {
    fetchVendedores()
  }, [])

  useEffect(() => {
    fetchEstadisticas()
  }, [periodo, vendedorId])

  const getPeriodoDisplay = (periodo: string) => {
    switch (periodo) {
      case 'mes': return 'Este Mes'
      case 'trimestre': return 'Este Trimestre'
      case 'año': return 'Este Año'
      default: return 'Este Mes'
    }
  }

  const getCumplimientoColor = (porcentaje: number | null) => {
    if (!porcentaje) return 'gray'
    if (porcentaje >= 100) return 'green'
    if (porcentaje >= 80) return 'yellow'
    if (porcentaje >= 60) return 'orange'
    return 'red'
  }

  const getCumplimientoText = (porcentaje: number | null) => {
    if (!porcentaje) return 'Sin meta'
    if (porcentaje >= 100) return 'Meta cumplida'
    if (porcentaje >= 80) return 'Cerca de la meta'
    if (porcentaje >= 60) return 'Progreso regular'
    return 'Necesita mejorar'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Estadísticas de Vendedores</h1>
        <div className="flex gap-2">
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
          <Select value={vendedorId} onValueChange={setVendedorId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos los vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los vendedores</SelectItem>
              {vendedores.map((vendedor) => (
                <SelectItem key={vendedor.id} value={vendedor.id}>
                  {vendedor.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      {totales && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totales.totalVentas.toString())}</div>
              <p className="text-xs text-muted-foreground">
                {totales.cantidadVentas} ventas realizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totales.totalComisiones.toString())}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {formatCurrency(totales.promedioComision.toString())}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedores Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totales.cantidadVendedores}</div>
              <p className="text-xs text-muted-foreground">
                Con ventas en {getPeriodoDisplay(periodo).toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Venta</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totales.promedioVenta.toString())}</div>
              <p className="text-xs text-muted-foreground">
                Valor promedio por transacción
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de estadísticas por vendedor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rendimiento por Vendedor - {getPeriodoDisplay(periodo)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Vendedor</th>
                  <th className="text-left py-3 px-4 font-medium">Código</th>
                  <th className="text-left py-3 px-4 font-medium">Ventas</th>
                  <th className="text-left py-3 px-4 font-medium">Total Ventas</th>
                  <th className="text-left py-3 px-4 font-medium">Comisiones</th>
                  <th className="text-left py-3 px-4 font-medium">Promedio</th>
                  <th className="text-left py-3 px-4 font-medium">Cumplimiento</th>
                  <th className="text-left py-3 px-4 font-medium">Especialidad</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((stat, index) => (
                  <tr key={stat.vendedorId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{stat.vendedor?.nombre || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{stat.vendedor?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {stat.perfil?.codigoVendedor || 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-center">
                        <div className="font-medium">{stat.cantidadVentas}</div>
                        <div className="text-xs text-gray-500">
                          {stat.ventasLotes} lotes, {stat.ventasUnidadesCementerio} unidades
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(stat.totalVentas.toString())}
                    </td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      {formatCurrency(stat.totalComisiones.toString())}
                    </td>
                    <td className="py-3 px-4">
                      {formatCurrency(stat.promedioVenta.toString())}
                    </td>
                    <td className="py-3 px-4">
                      {stat.porcentajeCumplimiento !== null ? (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getCumplimientoColor(stat.porcentajeCumplimiento) === 'green' ? 'default' : 
                                   getCumplimientoColor(stat.porcentajeCumplimiento) === 'yellow' ? 'secondary' : 'destructive'}
                          >
                            {stat.porcentajeCumplimiento}%
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {getCumplimientoText(stat.porcentajeCumplimiento)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin meta</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {stat.perfil?.especialidad || 'N/A'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {estadisticas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay estadísticas disponibles para el período seleccionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de rendimiento (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Gráfico de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Gráfico de rendimiento</p>
              <p className="text-sm">(Implementar con librería de gráficos)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 