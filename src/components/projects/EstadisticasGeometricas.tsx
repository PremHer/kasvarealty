'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FiMap, 
  FiGrid, 
  FiHome, 
  FiSquare, 
  FiCheckCircle, 
  FiAlertCircle,
  FiTrendingUp,
  FiDatabase
} from 'react-icons/fi'

interface EstadisticasGeometricasProps {
  proyectoId: string
  refreshTrigger?: number
}

interface EstadisticasData {
  estadisticas: {
    total_area: number
    total_lotes: number
    lotes_con_geometria: number
    manzanas_con_geometria: number
  }
  resumen: {
    totalManzanas: number
    totalLotes: number
    manzanasConGeometria: number
    lotesConGeometria: number
    porcentajeManzanasConGeometria: string
    porcentajeLotesConGeometria: string
  }
}

export default function EstadisticasGeometricas({ proyectoId, refreshTrigger }: EstadisticasGeometricasProps) {
  const { data, isLoading, error } = useQuery<EstadisticasData>({
    queryKey: ['estadisticas-geometricas', proyectoId, refreshTrigger],
    queryFn: async () => {
      const response = await fetch(`/api/proyectos/${proyectoId}/estadisticas-geometricas`)
      if (!response.ok) throw new Error('Error al cargar estadísticas')
      return response.json()
    },
    enabled: !!proyectoId
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiDatabase className="h-5 w-5" />
            Estadísticas Geométricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <FiAlertCircle className="h-5 w-5" />
            Error al cargar estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            No se pudieron cargar las estadísticas geométricas del proyecto.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { estadisticas, resumen } = data

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiDatabase className="h-5 w-5" />
            Estadísticas Geométricas PostGIS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Área Total */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Área Total</span>
              </div>
              <div className="text-2xl font-bold">
                {estadisticas.total_area ? `${(estadisticas.total_area / 10000).toFixed(2)} ha` : 'N/A'}
              </div>
              <p className="text-xs text-gray-500">
                {estadisticas.total_area ? `${estadisticas.total_area.toFixed(0)} m²` : 'Sin datos geométricos'}
              </p>
            </div>

            {/* Total Lotes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiHome className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Lotes</span>
              </div>
              <div className="text-2xl font-bold">{resumen.totalLotes}</div>
              <p className="text-xs text-gray-500">
                {resumen.lotesConGeometria} con geometría
              </p>
            </div>

            {/* Total Manzanas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiGrid className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Total Manzanas</span>
              </div>
              <div className="text-2xl font-bold">{resumen.totalManzanas}</div>
              <p className="text-xs text-gray-500">
                {resumen.manzanasConGeometria} con geometría
              </p>
            </div>

            {/* Cobertura Geométrica */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiTrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Cobertura</span>
              </div>
              <div className="text-2xl font-bold">
                {resumen.totalLotes > 0 ? `${resumen.porcentajeLotesConGeometria}%` : '0%'}
              </div>
              <p className="text-xs text-gray-500">
                Lotes con geometría
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barras de progreso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cobertura de Lotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Lotes con geometría</span>
                <span className="text-sm font-medium">
                  {resumen.lotesConGeometria} / {resumen.totalLotes}
                </span>
              </div>
              <Progress 
                value={resumen.totalLotes > 0 ? (resumen.lotesConGeometria / resumen.totalLotes) * 100 : 0} 
                className="h-2"
              />
              <div className="flex items-center gap-2">
                {resumen.porcentajeLotesConGeometria === '100.0' ? (
                  <FiCheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <FiAlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-xs text-gray-600">
                  {resumen.porcentajeLotesConGeometria}% completado
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cobertura de Manzanas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Manzanas con geometría</span>
                <span className="text-sm font-medium">
                  {resumen.manzanasConGeometria} / {resumen.totalManzanas}
                </span>
              </div>
              <Progress 
                value={resumen.totalManzanas > 0 ? (resumen.manzanasConGeometria / resumen.totalManzanas) * 100 : 0} 
                className="h-2"
              />
              <div className="flex items-center gap-2">
                {resumen.porcentajeManzanasConGeometria === '100.0' ? (
                  <FiCheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <FiAlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-xs text-gray-600">
                  {resumen.porcentajeManzanasConGeometria}% completado
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado del sistema PostGIS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Estado del Sistema PostGIS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm">Sistema PostGIS activo y funcionando</span>
            <Badge variant="secondary" className="ml-auto">
              <FiMap className="h-3 w-3 mr-1" />
              Geoespacial
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Las geometrías se calculan automáticamente usando PostGIS. 
            Áreas, centros y perímetros se actualizan en tiempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

