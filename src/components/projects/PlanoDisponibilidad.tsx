'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FiMapPin, FiInfo, FiZoomIn, FiZoomOut, FiRefreshCw, FiGrid, FiHome, FiEdit3, FiPlus } from 'react-icons/fi'
import dynamic from 'next/dynamic'
import EditarCoordenadasModal from './EditarCoordenadasModal'

// Importar Leaflet dinámicamente para evitar problemas de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

interface PlanoDisponibilidadProps {
  proyectoId: string
}

interface Unidad {
  id: string
  codigo: string
  tipoUnidad?: string
  numero?: string
  area: number
  precio: number
  estado: string
  latitud?: number
  longitud?: number
  tipo: 'lote' | 'unidad_cementerio'
  manzanaId?: string
  pabellonId?: string
  // Para polígonos
  coordenadas?: Array<[number, number]>
  dimensionFrente?: number
  dimensionFondo?: number
}

interface EstadoUnidad {
  DISPONIBLE: string
  VENDIDO: string
  RESERVADO: string
  ENTREGADO: string
  PENDIENTE: string
  APROBADA: string
}

const COLORES_ESTADO: EstadoUnidad = {
  DISPONIBLE: '#10B981', // Verde
  VENDIDO: '#EF4444',    // Rojo
  RESERVADO: '#F59E0B',  // Amarillo
  ENTREGADO: '#6B7280',  // Gris
  PENDIENTE: '#8B5CF6',  // Púrpura
  APROBADA: '#EF4444',   // Rojo (para ventas aprobadas)
}

const NOMBRES_ESTADO: EstadoUnidad = {
  DISPONIBLE: 'Disponible',
  VENDIDO: 'Vendido',
  RESERVADO: 'Reservado',
  ENTREGADO: 'Entregado',
  PENDIENTE: 'Pendiente',
  APROBADA: 'Vendido',
}

// Función para generar polígonos basados en coordenadas centrales y dimensiones
const generarPoligono = (lat: number, lng: number, frente: number, fondo: number): Array<[number, number]> => {
  // Convertir metros a grados (aproximadamente)
  const latOffset = fondo / 111000 // 1 grado ≈ 111km
  const lngOffset = frente / (111000 * Math.cos(lat * Math.PI / 180))

  return [
    [lat + latOffset/2, lng - lngOffset/2], // Esquina superior izquierda
    [lat + latOffset/2, lng + lngOffset/2], // Esquina superior derecha
    [lat - latOffset/2, lng + lngOffset/2], // Esquina inferior derecha
    [lat - latOffset/2, lng - lngOffset/2], // Esquina inferior izquierda
    [lat + latOffset/2, lng - lngOffset/2], // Cerrar el polígono
  ]
}

