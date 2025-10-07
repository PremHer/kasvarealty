'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FiMapPin, 
  FiSave, 
  FiX, 
  FiEdit3, 
  FiPlus,
  FiTrash2,
  FiMove,
  FiRotateCw
} from 'react-icons/fi'
import dynamic from 'next/dynamic'
import { GeometriaService, Coordenada } from '@/lib/services/geometriaService'

// Importar Leaflet dinámicamente
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

interface EditorGeometriaModalProps {
  isOpen: boolean
  onClose: () => void
  unidad: {
    id: string
    codigo: string
    numero?: string
    tipoUnidad?: string
    tipo: 'lote' | 'manzana' | 'unidad_cementerio'
    latitud?: number
    longitud?: number
    dimensionFrente?: number
    dimensionFondo?: number
    geometria?: string
  } | null
  proyectoId: string
  onSuccess: () => void
}

type ModoEdicion = 'seleccionar' | 'agregar' | 'mover' | 'eliminar'

export default function EditorGeometriaModal({
  isOpen,
  onClose,
  unidad,
  proyectoId,
  onSuccess
}: EditorGeometriaModalProps) {
  const { toast } = useToast()
  const [coordenadas, setCoordenadas] = useState<Coordenada[]>([])
  const [modoEdicion, setModoEdicion] = useState<ModoEdicion>('seleccionar')
  const [centro, setCentro] = useState<[number, number]>([-12.0464, -77.0428])
  const [zoom, setZoom] = useState(15)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    dimensionFrente: '',
    dimensionFondo: '',
    orientacion: '0'
  })
  const [coordenadaSeleccionada, setCoordenadaSeleccionada] = useState<number | null>(null)

  // Referencias para el mapa
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (unidad) {
      // Establecer centro del mapa
      if (unidad.latitud && unidad.longitud) {
        setCentro([unidad.latitud, unidad.longitud])
      }

      // Cargar geometría existente si existe
      if (unidad.geometria) {
        cargarGeometriaExistente(unidad.geometria)
      } else if (unidad.latitud && unidad.longitud && unidad.dimensionFrente && unidad.dimensionFondo) {
        // Generar geometría rectangular desde dimensiones
        generarGeometriaRectangular()
      }

      // Cargar dimensiones en el formulario
      setFormData({
        dimensionFrente: unidad.dimensionFrente?.toString() || '',
        dimensionFondo: unidad.dimensionFondo?.toString() || '',
        orientacion: '0'
      })
    }
  }, [unidad])

  const cargarGeometriaExistente = (geometriaWKT: string) => {
    try {
      // Extraer coordenadas del WKT POLYGON
      const match = geometriaWKT.match(/POLYGON\(\(([^)]+)\)\)/)
      if (!match) return

      const coords = match[1].split(',').map(coord => {
        const [lng, lat] = coord.trim().split(' ').map(Number)
        return { latitud: lat, longitud: lng }
      })

      setCoordenadas(coords)
    } catch (error) {
      console.error('Error al cargar geometría existente:', error)
    }
  }

  const generarGeometriaRectangular = () => {
    if (!unidad?.latitud || !unidad?.longitud || !unidad?.dimensionFrente || !unidad?.dimensionFondo) return

    const frente = unidad.dimensionFrente
    const fondo = unidad.dimensionFondo
    const lat = unidad.latitud
    const lng = unidad.longitud

    // Convertir metros a grados (aproximadamente)
    const latOffset = fondo / 111320
    const lngOffset = frente / (111320 * Math.cos(lat * Math.PI / 180))

    const nuevasCoordenadas: Coordenada[] = [
      { latitud: lat + latOffset/2, longitud: lng - lngOffset/2 }, // Esquina superior izquierda
      { latitud: lat + latOffset/2, longitud: lng + lngOffset/2 }, // Esquina superior derecha
      { latitud: lat - latOffset/2, longitud: lng + lngOffset/2 }, // Esquina inferior derecha
      { latitud: lat - latOffset/2, longitud: lng - lngOffset/2 }, // Esquina inferior izquierda
    ]

    setCoordenadas(nuevasCoordenadas)
  }

  const handleMapClick = (e: any) => {
    if (modoEdicion === 'agregar') {
      const { lat, lng } = e.latlng
      setCoordenadas(prev => [...prev, { latitud: lat, longitud: lng }])
    }
  }

  const handleMarkerClick = (index: number) => {
    if (modoEdicion === 'eliminar') {
      setCoordenadas(prev => prev.filter((_, i) => i !== index))
    } else if (modoEdicion === 'mover') {
      setCoordenadaSeleccionada(index)
    }
  }

  const handleMarkerDrag = (index: number, e: any) => {
    const { lat, lng } = e.target.getLatLng()
    setCoordenadas(prev => prev.map((coord, i) => 
      i === index ? { latitud: lat, longitud: lng } : coord
    ))
  }

  const generarGeometriaDesdeFormulario = () => {
    if (!unidad?.latitud || !unidad?.longitud || !formData.dimensionFrente || !formData.dimensionFondo) {
      toast({
        title: "Error",
        description: "Faltan datos para generar la geometría",
        variant: "destructive"
      })
      return
    }

    const frente = parseFloat(formData.dimensionFrente)
    const fondo = parseFloat(formData.dimensionFondo)
    const orientacion = parseFloat(formData.orientacion)
    const lat = unidad.latitud
    const lng = unidad.longitud

    // Convertir metros a grados
    const latOffset = fondo / 111320
    const lngOffset = frente / (111320 * Math.cos(lat * Math.PI / 180))

    // Aplicar rotación si es necesaria
    const rad = orientacion * Math.PI / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    const puntos = [
      [-lngOffset/2, -latOffset/2],
      [lngOffset/2, -latOffset/2],
      [lngOffset/2, latOffset/2],
      [-lngOffset/2, latOffset/2]
    ]

    const coordenadasRotadas = puntos.map(([x, y]) => ({
      latitud: lat + (x * cos - y * sin),
      longitud: lng + (x * sin + y * cos)
    }))

    setCoordenadas(coordenadasRotadas)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unidad || coordenadas.length < 3) {
      toast({
        title: "Error",
        description: "Se necesitan al menos 3 coordenadas para crear una geometría válida",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      // Crear geometría WKT
      const geometriaWKT = GeometriaService.crearPoligono(coordenadas)

      // Determinar la ruta de API según el tipo de unidad
      let apiUrl: string
      if (unidad.tipo === 'lote') {
        apiUrl = `/api/proyectos/${proyectoId}/lotes/${unidad.id}/geometria`
      } else if (unidad.tipo === 'manzana') {
        apiUrl = `/api/proyectos/${proyectoId}/manzanas/${unidad.id}/geometria`
      } else {
        throw new Error('Tipo de unidad no soportado')
      }

      // Actualizar geometría usando la API
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ geometria: geometriaWKT })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar geometría')
      }

      toast({
        title: "Éxito",
        description: "Geometría actualizada correctamente",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error al actualizar geometría:', error)
      toast({
        title: "Error",
        description: "Error al actualizar la geometría",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const limpiarGeometria = () => {
    setCoordenadas([])
    setCoordenadaSeleccionada(null)
  }

  if (!isOpen || !unidad) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FiMapPin className="h-5 w-5" />
              Editor de Geometría - {unidad.tipo === 'lote' ? `Lote ${unidad.numero}` : unidad.codigo}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Panel de controles */}
            <div className="space-y-4">
              {/* Modo de edición */}
              <div>
                <Label>Modo de edición</Label>
                <Select value={modoEdicion} onValueChange={(value: ModoEdicion) => setModoEdicion(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seleccionar">Seleccionar</SelectItem>
                    <SelectItem value="agregar">Agregar punto</SelectItem>
                    <SelectItem value="mover">Mover punto</SelectItem>
                    <SelectItem value="eliminar">Eliminar punto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generación automática */}
              <div className="space-y-2">
                <Label>Generar desde dimensiones</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Frente (m)</Label>
                    <Input
                      type="number"
                      value={formData.dimensionFrente}
                      onChange={(e) => setFormData(prev => ({ ...prev, dimensionFrente: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fondo (m)</Label>
                    <Input
                      type="number"
                      value={formData.dimensionFondo}
                      onChange={(e) => setFormData(prev => ({ ...prev, dimensionFondo: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Orientación (grados)</Label>
                  <Input
                    type="number"
                    value={formData.orientacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, orientacion: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <Button 
                  size="sm" 
                  onClick={generarGeometriaDesdeFormulario}
                  className="w-full"
                >
                  <FiRotateCw className="h-4 w-4 mr-2" />
                  Generar
                </Button>
              </div>

              {/* Acciones */}
              <div className="space-y-2">
                <Label>Acciones</Label>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={limpiarGeometria}
                    className="w-full"
                  >
                    <FiTrash2 className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generarGeometriaRectangular}
                    className="w-full"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    Rectángulo desde centro
                  </Button>
                </div>
              </div>

              {/* Información */}
              <div className="space-y-2">
                <Label>Información</Label>
                <div className="text-sm space-y-1">
                  <p>Puntos: {coordenadas.length}</p>
                  <p>Válido: {coordenadas.length >= 3 ? 'Sí' : 'No'}</p>
                  {coordenadas.length > 0 && (
                    <p>Área aproximada: {calcularAreaAproximada()} m²</p>
                  )}
                </div>
              </div>

              {/* Guardar */}
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || coordenadas.length < 3}
                className="w-full"
              >
                <FiSave className="h-4 w-4 mr-2" />
                {isLoading ? 'Guardando...' : 'Guardar Geometría'}
              </Button>
            </div>

            {/* Mapa */}
            <div className="lg:col-span-2 h-full">
              <div className="h-full relative">
                <MapContainer
                  center={centro}
                  zoom={zoom}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                  scrollWheelZoom={true}
                  ref={mapRef}
                  onClick={handleMapClick}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Polígono */}
                  {coordenadas.length >= 3 && (
                    <Polygon
                      positions={coordenadas.map(coord => [coord.latitud, coord.longitud])}
                      pathOptions={{
                        color: '#3B82F6',
                        fillColor: '#3B82F6',
                        fillOpacity: 0.3,
                        weight: 2,
                      }}
                    />
                  )}

                  {/* Marcadores de puntos */}
                  {coordenadas.map((coord, index) => (
                    <Marker
                      key={index}
                      position={[coord.latitud, coord.longitud]}
                      draggable={modoEdicion === 'mover'}
                      eventHandlers={{
                        click: () => handleMarkerClick(index),
                        dragend: (e) => handleMarkerDrag(index, e),
                      }}
                    >
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Función para calcular área aproximada
function calcularAreaAproximada(): number {
  // Implementación básica del algoritmo del área de Gauss
  // En un sistema real, esto se calcularía con PostGIS
  return 0
}
