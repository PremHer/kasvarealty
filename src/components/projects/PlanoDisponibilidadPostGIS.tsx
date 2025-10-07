'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  FiMapPin, 
  FiInfo, 
  FiZoomIn, 
  FiZoomOut, 
  FiRefreshCw, 
  FiGrid, 
  FiHome, 
  FiEdit3, 
  FiPlus,
  FiSquare,
  FiSearch,
  FiLayers,
  FiDownload,
  FiSettings
} from 'react-icons/fi'
import dynamic from 'next/dynamic'
import { GeometriaService, LoteGeometrico, ManzanaGeometrica } from '@/lib/services/geometriaService'
import EditorGeometriaModal from './EditorGeometriaModal'

// Importar Leaflet dinámicamente para evitar problemas de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })

interface PlanoDisponibilidadPostGISProps {
  proyectoId: string
  refreshTrigger?: number
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

// Función para convertir WKT a coordenadas de Leaflet
const wktToCoordinates = (wkt: string): Array<[number, number]> => {
  try {
    console.log('🔍 Debug - WKT a convertir:', wkt)
    
    if (!wkt || typeof wkt !== 'string') {
      console.log('❌ WKT inválido:', wkt)
      return []
    }
    
    // Extraer coordenadas del WKT POLYGON
    const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/)
    if (!match) {
      console.log('❌ No se pudo hacer match del WKT POLYGON:', wkt)
      return []
    }

    const coords = match[1].split(',').map(coord => {
      const [lng, lat] = coord.trim().split(' ').map(Number)
      console.log('🔍 Coordenada convertida:', { coord, lng, lat, resultado: [lat, lng] })
      return [lat, lng] as [number, number]
    })

    console.log('✅ Coordenadas finales:', coords)
    return coords
  } catch (error) {
    console.error('❌ Error parsing WKT:', error)
    return []
  }
}

// Función para convertir WKT POINT a coordenadas
const wktPointToCoordinates = (wkt: string): [number, number] | null => {
  try {
    const match = wkt.match(/POINT\(([^)]+)\)/)
    if (!match) return null

    const [lng, lat] = match[1].split(' ').map(Number)
    return [lat, lng]
  } catch (error) {
    console.error('Error parsing WKT point:', error)
    return null
  }
}

