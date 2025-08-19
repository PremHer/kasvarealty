'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FiPlus, FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EstadoReserva } from '@prisma/client'
import type { ReservaWithRelations, ReservaFilters } from '@/types/reserva'
import ReservaModal from '@/components/reservas/ReservaModal'
import ConvertirReservaModal from '@/components/reservas/ConvertirReservaModal'

interface ProjectReservasProps {
  proyectoId: string
}

export default function ProjectReservas({ proyectoId }: ProjectReservasProps) {
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConvertirModalOpen, setIsConvertirModalOpen] = useState(false)
  const [selectedReserva, setSelectedReserva] = useState<ReservaWithRelations | null>(null)
  const [filters, setFilters] = useState<ReservaFilters>({
    search: '',
    estado: 'TODOS',
    vendedorId: 'TODOS',
  })

  // Fetch reservas del proyecto
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reservas', proyectoId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('proyectoId', proyectoId)
      if (filters.search) params.append('search', filters.search)
      if (filters.estado && filters.estado !== 'TODOS') params.append('estado', filters.estado)
      if (filters.vendedorId && filters.vendedorId !== 'TODOS') params.append('vendedorId', filters.vendedorId)

      const response = await fetch(`/api/reservas?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error al cargar reservas')
      }
      return response.json()
    },
  })

  // Fetch vendedores
  const { data: vendedores, isLoading: isLoadingVendedores, error: errorVendedores } = useQuery({
    queryKey: ['vendedores'],
    queryFn: async () => {
      // Obtener perfiles de vendedor activos
      const response = await fetch('/api/vendedores')
      if (!response.ok) {
        console.error('Error al cargar vendedores:', response.status, response.statusText)
        throw new Error('Error al cargar vendedores')
      }
      const data = await response.json()
      console.log('Perfiles de vendedor cargados:', data)
      
      // Extraer solo los usuarios de los perfiles de vendedor
      const usuariosVendedores = data.vendedores.map((perfil: any) => perfil.usuario)
      console.log('Usuarios vendedores extraídos:', usuariosVendedores)
      return usuariosVendedores
    },
  })

  const handleCreateReserva = () => {
    setSelectedReserva(null)
    setIsModalOpen(true)
  }

  const handleEditReserva = (reserva: ReservaWithRelations) => {
    setSelectedReserva(reserva)
    setIsModalOpen(true)
  }

  const handleConvertirReserva = (reserva: ReservaWithRelations) => {
    setSelectedReserva(reserva)
    setIsConvertirModalOpen(true)
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    setIsConvertirModalOpen(false)
    setSelectedReserva(null)
    refetch()
    toast({
      title: 'Éxito',
      description: 'Operación realizada correctamente',
    })
  }

  const getEstadoConfig = (estado: EstadoReserva) => {
    const configs = {
      PENDIENTE: { label: 'Pendiente', variant: 'secondary' as const },
      CONFIRMADA: { label: 'Confirmada', variant: 'default' as const },
      CONVERTIDA: { label: 'Convertida', variant: 'success' as const },
      EXPIRADA: { label: 'Expirada', variant: 'destructive' as const },
      CANCELADA: { label: 'Cancelada', variant: 'destructive' as const },
    }
    return configs[estado] || configs.PENDIENTE
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(amount)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error al cargar las reservas</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reservas del Proyecto</h2>
        <Button onClick={handleCreateReserva}>
          <FiPlus className="mr-2 h-4 w-4" />
          Nueva Reserva
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar reservas..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select
              value={filters.estado}
              onValueChange={(value) => setFilters({ ...filters, estado: value as EstadoReserva | 'TODOS' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                <SelectItem value="CONVERTIDA">Convertida</SelectItem>
                <SelectItem value="EXPIRADA">Expirada</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.vendedorId}
              onValueChange={(value) => setFilters({ ...filters, vendedorId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los vendedores</SelectItem>
                {vendedores?.map((vendedor: any) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    {vendedor.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de reservas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Reservas</CardTitle>
            <Button variant="outline" onClick={() => refetch()}>
              <FiRefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.reservas?.map((reserva: ReservaWithRelations) => {
                  const estadoConfig = getEstadoConfig(reserva.estado)
                  const clienteNombre = reserva.cliente.razonSocial || 
                    `${reserva.cliente.nombre} ${reserva.cliente.apellido || ''}`.trim()
                  const unidadInfo = reserva.lote 
                    ? `Lote ${reserva.lote.numero} (${reserva.lote.area}m²)`
                    : reserva.unidadCementerio 
                    ? `${reserva.unidadCementerio.tipoUnidad} ${reserva.unidadCementerio.codigo}`
                    : 'N/A'

                  return (
                    <TableRow key={reserva.id}>
                      <TableCell className="font-medium">
                        {reserva.numeroReserva}
                      </TableCell>
                      <TableCell>{clienteNombre}</TableCell>
                      <TableCell>{unidadInfo}</TableCell>
                      <TableCell>{reserva.vendedor.nombre}</TableCell>
                      <TableCell>{formatCurrency(reserva.montoReserva)}</TableCell>
                      <TableCell>
                        {format(new Date(reserva.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={estadoConfig.variant}>
                          {estadoConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {reserva.estado === 'PENDIENTE' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditReserva(reserva)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleConvertirReserva(reserva)}
                              >
                                Convertir
                              </Button>
                            </>
                          )}
                          {reserva.estado === 'CONVERTIDA' && (
                            <Badge variant="success">Convertida</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {data?.reservas?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron reservas para este proyecto
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <ReservaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reserva={selectedReserva}
        onSuccess={handleModalSuccess}
        proyectoId={proyectoId}
      />

      <ConvertirReservaModal
        isOpen={isConvertirModalOpen}
        onClose={() => setIsConvertirModalOpen(false)}
        reserva={selectedReserva}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
} 