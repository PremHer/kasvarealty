'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  fecha: string
  esDinamica?: boolean
}

export default function Notifications() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Cargar notificaciones
  const fetchNotificaciones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notificaciones')
      if (response.ok) {
        const data = await response.json()
        setNotificaciones(data.notificaciones)
        setNoLeidas(data.noLeidas)
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  // Marcar notificación como leída
  const marcarComoLeida = async (id: string) => {
    try {
      const response = await fetch(`/api/notificaciones/${id}/leer`, {
        method: 'PUT'
      })
      
      if (response.ok) {
        setNotificaciones(prev => 
          prev.map(n => n.id === id ? { ...n, leida: true } : n)
        )
        setNoLeidas(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error al marcar como leída:', error)
    }
  }

  // Marcar todas como leídas
  const marcarTodasComoLeidas = async () => {
    try {
      const response = await fetch('/api/notificaciones/marcar-todas-leidas', {
        method: 'PUT'
      })
      
      if (response.ok) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
        setNoLeidas(0)
        toast({
          title: 'Notificaciones',
          description: 'Todas las notificaciones han sido marcadas como leídas'
        })
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error)
    }
  }

  useEffect(() => {
    fetchNotificaciones()
    
    // Recargar notificaciones cada 5 minutos
    const interval = setInterval(fetchNotificaciones, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'VENTAS_PENDIENTES':
        return 'bg-yellow-100 text-yellow-800'
      case 'META_VENDEDOR':
        return 'bg-blue-100 text-blue-800'
      case 'COMISIONES':
        return 'bg-green-100 text-green-800'
      case 'SISTEMA':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'VENTAS_PENDIENTES':
        return '📋'
      case 'META_VENDEDOR':
        return '🎯'
      case 'COMISIONES':
        return '💰'
      case 'SISTEMA':
        return '🔔'
      default:
        return '📢'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`
    return date.toLocaleDateString('es-ES')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {noLeidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={marcarTodasComoLeidas}
              className="h-6 px-2 text-xs"
            >
              Marcar todas como leídas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center gap-2 w-full">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span>Cargando...</span>
            </div>
          </DropdownMenuItem>
        ) : notificaciones.length === 0 ? (
          <DropdownMenuItem disabled>
            <div className="flex items-center gap-2 w-full text-center">
              <span className="text-gray-500">No hay notificaciones</span>
            </div>
          </DropdownMenuItem>
        ) : (
          notificaciones.map((notificacion) => (
            <DropdownMenuItem
              key={notificacion.id}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                !notificacion.leida ? 'bg-blue-50' : ''
              }`}
              onClick={() => !notificacion.leida && marcarComoLeida(notificacion.id)}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-lg">{getTipoIcon(notificacion.tipo)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{notificacion.titulo}</span>
                      {!notificacion.leida && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notificacion.mensaje}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTipoColor(notificacion.tipo)}`}
                      >
                        {notificacion.tipo.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatTime(notificacion.fecha)}
                      </span>
                    </div>
                  </div>
                </div>
                {!notificacion.leida && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      marcarComoLeida(notificacion.id)
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        {notificaciones.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/notificaciones" className="w-full text-center">
                Ver todas las notificaciones
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 