'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import dynamic from 'next/dynamic'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Componente para manejar eventos del mapa
const MapEvents = dynamic(() => import('react-leaflet').then(mod => {
  const { useMapEvents } = mod
  return function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
      click: (e: any) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    })
    return null
  }
}), { ssr: false })
import { FiPlus, FiTrash2, FiSave, FiX, FiSquare } from 'react-icons/fi'

interface Coordenada {
  latitud: number
  longitud: number
}

interface EditorGeometriaProyectoModalProps {
  isOpen: boolean
  onClose: () => void
  proyectoId: string
  proyecto?: {
    latitud?: number
    longitud?: number
    geometria?: string
  }
  onGeometriaSaved: () => void
}



export default function EditorGeometriaProyectoModal({
  isOpen,
  onClose,
  proyectoId,
  proyecto,
  onGeometriaSaved
}: EditorGeometriaProyectoModalProps) {
  const { toast } = useToast()
  const [coordenadas, setCoordenadas] = useState<Coordenada[]>([])
  const [centro, setCentro] = useState<[number, number]>([-12.0464, -77.0428]) // Lima por defecto
  const [isLoading, setIsLoading] = useState(false)
  const [wktInput, setWktInput] = useState('')
  const [proyectoConGeometria, setProyectoConGeometria] = useState<any>(null)

  console.log('🔍 Debug - EditorGeometriaProyectoModal renderizado con:', { isOpen, proyectoId, proyecto })

  // Cargar estilos de Leaflet solo en el cliente
  useEffect(() => {
    import('leaflet/dist/leaflet.css')
  }, [])

  // Cargar proyecto con geometría cuando se abra el modal
  useEffect(() => {
    if (isOpen && proyectoId) {
      console.log('🔍 Debug - Modal abierto, cargando proyecto con geometría...')
      
      const cargarProyecto = async () => {
        try {
          const response = await fetch(`/api/proyectos/${proyectoId}`)
          if (!response.ok) throw new Error('Error al cargar proyecto')
          
          const data = await response.json()
          console.log('🔍 Debug - Proyecto cargado con geometría:', data)
          setProyectoConGeometria(data)
        } catch (error) {
          console.error('❌ Error al cargar proyecto:', error)
        }
      }
      
      cargarProyecto()
    }
  }, [isOpen, proyectoId])

  // Log cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      console.log('🔍 Debug - Modal abierto, proyecto:', proyecto)
      console.log('🔍 Debug - Estado actual de coordenadas:', coordenadas)
    }
  }, [isOpen, proyecto, coordenadas])

  useEffect(() => {
    console.log('🔍 Debug - EditorGeometriaProyectoModal - proyecto con geometría:', proyectoConGeometria)
    
    if (proyectoConGeometria?.geometria) {
      console.log('🔍 Debug - Cargando geometría existente:', proyectoConGeometria.geometria)
      
      // Parsear WKT existente
      try {
        const wkt = proyectoConGeometria.geometria
        setWktInput(wkt)
        
        // Extraer coordenadas del WKT POLYGON
        const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/)
        if (match) {
          const coordsStr = match[1]
          console.log('🔍 Debug - Coordenadas extraídas del WKT:', coordsStr)
          
          const coords = coordsStr.split(',').map(coord => {
            const [lng, lat] = coord.trim().split(' ').map(Number)
            console.log('🔍 Debug - Coordenada parseada:', { coord: coord.trim(), lng, lat, resultado: { latitud: lat, longitud: lng } })
            return { latitud: lat, longitud: lng }
          })
          
          console.log('🔍 Debug - Coordenadas finales:', coords)
          setCoordenadas(coords)
          
          if (coords.length > 0) {
            const centerLat = coords.reduce((sum, c) => sum + c.latitud, 0) / coords.length
            const centerLng = coords.reduce((sum, c) => sum + c.longitud, 0) / coords.length
            setCentro([centerLat, centerLng])
            console.log('🔍 Debug - Centro calculado:', [centerLat, centerLng])
          }
        } else {
          console.log('❌ Debug - No se pudo hacer match del WKT POLYGON')
        }
      } catch (error) {
        console.error('❌ Error al parsear WKT:', error)
      }
    } else {
      console.log('❌ Debug - Proyecto no tiene geometría, usando coordenadas por defecto')
      if (proyectoConGeometria?.latitud && proyectoConGeometria?.longitud) {
        setCentro([proyectoConGeometria.latitud, proyectoConGeometria.longitud])
      }
    }
  }, [proyectoConGeometria])

  const handleMapClick = (lat: number, lng: number) => {
    setCoordenadas(prev => [...prev, { latitud: lat, longitud: lng }])
  }

  const handleDeletePoint = (index: number) => {
    setCoordenadas(prev => prev.filter((_, i) => i !== index))
  }

  const handleMovePoint = (index: number, lat: number, lng: number) => {
    setCoordenadas(prev => prev.map((coord, i) => 
      i === index ? { latitud: lat, longitud: lng } : coord
    ))
  }

  const generateWKT = (): string => {
    if (coordenadas.length < 3) return ''
    
    // Cerrar el polígono si no está cerrado
    const coords = [...coordenadas]
    if (coords[0].latitud !== coords[coords.length - 1].latitud || 
        coords[0].longitud !== coords[coords.length - 1].longitud) {
      coords.push(coords[0])
    }
    
    const coordsStr = coords.map(coord => `${coord.longitud} ${coord.latitud}`).join(', ')
    return `POLYGON((${coordsStr}))`
  }

  const handleSave = async () => {
    if (coordenadas.length < 3) {
      toast({
        title: 'Error',
        description: 'Se necesitan al menos 3 puntos para crear un polígono',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const wkt = generateWKT()
      
      const response = await fetch(`/api/proyectos/${proyectoId}/geometria`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ geometria: wkt })
      })

      if (!response.ok) {
        throw new Error('Error al guardar la geometría')
      }

      toast({
        title: 'Éxito',
        description: 'Geometría del proyecto guardada correctamente'
      })

      onGeometriaSaved()
      onClose()
    } catch (error) {
      console.error('Error al guardar geometría:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar la geometría del proyecto',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWKTChange = (value: string) => {
    setWktInput(value)
    try {
      // Intentar parsear WKT y actualizar coordenadas
      const match = value.match(/POLYGON\(\(([^)]+)\)\)/)
      if (match) {
        const coordsStr = match[1]
        const coords = coordsStr.split(',').map(coord => {
          const [lng, lat] = coord.trim().split(' ').map(Number)
          return { latitud: lat, longitud: lng }
        })
        setCoordenadas(coords)
      }
    } catch (error) {
      console.error('Error al parsear WKT:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiSquare className="h-5 w-5" />
            Editor de Geometría del Proyecto
          </DialogTitle>
          <DialogDescription>
            Define la geometría del proyecto (matriz general) haciendo clic en el mapa o ingresando coordenadas WKT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mapa */}
          <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300">
            <MapContainer
              center={centro}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <MapEvents onMapClick={handleMapClick} />
              
              {/* Marcadores de puntos */}
              {coordenadas.map((coord, index) => (
                <Marker
                  key={index}
                  position={[coord.latitud, coord.longitud]}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target
                      const latlng = marker.getLatLng()
                      handleMovePoint(index, latlng.lat, latlng.lng)
                    }
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-medium">Punto {index + 1}</p>
                      <p className="text-sm text-gray-600">
                        {coord.latitud.toFixed(6)}, {coord.longitud.toFixed(6)}
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePoint(index)}
                        className="mt-2"
                      >
                        <FiTrash2 className="h-3 w-3" />
                        Eliminar
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Polígono */}
              {coordenadas.length >= 3 && (
                <Polygon
                  positions={coordenadas.map(coord => [coord.latitud, coord.longitud])}
                  color="blue"
                  fillColor="blue"
                  fillOpacity={0.2}
                />
              )}
            </MapContainer>
          </div>

          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Puntos del Polígono ({coordenadas.length})</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {coordenadas.map((coord, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Punto {index + 1}:</span>
                    <span>{coord.latitud.toFixed(6)}, {coord.longitud.toFixed(6)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePoint(index)}
                    >
                      <FiTrash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {coordenadas.length === 0 && (
                <p className="text-sm text-gray-500">
                  Haz clic en el mapa para agregar puntos al polígono
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>WKT (Well-Known Text)</Label>
              <Textarea
                value={wktInput}
                onChange={(e) => handleWKTChange(e.target.value)}
                placeholder="POLYGON((lng1 lat1, lng2 lat2, lng3 lat3, lng1 lat1))"
                className="h-32"
              />
              <p className="text-xs text-gray-500">
                Formato: POLYGON((longitud1 latitud1, longitud2 latitud2, ...))
              </p>
            </div>
          </div>

          {/* Información */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instrucciones:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Haz clic en el mapa para agregar puntos al polígono</li>
              <li>• Arrastra los marcadores para ajustar las posiciones</li>
              <li>• Haz clic en "Eliminar" para quitar puntos</li>
              <li>• El polígono se cierra automáticamente</li>
              <li>• También puedes ingresar coordenadas en formato WKT</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <FiX className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || coordenadas.length < 3}>
            <FiSave className="h-4 w-4 mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar Geometría'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
