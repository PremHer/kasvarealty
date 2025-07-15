'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiUser, 
  FiCalendar,
  FiActivity,
  FiDownload
} from 'react-icons/fi'

interface RegistroAuditoria {
  id: string
  tipo: string
  accion: string
  detalles?: string
  entidad?: string
  entidadId?: string
  ip?: string
  userAgent?: string
  fecha: string
  usuario: {
    id: string
    nombre: string
    email: string
  }
}

interface Paginacion {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    usuarioId: '',
    fechaInicio: '',
    fechaFin: ''
  })
  const { toast } = useToast()

  // Cargar registros de auditoría
  const fetchRegistros = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filtros.tipo && filtros.tipo !== 'todos' && { tipo: filtros.tipo }),
        ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
        ...(filtros.fechaInicio && { fechaInicio: filtros.fechaInicio }),
        ...(filtros.fechaFin && { fechaFin: filtros.fechaFin })
      })
      
      const response = await fetch(`/api/auditoria?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRegistros(data.registros)
        setPaginacion(data.paginacion)
      } else {
        throw new Error('Error al cargar registros')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar los registros de auditoría',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistros()
  }, [filtros])

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      tipo: 'todos',
      usuarioId: '',
      fechaInicio: '',
      fechaFin: ''
    })
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'VENTA':
        return 'bg-green-100 text-green-800'
      case 'USUARIO':
        return 'bg-blue-100 text-blue-800'
      case 'SISTEMA':
        return 'bg-gray-100 text-gray-800'
      case 'SEGURIDAD':
        return 'bg-red-100 text-red-800'
      case 'FINANZAS':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccionIcon = (accion: string) => {
    switch (accion.toLowerCase()) {
      case 'crear':
      case 'create':
        return '➕'
      case 'actualizar':
      case 'update':
        return '✏️'
      case 'eliminar':
      case 'delete':
        return '🗑️'
      case 'iniciar sesión':
      case 'login':
        return '🔐'
      case 'cerrar sesión':
      case 'logout':
        return '🚪'
      case 'aprobar':
        return '✅'
      case 'rechazar':
        return '❌'
      default:
        return '📝'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const exportarRegistros = async () => {
    try {
      const params = new URLSearchParams({
        limit: '1000', // Exportar más registros
        ...(filtros.tipo && filtros.tipo !== 'todos' && { tipo: filtros.tipo }),
        ...(filtros.usuarioId && { usuarioId: filtros.usuarioId }),
        ...(filtros.fechaInicio && { fechaInicio: filtros.fechaInicio }),
        ...(filtros.fechaFin && { fechaFin: filtros.fechaFin })
      })
      
      const response = await fetch(`/api/auditoria?${params}`)
      if (response.ok) {
        const data = await response.json()
        
        // Crear CSV
        const csvContent = [
          'Fecha,Tipo,Acción,Usuario,Detalles,Entidad,IP',
          ...data.registros.map((r: RegistroAuditoria) => 
            `"${formatDate(r.fecha)}","${r.tipo}","${r.accion}","${r.usuario.nombre}","${r.detalles || ''}","${r.entidad || ''}","${r.ip || ''}"`
          )
        ].join('\n')
        
        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `auditoria_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: 'Éxito',
          description: 'Registros exportados correctamente'
        })
      }
    } catch (error) {
      console.error('Error al exportar:', error)
      toast({
        title: 'Error',
        description: 'Error al exportar los registros',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Cargando registros de auditoría...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Auditoría del Sistema</h1>
        <Button onClick={exportarRegistros} variant="outline" className="flex items-center gap-2">
          <FiDownload className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiFilter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo de Evento</Label>
              <Select value={filtros.tipo} onValueChange={(value) => handleFiltroChange('tipo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="VENTA">Ventas</SelectItem>
                  <SelectItem value="USUARIO">Usuarios</SelectItem>
                  <SelectItem value="SISTEMA">Sistema</SelectItem>
                  <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
                  <SelectItem value="FINANZAS">Finanzas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={limpiarFiltros} variant="outline" className="w-full">
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiActivity className="h-5 w-5" />
            Registros de Auditoría
            {paginacion && (
              <Badge variant="outline">
                {paginacion.total} registros
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registros.map((registro) => (
              <div key={registro.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{getAccionIcon(registro.accion)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{registro.accion}</span>
                        <Badge className={getTipoColor(registro.tipo)}>
                          {registro.tipo}
                        </Badge>
                        {registro.entidad && (
                          <Badge variant="outline">
                            {registro.entidad}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {registro.detalles || 'Sin detalles adicionales'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiUser className="h-3 w-3" />
                          <span>{registro.usuario.nombre}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiCalendar className="h-3 w-3" />
                          <span>{formatDate(registro.fecha)}</span>
                        </div>
                        {registro.ip && (
                          <span>IP: {registro.ip}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {registros.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron registros de auditoría
              </div>
            )}
          </div>

          {/* Paginación */}
          {paginacion && paginacion.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRegistros(paginacion.page - 1)}
                disabled={paginacion.page <= 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {paginacion.page} de {paginacion.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRegistros(paginacion.page + 1)}
                disabled={paginacion.page >= paginacion.totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 