export default function PlanoDisponibilidad({ proyectoId }: PlanoDisponibilidadProps) {
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<Unidad | null>(null)
  const [tipoVisualizacion, setTipoVisualizacion] = useState<'mapa' | 'grid'>('mapa')
  const [mostrarPoligonos, setMostrarPoligonos] = useState(true)
  const [isEditarCoordenadasOpen, setIsEditarCoordenadasOpen] = useState(false)

  // Fetch proyecto
  const { data: proyecto, isLoading: isLoadingProyecto } = useQuery({
    queryKey: ['proyecto', proyectoId],
    queryFn: async () => {
      const response = await fetch(`/api/proyectos/${proyectoId}`)
      if (!response.ok) throw new Error('Error al cargar proyecto')
      return response.json()
    },
  })

  // Fetch lotes
  const { data: lotes, isLoading: isLoadingLotes } = useQuery({
    queryKey: ['lotes', proyectoId],
    queryFn: async () => {
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes`)
      if (!response.ok) throw new Error('Error al cargar lotes')
      return response.json()
    },
  })

  // Fetch unidades de cementerio
  const { data: unidadesCementerio, isLoading: isLoadingUnidades } = useQuery({
    queryKey: ['unidades-cementerio', proyectoId],
    queryFn: async () => {
      const response = await fetch(`/api/proyectos/${proyectoId}/unidades-cementerio`)
      if (!response.ok) throw new Error('Error al cargar unidades de cementerio')
      return response.json()
    },
  })

  // Fetch ventas para determinar estado real
  const { data: ventas } = useQuery({
    queryKey: ['ventas', proyectoId],
    queryFn: async () => {
      const response = await fetch(`/api/proyectos/${proyectoId}/ventas`)
      if (!response.ok) throw new Error('Error al cargar ventas')
      return response.json()
    },
  })

  // Combinar y procesar unidades
  const unidades: Unidad[] = useMemo(() => {
    const lotesProcesados = lotes?.lotes?.map((lote: any) => {
      // Buscar si hay una venta para este lote
      const venta = ventas?.ventas?.find((v: any) => v.loteId === lote.id)
      const estadoReal = venta ? (venta.estado === 'APROBADA' ? 'VENDIDO' : lote.estado) : lote.estado

      // Generar polígono si tiene coordenadas y dimensiones
      let coordenadas: Array<[number, number]> | undefined
      if (lote.latitud && lote.longitud && lote.dimensionFrente && lote.dimensionFondo) {
        coordenadas = generarPoligono(
          lote.latitud,
          lote.longitud,
          lote.dimensionFrente,
          lote.dimensionFondo
        )
      }

      return {
        id: lote.id,
        codigo: lote.codigo,
        numero: lote.numero,
        area: lote.area,
        precio: lote.precio || 0,
        estado: estadoReal,
        latitud: lote.latitud,
        longitud: lote.longitud,
        tipo: 'lote' as const,
        manzanaId: lote.manzanaId,
        coordenadas,
        dimensionFrente: lote.dimensionFrente,
        dimensionFondo: lote.dimensionFondo,
      }
    }) || []

    const unidadesProcesadas = unidadesCementerio?.unidades?.map((unidad: any) => {
      // Buscar si hay una venta para esta unidad
      const venta = ventas?.ventas?.find((v: any) => v.unidadCementerioId === unidad.id)
      const estadoReal = venta ? (venta.estado === 'APROBADA' ? 'VENDIDO' : unidad.estado) : unidad.estado

      return {
        id: unidad.id,
        codigo: unidad.codigo,
        tipoUnidad: unidad.tipoUnidad,
        area: 0, // Las unidades de cementerio no tienen área
        precio: unidad.precio,
        estado: estadoReal,
        latitud: unidad.latitud,
        longitud: unidad.longitud,
        tipo: 'unidad_cementerio' as const,
        pabellonId: unidad.pabellonId,
      }
    }) || []

    return [...lotesProcesados, ...unidadesProcesadas]
  }, [lotes, unidadesCementerio, ventas])

  // Filtrar unidades según el estado seleccionado
  const unidadesFiltradas = useMemo(() => {
    if (filtroEstado === 'TODOS') return unidades
    return unidades.filter(unidad => unidad.estado === filtroEstado)
  }, [unidades, filtroEstado])

  // Calcular centro del mapa
  const centroMapa = useMemo(() => {
    const unidadesConCoordenadas = unidades.filter(u => u.latitud && u.longitud)
    
    if (unidadesConCoordenadas.length === 0) {
      // Coordenadas por defecto (Lima, Perú)
      return [-12.0464, -77.0428]
    }

    const latitudes = unidadesConCoordenadas.map(u => u.latitud!).filter(Boolean)
    const longitudes = unidadesConCoordenadas.map(u => u.longitud!).filter(Boolean)

    const latPromedio = latitudes.reduce((a, b) => a + b, 0) / latitudes.length
    const lngPromedio = longitudes.reduce((a, b) => a + b, 0) / longitudes.length

    return [latPromedio, lngPromedio]
  }, [unidades])

  const isLoading = isLoadingProyecto || isLoadingLotes || isLoadingUnidades

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiMapPin className="h-5 w-5" />
            Plano de Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <FiRefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Cargando plano...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const unidadesConCoordenadas = unidades.filter(u => u.latitud && u.longitud)
  const unidadesSinCoordenadas = unidades.filter(u => !u.latitud || !u.longitud)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FiMapPin className="h-5 w-5" />
            Plano de Disponibilidad - {proyecto?.nombre}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={tipoVisualizacion} onValueChange={(value: 'mapa' | 'grid') => setTipoVisualizacion(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo de visualización" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mapa">Mapa Interactivo</SelectItem>
                <SelectItem value="grid">Vista Grid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                <SelectItem value="VENDIDO">Vendido</SelectItem>
                <SelectItem value="RESERVADO">Reservado</SelectItem>
                <SelectItem value="ENTREGADO">Entregado</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              </SelectContent>
            </Select>
            {tipoVisualizacion === 'mapa' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarPoligonos(!mostrarPoligonos)}
              >
                {mostrarPoligonos ? 'Ocultar Polígonos' : 'Mostrar Polígonos'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Leyenda */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLORES_ESTADO).map(([estado, color]) => (
              <div key={estado} className="flex items-center gap-1">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">{NOMBRES_ESTADO[estado as keyof EstadoUnidad]}</span>
              </div>
            ))}
          </div>

          {/* Información de unidades */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg border bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{unidadesConCoordenadas.length}</div>
              <div className="text-sm text-blue-700">Con coordenadas</div>
            </div>
            <div className="text-center p-3 rounded-lg border bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">{unidadesSinCoordenadas.length}</div>
              <div className="text-sm text-orange-700">Sin coordenadas</div>
            </div>
            <div className="text-center p-3 rounded-lg border bg-green-50">
              <div className="text-2xl font-bold text-green-600">{unidades.filter(u => u.tipo === 'lote').length}</div>
              <div className="text-sm text-green-700">Lotes</div>
            </div>
            <div className="text-center p-3 rounded-lg border bg-purple-50">
              <div className="text-2xl font-bold text-purple-600">{unidades.filter(u => u.tipo === 'unidad_cementerio').length}</div>
              <div className="text-sm text-purple-700">Unidades Cementerio</div>
            </div>
          </div>

          {/* Mapa o Grid */}
          {tipoVisualizacion === 'mapa' ? (
            <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
              {typeof window !== 'undefined' && (
                <MapContainer
                  center={centroMapa as [number, number]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {unidadesFiltradas.map((unidad) => {
                    if (!unidad.latitud || !unidad.longitud) return null

                    const color = COLORES_ESTADO[unidad.estado as keyof EstadoUnidad] || '#6B7280'
                    const isSelected = unidadSeleccionada?.id === unidad.id

                    return (
                      <div key={unidad.id}>
                        {/* Polígono si está habilitado y tiene coordenadas */}
                        {mostrarPoligonos && unidad.coordenadas && (
                          <Polygon
                            positions={unidad.coordenadas}
                            pathOptions={{
                              color: color,
                              fillColor: color,
                              fillOpacity: 0.3,
                              weight: isSelected ? 3 : 2,
                            }}
                            eventHandlers={{
                              click: () => setUnidadSeleccionada(unidad),
                            }}
                          >
                            <Popup>
                              <div className="space-y-1">
                                <div className="font-semibold">
                                  {unidad.tipo === 'lote' ? `Lote ${unidad.numero}` : unidad.tipoUnidad}
                                </div>
                                <div>Código: {unidad.codigo}</div>
                                {unidad.area > 0 && <div>Área: {unidad.area}m²</div>}
                                <div>Precio: ${unidad.precio.toLocaleString()}</div>
                                <div>Estado: {NOMBRES_ESTADO[unidad.estado as keyof EstadoUnidad]}</div>
                              </div>
                            </Popup>
                          </Polygon>
                        )}

                        {/* Marcador si no hay polígono o polígonos deshabilitados */}
                        {(!mostrarPoligonos || !unidad.coordenadas) && (
                          <Circle
                            center={[unidad.latitud, unidad.longitud]}
                            radius={isSelected ? 15 : 10}
                            pathOptions={{
                              color: color,
                              fillColor: color,
                              fillOpacity: 0.7,
                              weight: isSelected ? 3 : 2,
                            }}
                            eventHandlers={{
                              click: () => setUnidadSeleccionada(unidad),
                            }}
                          >
                            <Popup>
                              <div className="space-y-1">
                                <div className="font-semibold">
                                  {unidad.tipo === 'lote' ? `Lote ${unidad.numero}` : unidad.tipoUnidad}
                                </div>
                                <div>Código: {unidad.codigo}</div>
                                {unidad.area > 0 && <div>Área: {unidad.area}m²</div>}
                                <div>Precio: ${unidad.precio.toLocaleString()}</div>
                                <div>Estado: {NOMBRES_ESTADO[unidad.estado as keyof EstadoUnidad]}</div>
                                {unidad.latitud && unidad.longitud && (
                                  <div>Coordenadas: {unidad.latitud.toFixed(6)}, {unidad.longitud.toFixed(6)}</div>
                                )}
                              </div>
                            </Popup>
                          </Circle>
                        )}
                      </div>
                    )
                  })}
                </MapContainer>
              )}
            </div>
          ) : (
            // Vista Grid para unidades sin coordenadas
            <div className="border rounded-lg overflow-auto bg-gray-50 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {unidadesFiltradas.map((unidad, index) => {
                  const color = COLORES_ESTADO[unidad.estado as keyof EstadoUnidad] || '#6B7280'
                  const isSelected = unidadSeleccionada?.id === unidad.id

                  return (
                    <div
                      key={unidad.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                      }`}
                      style={{ backgroundColor: color + '20' }}
                      onClick={() => setUnidadSeleccionada(unidad)}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {unidad.tipo === 'lote' ? unidad.numero : unidad.codigo}
                        </div>
                        <div className="text-sm text-gray-600">
                          {unidad.tipo === 'lote' ? 'Lote' : unidad.tipoUnidad}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {NOMBRES_ESTADO[unidad.estado as keyof EstadoUnidad]}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Información de la unidad seleccionada */}
          {unidadSeleccionada && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FiInfo className="h-4 w-4" />
                  {unidadSeleccionada.tipo === 'lote' 
                    ? `Lote ${unidadSeleccionada.numero}` 
                    : unidadSeleccionada.tipoUnidad
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Código:</span>
                    <p>{unidadSeleccionada.codigo}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Estado:</span>
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: COLORES_ESTADO[unidadSeleccionada.estado as keyof EstadoUnidad],
                        color: 'white'
                      }}
                    >
                      {NOMBRES_ESTADO[unidadSeleccionada.estado as keyof EstadoUnidad]}
                    </Badge>
                  </div>
                  {unidadSeleccionada.area > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Área:</span>
                      <p>{unidadSeleccionada.area}m²</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Precio:</span>
                    <p>${unidadSeleccionada.precio.toLocaleString()}</p>
                  </div>
                  {unidadSeleccionada.latitud && unidadSeleccionada.longitud && (
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Coordenadas:</span>
                      <p>{unidadSeleccionada.latitud.toFixed(6)}, {unidadSeleccionada.longitud.toFixed(6)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsEditarCoordenadasOpen(true)}
                      >
                        <FiEdit3 className="h-4 w-4 mr-2" />
                        Editar Coordenadas
                      </Button>
                    </div>
                  )}
                  {unidadSeleccionada.dimensionFrente && unidadSeleccionada.dimensionFondo && (
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-muted-foreground">Dimensiones:</span>
                      <p>Frente: {unidadSeleccionada.dimensionFrente}m, Fondo: {unidadSeleccionada.dimensionFondo}m</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(COLORES_ESTADO).map(([estado, color]) => {
              const cantidad = unidades.filter(u => u.estado === estado).length
              return (
                <div key={estado} className="text-center p-3 rounded-lg border">
                  <div 
                    className="w-3 h-3 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-2xl font-bold">{cantidad}</div>
                  <div className="text-sm text-muted-foreground">
                    {NOMBRES_ESTADO[estado as keyof EstadoUnidad]}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mensaje de ayuda */}
          {unidadesSinCoordenadas.length > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FiInfo className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Unidades sin coordenadas</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {unidadesSinCoordenadas.length} unidades no tienen coordenadas registradas. 
                      Para mostrarlas en el mapa, necesitas agregar latitud y longitud en sus datos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>

      {/* Modal de editar coordenadas */}
      <EditarCoordenadasModal
        isOpen={isEditarCoordenadasOpen}
        onClose={() => setIsEditarCoordenadasOpen(false)}
        unidad={unidadSeleccionada}
        proyectoId={proyectoId}
        onSuccess={() => {
          // Refrescar los datos
          window.location.reload()
        }}
      />
    </Card>
  )
} 