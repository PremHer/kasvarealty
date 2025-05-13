'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from 'leaflet'

interface LocationData {
  latitud: number
  longitud: number
  direccion: string
  departamento?: string
  provincia?: string
  distrito?: string
}

interface MapPickerProps {
  onLocationSelect?: (location: LocationData) => void
  initialLocation?: {
    latitud: number
    longitud: number
  }
  readOnly?: boolean
}

// Corregir el ícono del marcador (problema común con Leaflet)
const icon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapEvents({ onLocationSelect, readOnly }: { onLocationSelect?: (location: LocationData) => void, readOnly?: boolean }) {
  useMapEvents({
    click: async (e) => {
      if (readOnly) return
      
      const { lat, lng } = e.latlng
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        )
        const data = await response.json()
        
        const locationData: LocationData = {
          latitud: lat,
          longitud: lng,
          direccion: data.display_name,
          departamento: data.address?.state,
          provincia: data.address?.county,
          distrito: data.address?.city || data.address?.town || data.address?.village
        }
        
        onLocationSelect?.(locationData)
      } catch (error) {
        console.error('Error al obtener la dirección:', error)
      }
    }
  })
  return null
}

export default function MapPicker({ onLocationSelect, initialLocation, readOnly = false }: MapPickerProps) {
  const [marker, setMarker] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitud, initialLocation.longitud] : null
  )

  const handleMapClick = (location: LocationData) => {
    if (readOnly) return
    setMarker([location.latitud, location.longitud])
    onLocationSelect?.(location)
  }

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={marker || [-12.0464, -77.0428]} // Lima, Perú
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {marker && <Marker position={marker} icon={icon} />}
        <MapEvents onLocationSelect={handleMapClick} readOnly={readOnly} />
      </MapContainer>
    </div>
  )
} 