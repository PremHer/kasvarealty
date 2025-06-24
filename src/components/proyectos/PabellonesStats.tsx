'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PabellonEstadisticas } from '@/types/cementerio'
import { FiMapPin, FiHome, FiDollarSign, FiUsers, FiGrid } from 'react-icons/fi'

interface PabellonesStatsProps {
  proyectoId: string
  refreshTrigger: number
}

export default function PabellonesStats({ proyectoId, refreshTrigger }: PabellonesStatsProps) {
  const [stats, setStats] = useState<PabellonEstadisticas | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/proyectos/${proyectoId}/pabellones/estadisticas`)
        if (!response.ok) throw new Error('Error al cargar estadísticas')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [proyectoId, refreshTrigger])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No se pudieron cargar las estadísticas</p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pabellones</CardTitle>
          <FiGrid className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPabellones}</div>
          <p className="text-xs text-muted-foreground">
            Pabellones activos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
          <FiHome className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUnidades}</div>
          <p className="text-xs text-muted-foreground">
            {stats.unidadesDisponibles} disponibles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado de Unidades</CardTitle>
          <FiUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unidadesVendidas}</div>
          <p className="text-xs text-muted-foreground">
            {stats.unidadesReservadas} reservadas, {stats.unidadesOcupadas} ocupadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <FiDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalPrecio)}</div>
          <p className="text-xs text-muted-foreground">
            Promedio: {formatCurrency(stats.precioPromedio)}
          </p>
        </CardContent>
      </Card>

      {/* Distribución por tipo */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg">Distribución por Tipo de Unidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiMapPin className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Parcelas</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.distribucionPorTipo.PARCELA}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiHome className="h-5 w-5 text-green-600" />
                <span className="font-medium">Nichos</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.distribucionPorTipo.NICHO}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <FiGrid className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Mausoleos</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.distribucionPorTipo.MAUSOLEO}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 