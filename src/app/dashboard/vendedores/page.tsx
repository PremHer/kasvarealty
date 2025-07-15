'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, TrendingUp, Users, DollarSign, Target, Award, Calendar, Phone, Mail, MapPin, Star, Activity } from 'lucide-react'
import Link from 'next/link'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  isActive: boolean
}

interface PerfilVendedor {
  id: string
  codigoVendedor: string
  especialidad?: string
  experienciaAnos: number
  telefono?: string
  direccion?: string
  fechaContratacion?: string
  fechaTerminacion?: string
  estado: 'ACTIVO' | 'INACTIVO'
  comisionBase: number
  comisionPorcentaje: number
  comisionMinima: number
  comisionMaxima?: number
  metaMensual?: number
  metaAnual?: number
  observaciones?: string
  habilidades?: string
  certificaciones?: string
  createdAt: string
  usuario: Usuario
  creadoPorUsuario?: {
    id: string
    nombre: string
    email: string
  }
}

interface EstadisticasVendedor {
  vendedor: PerfilVendedor
  estadisticas: {
    totalVentas: number
    totalVentasLotes: number
    totalVentasUnidades: number
    totalIngresos: number
    comisionTotal: number
    comisionPorcentaje: number
    ventasAprobadas: number
    ventasPendientes: number
    ventasDesaprobadas: number
    ventasPorMes: number[]
    promedioVentasPorMes: number
    rendimiento: number
    estadisticasComision: {
      comisionTotal: number
      comisionPromedio: number
      comisionMinima: number
      comisionMaxima: number
      porcentajePromedio: number
      porcentajeMinimo: number
      porcentajeMaximo: number
      ventasConComision: number
      totalVentas: number
    }
    ventasPorTipoProyecto: {
      [key: string]: {
        nombre: string
        tipo: string
        cantidad: number
        ingresos: number
        comisiones: number
        color: string
      }
    }
  }
}

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState<PerfilVendedor[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasVendedor[]>([])
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVendedor, setEditingVendedor] = useState<PerfilVendedor | null>(null)
  const [formData, setFormData] = useState({
    usuarioId: '',
    codigoVendedor: '',
    experienciaAnos: '0',
    telefono: '',
    direccion: '',
    fechaAlta: '',
    observaciones: '',
    habilidades: '',
    certificaciones: ''
  })
  const { toast } = useToast()

  // Cargar vendedores
  const fetchVendedores = async () => {
    try {
      const response = await fetch('/api/vendedores')
      if (response.ok) {
        const data = await response.json()
        setVendedores(data.vendedores)
      }
    } catch (error) {
      console.error('Error al cargar vendedores:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar los perfiles de vendedores',
        variant: 'destructive'
      })
    }
  }

  // Cargar estadísticas
  const fetchEstadisticas = async () => {
    try {
      const response = await fetch('/api/vendedores/estadisticas')
      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data.estadisticas)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  // Cargar usuarios disponibles
  const fetchUsuariosDisponibles = async () => {
    try {
      const response = await fetch('/api/vendedores/usuarios-disponibles')
      if (response.ok) {
        const data = await response.json()
        setUsuariosDisponibles(data.vendedores || [])
      }
    } catch (error) {
      console.error('Error al cargar usuarios disponibles:', error)
      setUsuariosDisponibles([])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchVendedores(), fetchEstadisticas(), fetchUsuariosDisponibles()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.usuarioId) {
      toast({
        title: 'Error',
        description: 'Usuario es requerido',
        variant: 'destructive'
      })
      return
    }

    try {
      const url = editingVendedor 
        ? `/api/vendedores/${editingVendedor.id}`
        : '/api/vendedores'
      
      const method = editingVendedor ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const message = editingVendedor 
          ? 'Perfil de vendedor actualizado correctamente'
          : 'Perfil de vendedor creado correctamente'
        
        toast({
          title: 'Éxito',
          description: message
        })
        
        setIsModalOpen(false)
        setEditingVendedor(null)
        resetForm()
        fetchVendedores()
        fetchEstadisticas()
        fetchUsuariosDisponibles()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al procesar la solicitud')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar la solicitud',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (vendedor: PerfilVendedor) => {
    setEditingVendedor(vendedor)
    setFormData({
      usuarioId: vendedor.usuario.id,
      codigoVendedor: vendedor.codigoVendedor,
      experienciaAnos: vendedor.experienciaAnos.toString(),
      telefono: vendedor.telefono || '',
      direccion: vendedor.direccion || '',
      fechaAlta: vendedor.fechaContratacion ? vendedor.fechaContratacion.split('T')[0] : '',
      observaciones: vendedor.observaciones || '',
      habilidades: vendedor.habilidades || '',
      certificaciones: vendedor.certificaciones || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/vendedores/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Perfil de vendedor eliminado correctamente'
        })
        fetchVendedores()
        fetchEstadisticas()
        fetchUsuariosDisponibles()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al eliminar',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      usuarioId: '',
      codigoVendedor: '',
      experienciaAnos: '0',
      telefono: '',
      direccion: '',
      fechaAlta: '',
      observaciones: '',
      habilidades: '',
      certificaciones: ''
    })
  }

  const openModal = () => {
    setEditingVendedor(null)
    resetForm()
    setIsModalOpen(true)
  }

  // Función para generar código de vendedor automático
  const generarCodigoVendedor = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `V${timestamp}${random}`
  }

  // Función para actualizar código cuando se selecciona un usuario
  const handleUsuarioChange = (usuarioId: string) => {
    const codigoVendedor = generarCodigoVendedor()
    setFormData(prev => ({ 
      ...prev, 
      usuarioId,
      codigoVendedor
    }))
  }

  // Obtener estadísticas de un vendedor específico
  const getEstadisticasVendedor = (vendedorId: string) => {
    return estadisticas.find(stat => stat.vendedor.id === vendedorId)?.estadisticas
  }

  // Calcular totales generales
  const totalesGenerales = estadisticas.reduce((acc, stat) => ({
    totalVentas: acc.totalVentas + stat.estadisticas.totalVentas,
    totalIngresos: acc.totalIngresos + stat.estadisticas.totalIngresos,
    totalComisiones: acc.totalComisiones + stat.estadisticas.comisionTotal,
    ventasAprobadas: acc.ventasAprobadas + stat.estadisticas.ventasAprobadas,
    ventasPendientes: acc.ventasPendientes + stat.estadisticas.ventasPendientes
  }), {
    totalVentas: 0,
    totalIngresos: 0,
    totalComisiones: 0,
    ventasAprobadas: 0,
    ventasPendientes: 0
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Cargando vendedores...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con título y botones */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Vendedores</h1>
          <p className="text-gray-600 mt-1">Administra los perfiles de vendedores del sistema</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/vendedores/estadisticas">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </Button>
          </Link>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={openModal} className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Vendedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingVendedor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                </DialogTitle>
                <p className="text-sm text-gray-600">
                  {editingVendedor ? 'Modifica la información del vendedor' : 'Crea un nuevo perfil de vendedor'}
                </p>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
                    <p className="text-sm text-gray-600">Datos principales del vendedor</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="usuarioId" className="text-sm font-medium text-gray-700">
                        Usuario *
                      </Label>
                      <Select
                        value={formData.usuarioId}
                        onValueChange={(value) => {
                          handleUsuarioChange(value)
                        }}
                        disabled={!!editingVendedor}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {usuariosDisponibles.map((usuario) => (
                            <SelectItem key={usuario.id} value={usuario.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{usuario.nombre}</span>
                                <span className="text-xs text-gray-500">{usuario.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigoVendedor" className="text-sm font-medium text-gray-700">
                        Código de Vendedor
                      </Label>
                      {formData.codigoVendedor ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <span className="font-mono text-sm text-blue-800 font-semibold">{formData.codigoVendedor}</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                          <span className="text-sm text-gray-500">Se generará automáticamente al seleccionar un usuario</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experienciaAnos" className="text-sm font-medium text-gray-700">
                        Años de Experiencia
                      </Label>
                      <Input
                        type="number"
                        value={formData.experienciaAnos}
                        onChange={(e) => setFormData(prev => ({ ...prev, experienciaAnos: e.target.value }))}
                        placeholder="0"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                        Teléfono
                      </Label>
                      <Input
                        value={formData.telefono}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                        placeholder="+51 999 999 999"
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fechaAlta" className="text-sm font-medium text-gray-700">
                        Fecha de Alta
                      </Label>
                      <Input
                        type="date"
                        value={formData.fechaAlta}
                        onChange={(e) => setFormData(prev => ({ ...prev, fechaAlta: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-lg font-medium text-gray-900">Información Adicional</h3>
                    <p className="text-sm text-gray-600">Datos complementarios del vendedor</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="direccion" className="text-sm font-medium text-gray-700">
                        Dirección
                      </Label>
                      <Input
                        value={formData.direccion}
                        onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                        placeholder="Dirección completa"
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="habilidades" className="text-sm font-medium text-gray-700">
                          Habilidades
                        </Label>
                        <Textarea
                          value={formData.habilidades}
                          onChange={(e) => setFormData(prev => ({ ...prev, habilidades: e.target.value }))}
                          placeholder="Habilidades especiales del vendedor"
                          rows={3}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="certificaciones" className="text-sm font-medium text-gray-700">
                          Certificaciones
                        </Label>
                        <Textarea
                          value={formData.certificaciones}
                          onChange={(e) => setFormData(prev => ({ ...prev, certificaciones: e.target.value }))}
                          placeholder="Certificaciones del vendedor"
                          rows={3}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700">
                        Observaciones
                      </Label>
                      <Textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                        placeholder="Observaciones adicionales"
                        rows={3}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="px-6"
                  >
                    {editingVendedor ? 'Actualizar' : 'Crear'} Vendedor
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendedores.length}</div>
            <p className="text-xs text-muted-foreground">
              Vendedores activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalesGenerales.totalVentas}</div>
            <p className="text-xs text-muted-foreground">
              Ventas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalesGenerales.totalIngresos)}</div>
            <p className="text-xs text-muted-foreground">
              Total generado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalesGenerales.totalComisiones)}</div>
            <p className="text-xs text-muted-foreground">
              Comisiones pagadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de vendedores con estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Vendedores y Rendimiento</h2>
          <p className="text-sm text-gray-600 mt-1">
            {vendedores.length} vendedor{vendedores.length !== 1 ? 'es' : ''} registrado{vendedores.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {vendedores.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {vendedores.map((vendedor) => {
              const stats = getEstadisticasVendedor(vendedor.id)
              return (
                <div key={vendedor.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Información principal del vendedor */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <span className="text-lg font-semibold text-white">
                            {vendedor.usuario.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {vendedor.usuario.nombre}
                          </h3>
                          <Badge variant={vendedor.estado === 'ACTIVO' ? 'default' : 'secondary'} className="text-xs">
                            {vendedor.estado}
                          </Badge>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {vendedor.codigoVendedor}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {vendedor.usuario.email}
                          </div>
                          {vendedor.telefono && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {vendedor.telefono}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-gray-600">
                              {vendedor.experienciaAnos} años de experiencia
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Target className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-gray-600">
                              {stats ? (
                                stats.estadisticasComision.ventasConComision > 0 ? (
                                  `${stats.estadisticasComision.porcentajePromedio.toFixed(1)}% (${stats.estadisticasComision.porcentajeMinimo.toFixed(1)}%-${stats.estadisticasComision.porcentajeMaximo.toFixed(1)}%)`
                                ) : 'Sin comisiones'
                              ) : `${vendedor.comisionPorcentaje}%`} comisión
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas principales */}
                    {stats && (
                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">
                            {stats.totalVentas}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Ventas</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.totalIngresos)}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Ingresos</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(stats.comisionTotal)}
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Comisiones</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {stats.rendimiento.toFixed(1)}%
                            </div>
                            <Activity className="h-5 w-5 ml-1 text-gray-400" />
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Rendimiento</div>
                        </div>
                      </div>
                    )}

                    {/* Acciones con iconos */}
                    <div className="flex items-center space-x-2 ml-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(vendedor)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el perfil del vendedor.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(vendedor.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Detalles adicionales en cards */}
                  {stats && (
                    <div className="mt-6">
                      {/* Estadísticas de estado de ventas */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-green-700">{stats.ventasAprobadas}</div>
                              <div className="text-sm text-green-600 font-medium">Aprobadas</div>
                            </div>
                            <div className="h-8 w-8 bg-green-200 rounded-full flex items-center justify-center">
                              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-yellow-700">{stats.ventasPendientes}</div>
                              <div className="text-sm text-yellow-600 font-medium">Pendientes</div>
                            </div>
                            <div className="h-8 w-8 bg-yellow-200 rounded-full flex items-center justify-center">
                              <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold text-red-700">{stats.ventasDesaprobadas}</div>
                              <div className="text-sm text-red-600 font-medium">Desaprobadas</div>
                            </div>
                            <div className="h-8 w-8 bg-red-200 rounded-full flex items-center justify-center">
                              <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ventas por tipo de proyecto */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                          Ventas por Tipo de Proyecto
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(stats.ventasPorTipoProyecto)
                            .filter(([_, data]) => data.cantidad > 0)
                            .map(([key, data]) => {
                              const colorClasses = {
                                blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700 bg-blue-200 text-blue-600',
                                purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700 bg-purple-200 text-purple-600',
                                orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700 bg-orange-200 text-orange-600',
                                green: 'from-green-50 to-green-100 border-green-200 text-green-700 bg-green-200 text-green-600',
                                red: 'from-red-50 to-red-100 border-red-200 text-red-700 bg-red-200 text-red-600',
                                indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700 bg-indigo-200 text-indigo-600',
                                pink: 'from-pink-50 to-pink-100 border-pink-200 text-pink-700 bg-pink-200 text-pink-600',
                                yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700 bg-yellow-200 text-yellow-600'
                              }
                              
                              const [bgClass, borderClass, textClass, iconBgClass, iconTextClass] = colorClasses[data.color as keyof typeof colorClasses]?.split(' ') || colorClasses.blue.split(' ')
                              
                              return (
                                <div key={key} className={`bg-gradient-to-r ${bgClass} p-4 rounded-lg border ${borderClass}`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className={`text-2xl font-bold ${textClass}`}>{data.cantidad}</div>
                                      <div className={`text-sm ${textClass} font-medium`}>{data.nombre}</div>
                                      <div className={`text-xs ${textClass} opacity-75`}>{data.tipo}</div>
                                    </div>
                                    <div className={`h-8 w-8 ${iconBgClass} rounded-full flex items-center justify-center`}>
                                      <svg className={`h-4 w-4 ${iconTextClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay vendedores</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando el primer perfil de vendedor.
            </p>
            <div className="mt-6">
              <Button onClick={openModal}>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Vendedor
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 