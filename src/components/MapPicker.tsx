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

// Función para encontrar la ubicación más cercana usando la API de Perú
async function findNearestLocation(lat: number, lng: number): Promise<LocationData> {
  try {
    // Primero intentamos con la API de Perú
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`
    )
    const data = await response.json()
    
    // Extraer la información de la dirección
    const address = data.address || {}
    
    // Mapear los campos según la estructura de Perú
    const locationData: LocationData = {
      latitud: lat,
      longitud: lng,
      direccion: data.display_name,
      departamento: address.state,
      provincia: address.county || address.state_district,
      distrito: address.city || address.town || address.village || address.suburb
    }

    // Si no tenemos provincia o distrito, intentamos con una búsqueda más amplia
    if (!locationData.provincia || !locationData.distrito) {
      const searchResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${lat},${lng}&zoom=18&addressdetails=1&accept-language=es`
      )
      const searchData = await searchResponse.json()
      
      if (searchData && searchData.length > 0) {
        const nearestAddress = searchData[0].address
        locationData.provincia = locationData.provincia || nearestAddress.county || nearestAddress.state_district
        locationData.distrito = locationData.distrito || nearestAddress.city || nearestAddress.town || nearestAddress.village
      }
    }

    // Si aún no tenemos la información, intentamos con una búsqueda por radio
    if (!locationData.provincia || !locationData.distrito) {
      const radiusResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${lat},${lng}&radius=5000&addressdetails=1&accept-language=es`
      )
      const radiusData = await radiusResponse.json()
      
      if (radiusData && radiusData.length > 0) {
        const nearestAddress = radiusData[0].address
        locationData.provincia = locationData.provincia || nearestAddress.county || nearestAddress.state_district
        locationData.distrito = locationData.distrito || nearestAddress.city || nearestAddress.town || nearestAddress.village
      }
    }

    return locationData
  } catch (error) {
    console.error('Error al obtener la ubicación:', error)
    // Devolver datos básicos en caso de error
    return {
      latitud: lat,
      longitud: lng,
      direccion: 'Ubicación seleccionada',
      departamento: 'No disponible',
      provincia: 'No disponible',
      distrito: 'No disponible'
    }
  }
}

function MapEvents({ onLocationSelect, readOnly }: { onLocationSelect?: (location: LocationData) => void, readOnly?: boolean }) {
  useMapEvents({
    click: async (e) => {
      if (readOnly) return
      
      const { lat, lng } = e.latlng
      try {
        const locationData = await findNearestLocation(lat, lng)
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