export default function PlanoDisponibilidadPostGIS({ proyectoId, refreshTrigger }: PlanoDisponibilidadPostGISProps) {
  console.log('🔍 Debug - PlanoDisponibilidadPostGIS renderizado con:', { proyectoId, refreshTrigger })
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<LoteGeometrico | null>(null)
  const [tipoVisualizacion, setTipoVisualizacion] = useState<'mapa' | 'grid'>('mapa')
  const [mostrarManzanas, setMostrarManzanas] = useState(true)
  const [mostrarLotes, setMostrarLotes] = useState(true)
  const [mostrarCentros, setMostrarCentros] = useState(false)
  const [mostrarPerimetros, setMostrarPerimetros] = useState(false)
  const [mostrarGeometriaProyecto, setMostrarGeometriaProyecto] = useState(true)
  const [zoom, setZoom] = useState(15)
  const [centro, setCentro] = useState<[number, number]>([-12.0464, -77.0428]) // Lima por defecto
  const [busquedaProximidad, setBusquedaProximidad] = useState({
    latitud: '',
    longitud: '',
    radio: '100'
  })
  const [mostrarEditorGeometria, setMostrarEditorGeometria] = useState(false)
  const [unidadParaEditar, setUnidadParaEditar] = useState<{
    id: string
    codigo: string
    numero?: string
    tipo: 'lote' | 'manzana'
    geometria: string
    nombre: string
    latitud?: number
    longitud?: number
    dimensionFrente?: number
    dimensionFondo?: number
  } | null>(null)

  // Fetch proyecto
  const { data: proyecto, isLoading: isLoadingProyecto } = useQuery({
    queryKey: ['proyecto', proyectoId, refreshTrigger],
    queryFn: async () => {
      const response = await fetch(`/api/proyectos/${proyectoId}`)
      if (!response.ok) throw new Error('Error al cargar proyecto')
      const data = await response.json()
      console.log('🔍 Debug - Datos del proyecto cargados:', data)
      return data
    },
  })

  // Fetch lotes con geometría PostGIS
  const { data: lotesGeometricos, isLoading: isLoadingLotes } = useQuery({
    queryKey: ['lotes-geometricos', proyectoId, refreshTrigger],
    queryFn: async () => {
      return await GeometriaService.obtenerLotesConGeometria(proyectoId)
    },
    enabled: !!proyectoId
  })

  // Fetch manzanas con geometría PostGIS
  const { data: manzanasGeometricas, isLoading: isLoadingManzanas } = useQuery({
    queryKey: ['manzanas-geometricas', proyectoId, refreshTrigger],
    queryFn: async () => {
      return await GeometriaService.obtenerManzanasConGeometria(proyectoId)
    },
    enabled: !!proyectoId
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

  // Actualizar centro del mapa cuando se carga el proyecto
  useEffect(() => {
    if (proyecto?.latitud && proyecto?.longitud) {
      setCentro([proyecto.latitud, proyecto.longitud])
    }
  }, [proyecto])

  // Combinar y procesar unidades
  const unidadesProcesadas = useMemo(() => {
    if (!lotesGeometricos) return []

    return lotesGeometricos.map((lote) => {
      // Buscar si hay una venta para este lote
      const venta = ventas?.ventas?.find((v: any) => v.loteId === lote.id)
      const estadoReal = venta ? (venta.estado === 'APROBADA' ? 'VENDIDO' : lote.estado) : lote.estado

      // Convertir WKT a coordenadas
      const coordenadas = wktToCoordinates(lote.geometria)
      const centroCoords = wktPointToCoordinates(lote.centro)

      return {
        ...lote,
        estado: estadoReal,
        coordenadas,
        centroCoords,
        tipo: 'lote' as const
      }
    })
  }, [lotesGeometricos, ventas])

  // Filtrar unidades por estado
  const unidadesFiltradas = useMemo(() => {
    if (filtroEstado === 'TODOS') return unidadesProcesadas
    return unidadesProcesadas.filter(unidad => unidad.estado === filtroEstado)
  }, [unidadesProcesadas, filtroEstado])

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = unidadesProcesadas.length
    const disponibles = unidadesProcesadas.filter(u => u.estado === 'DISPONIBLE').length
    const vendidos = unidadesProcesadas.filter(u => u.estado === 'VENDIDO').length
    const reservados = unidadesProcesadas.filter(u => u.estado === 'RESERVADO').length
    const entregados = unidadesProcesadas.filter(u => u.estado === 'ENTREGADO').length

    return { total, disponibles, vendidos, reservados, entregados }
  }, [unidadesProcesadas])

  // Función para buscar por proximidad
  const buscarPorProximidad = async () => {
    if (!busquedaProximidad.latitud || !busquedaProximidad.longitud) return

    try {
      const lotes = await GeometriaService.buscarLotesPorProximidad(
        parseFloat(busquedaProximidad.latitud),
        parseFloat(busquedaProximidad.longitud),
        parseFloat(busquedaProximidad.radio),
        proyectoId
      )
      console.log('Lotes encontrados por proximidad:', lotes)
      // Aquí podrías actualizar el estado para mostrar los resultados
    } catch (error) {
      console.error('Error en búsqueda por proximidad:', error)
    }
  }

  if (isLoadingProyecto || isLoadingLotes || isLoadingManzanas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando plano de disponibilidad...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FiMapPin className="h-5 w-5" />
              Plano de Disponibilidad - {proyecto?.nombre}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtros */}
            <div className="space-y-2">
              <Label>Filtrar por estado</Label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                  <SelectItem value="RESERVADO">Reservado</SelectItem>
                  <SelectItem value="VENDIDO">Vendido</SelectItem>
                  <SelectItem value="ENTREGADO">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de visualización */}
            <div className="space-y-2">
              <Label>Tipo de visualización</Label>
              <Select value={tipoVisualizacion} onValueChange={(value: 'mapa' | 'grid') => setTipoVisualizacion(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mapa">Mapa</SelectItem>
                  <SelectItem value="grid">Cuadrícula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Controles de capas */}
            <div className="space-y-2">
              <Label>Capas</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={mostrarManzanas}
                    onCheckedChange={setMostrarManzanas}
                  />
                  <Label className="text-sm">Manzanas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={mostrarLotes}
                    onCheckedChange={setMostrarLotes}
                  />
                  <Label className="text-sm">Lotes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={mostrarCentros}
                    onCheckedChange={setMostrarCentros}
                  />
                  <Label className="text-sm">Centros</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={mostrarGeometriaProyecto}
                    onCheckedChange={setMostrarGeometriaProyecto}
                  />
                  <Label className="text-sm">Límites del Proyecto</Label>
                </div>
              </div>
            </div>

            {/* Búsqueda por proximidad */}
            <div className="space-y-2">
              <Label>Búsqueda por proximidad</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Latitud"
                  value={busquedaProximidad.latitud}
                  onChange={(e) => setBusquedaProximidad(prev => ({ ...prev, latitud: e.target.value }))}
                />
                <Input
                  placeholder="Longitud"
                  value={busquedaProximidad.longitud}
                  onChange={(e) => setBusquedaProximidad(prev => ({ ...prev, longitud: e.target.value }))}
                />
                <Input
                  placeholder="Radio (metros)"
                  value={busquedaProximidad.radio}
                  onChange={(e) => setBusquedaProximidad(prev => ({ ...prev, radio: e.target.value }))}
                />
                <Button size="sm" onClick={buscarPorProximidad}>
                  <FiSearch className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.disponibles}</div>
              <div className="text-sm text-gray-600">Disponibles</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{estadisticas.reservados}</div>
              <div className="text-sm text-gray-600">Reservados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{estadisticas.vendidos}</div>
              <div className="text-sm text-gray-600">Vendidos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{estadisticas.entregados}</div>
              <div className="text-sm text-gray-600">Entregados</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapa */}
      {tipoVisualizacion === 'mapa' && (
        <Card>
          <CardContent className="p-0">
            <div className="h-[600px] relative">
              <MapContainer
                center={centro}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Geometría del Proyecto */}
                {(() => {
                  console.log('🔍 Debug - Estado del proyecto:', {
                    mostrarGeometriaProyecto,
                    tieneGeometria: !!proyecto?.geometria,
                    geometria: proyecto?.geometria,
                    proyectoCompleto: proyecto
                  })
                  
                  if (!mostrarGeometriaProyecto) {
                    console.log('❌ Geometría del proyecto oculta por toggle')
                    return null
                  }
                  
                  if (!proyecto?.geometria) {
                    console.log('❌ Proyecto no tiene geometría')
                    return null
                  }
                  
                  const coordenadas = wktToCoordinates(proyecto.geometria)
                  console.log('🔍 Debug - Coordenadas convertidas:', coordenadas)
                  
                  if (coordenadas.length === 0) {
                    console.log('❌ No se pudieron convertir las coordenadas')
                    return null
                  }
                  
                  console.log('✅ Renderizando geometría del proyecto')
                  return (
                    <Polygon
                      key="proyecto-geometria"
                      positions={coordenadas}
                      pathOptions={{
                        color: '#1F2937',
                        fillColor: '#1F2937',
                        fillOpacity: 0.05,
                        weight: 3,
                        dashArray: '5, 5'
                      }}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <div className="font-semibold">Límites del Proyecto</div>
                          <div>Área Total: {proyecto.areaGeometrica ? `${(proyecto.areaGeometrica / 10000).toFixed(2)} ha` : 'N/A'}</div>
                          <div>Perímetro: {proyecto.perimetroGeometrico ? 'Definido' : 'N/A'}</div>
                        </div>
                      </Popup>
                    </Polygon>
                  )
                })()}

                {/* Manzanas */}
                {mostrarManzanas && manzanasGeometricas?.map((manzana) => {
                  const coordenadas = wktToCoordinates(manzana.geometria)
                  if (coordenadas.length === 0) return null

                  return (
                    <Polygon
                      key={`manzana-${manzana.id}`}
                      positions={coordenadas}
                      pathOptions={{
                        color: '#3B82F6',
                        fillColor: '#3B82F6',
                        fillOpacity: 0.1,
                        weight: 2,
                      }}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <div className="font-semibold">Manzana {manzana.codigo}</div>
                          <div>Nombre: {manzana.nombre}</div>
                          <div>Área: {manzana.areaGeometrica?.toFixed(2)} m²</div>
                          <div>Lotes: {manzana.lotes.length}</div>
                        </div>
                      </Popup>
                    </Polygon>
                  )
                })}

                {/* Lotes */}
                {mostrarLotes && unidadesFiltradas.map((unidad) => {
                  if (!unidad.coordenadas || unidad.coordenadas.length === 0) return null

                  const color = COLORES_ESTADO[unidad.estado as keyof EstadoUnidad] || '#6B7280'
                  const isSelected = unidadSeleccionada?.id === unidad.id

                  return (
                    <Polygon
                      key={unidad.id}
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
                        <div className="space-y-2">
                          <div className="font-semibold">Lote {unidad.numero}</div>
                          <div>Código: {unidad.codigo}</div>
                          <div>Área: {unidad.areaGeometrica?.toFixed(2)} m²</div>
                          <div>Precio: ${unidad.precio?.toLocaleString()}</div>
                          <div>Estado: {NOMBRES_ESTADO[unidad.estado as keyof EstadoUnidad]}</div>
                                                     <Button
                             size="sm"
                             variant="outline"
                             onClick={() => {
                               setUnidadParaEditar({
                                 id: unidad.id,
                                 codigo: unidad.codigo,
                                 numero: unidad.numero,
                                 tipo: 'lote',
                                 geometria: unidad.geometria,
                                 nombre: `Lote ${unidad.numero}`,
                                 latitud: unidad.latitud,
                                 longitud: unidad.longitud,
                                 dimensionFrente: unidad.dimensionFrente,
                                 dimensionFondo: unidad.dimensionFondo
                               })
                               setMostrarEditorGeometria(true)
                             }}
                             className="w-full"
                           >
                            <FiEdit3 className="h-4 w-4 mr-1" />
                            Editar Geometría
                          </Button>
                        </div>
                      </Popup>
                    </Polygon>
                  )
                })}

                {/* Centros de lotes */}
                {mostrarCentros && unidadesFiltradas.map((unidad) => {
                  if (!unidad.centroCoords) return null

                  const color = COLORES_ESTADO[unidad.estado as keyof EstadoUnidad] || '#6B7280'

                  return (
                    <CircleMarker
                      key={`centro-${unidad.id}`}
                      center={unidad.centroCoords}
                      radius={3}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.8,
                      }}
                      eventHandlers={{
                        click: () => setUnidadSeleccionada(unidad),
                      }}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <div className="font-semibold">Centro - Lote {unidad.numero}</div>
                          <div>Código: {unidad.codigo}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista de cuadrícula */}
      {tipoVisualizacion === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {unidadesFiltradas.map((unidad) => (
            <Card
              key={unidad.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                unidadSeleccionada?.id === unidad.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setUnidadSeleccionada(unidad)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Lote {unidad.numero}</h3>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: COLORES_ESTADO[unidad.estado as keyof EstadoUnidad],
                        color: 'white'
                      }}
                    >
                      {NOMBRES_ESTADO[unidad.estado as keyof EstadoUnidad]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Código: {unidad.codigo}</p>
                  <p className="text-sm">Área: {unidad.areaGeometrica?.toFixed(2)} m²</p>
                  <p className="text-sm font-semibold text-green-600">
                    ${unidad.precio?.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detalles de la unidad seleccionada */}
      {unidadSeleccionada && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FiInfo className="h-5 w-5" />
              Detalles del Lote {unidadSeleccionada.numero}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <span className="text-sm font-medium text-muted-foreground">Área:</span>
                <p>{unidadSeleccionada.areaGeometrica?.toFixed(2)} m²</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Precio:</span>
                <p className="font-semibold text-green-600">${unidadSeleccionada.precio?.toLocaleString()}</p>
              </div>
              {unidadSeleccionada.centroCoords && (
                <div className="col-span-2">
                  <span className="text-sm font-medium text-muted-foreground">Coordenadas del centro:</span>
                  <p>{unidadSeleccionada.centroCoords[0].toFixed(6)}, {unidadSeleccionada.centroCoords[1].toFixed(6)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de edición de geometría */}
      {mostrarEditorGeometria && unidadParaEditar && (
        <EditorGeometriaModal
          isOpen={mostrarEditorGeometria}
          onClose={() => {
            setMostrarEditorGeometria(false)
            setUnidadParaEditar(null)
          }}
          unidad={unidadParaEditar}
          proyectoId={proyectoId}
          onSuccess={() => {
            // Refrescar los datos del mapa
            // Los queries se actualizarán automáticamente
            setMostrarEditorGeometria(false)
            setUnidadParaEditar(null)
          }}
        />
      )}
    </div>
  )
}
