'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { FiLoader } from 'react-icons/fi'
import type { ReservaWithRelations, ReservaFormData } from '@/types/reserva'

interface ReservaModalProps {
  isOpen: boolean
  onClose: () => void
  reserva: ReservaWithRelations | null
  onSuccess: () => void
  proyectoId?: string
}

export default function ReservaModal({ isOpen, onClose, reserva, onSuccess, proyectoId }: ReservaModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<ReservaFormData>({
    proyectoId: proyectoId || '',
    loteId: '',
    unidadCementerioId: '',
    clienteId: '',
    vendedorId: '',
    montoReserva: 0,
    fechaVencimiento: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  // Fetch información del proyecto actual si se proporciona proyectoId
  const { data: proyectoActual, isLoading: isLoadingProyecto, error: proyectoError } = useQuery({
    queryKey: ['proyecto', proyectoId],
    queryFn: async () => {
      if (!proyectoId) return null
      const response = await fetch(`/api/proyectos/${proyectoId}`)
      if (!response.ok) throw new Error('Error al cargar proyecto')
      return response.json()
    },
    enabled: !!proyectoId,
  })

  // Fetch proyectos solo si no se proporciona proyectoId
  const { data: proyectos } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const response = await fetch('/api/proyectos')
      if (!response.ok) throw new Error('Error al cargar proyectos')
      return response.json()
    },
    enabled: !proyectoId, // Solo cargar si no se proporciona proyectoId
  })

  // Fetch clientes
  const { data: clientes, isLoading: isLoadingClientes, error: errorClientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const response = await fetch('/api/clientes')
      if (!response.ok) {
        console.error('Error al cargar clientes:', response.status, response.statusText)
        throw new Error('Error al cargar clientes')
      }
      const data = await response.json()
      console.log('Clientes cargados:', data)
      return data
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

  // Fetch lotes del proyecto si se proporciona proyectoId
  const { data: lotes, isLoading: isLoadingLotes } = useQuery({
    queryKey: ['lotes', proyectoId],
    queryFn: async () => {
      if (!proyectoId) return null
      const response = await fetch(`/api/proyectos/${proyectoId}/lotes`)
      if (!response.ok) throw new Error('Error al cargar lotes')
      return response.json()
    },
    enabled: !!proyectoId
  })

  // Fetch unidades de cementerio del proyecto si se proporciona proyectoId
  const { data: unidadesCementerio, isLoading: isLoadingUnidades } = useQuery({
    queryKey: ['unidades-cementerio', proyectoId],
    queryFn: async () => {
      if (!proyectoId) return null
      const response = await fetch(`/api/proyectos/${proyectoId}/unidades-cementerio`)
      if (!response.ok) throw new Error('Error al cargar unidades de cementerio')
      return response.json()
    },
    enabled: !!proyectoId
  })

  // Mutation para crear/actualizar reserva
  const mutation = useMutation({
    mutationFn: async (data: ReservaFormData) => {
      const url = reserva ? `/api/reservas/${reserva.id}` : '/api/reservas'
      const method = reserva ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al procesar la reserva')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] })
      onSuccess()
      toast({
        title: 'Éxito',
        description: reserva ? 'Reserva actualizada correctamente' : 'Reserva creada correctamente',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Actualizar formData cuando cambia la reserva o se abre el modal
  useEffect(() => {
    if (reserva) {
      setFormData({
        proyectoId: reserva.proyectoId,
        loteId: reserva.loteId || '',
        unidadCementerioId: reserva.unidadCementerioId || '',
        clienteId: reserva.clienteId,
        vendedorId: reserva.vendedorId,
        montoReserva: reserva.montoReserva,
        fechaVencimiento: new Date(reserva.fechaVencimiento).toISOString().split('T')[0],
        observaciones: reserva.observaciones || '',
      })
    } else if (isOpen) {
      setFormData({
        proyectoId: proyectoId || '',
        loteId: '',
        unidadCementerioId: '',
        clienteId: '',
        vendedorId: '',
        montoReserva: 0,
        fechaVencimiento: new Date().toISOString().split('T')[0],
        observaciones: '',
      })
    }
  }, [reserva, isOpen, proyectoId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleClose = () => {
    setFormData({
      proyectoId: '',
      loteId: '',
      unidadCementerioId: '',
      clienteId: '',
      vendedorId: '',
      montoReserva: 0,
      fechaVencimiento: new Date().toISOString().split('T')[0],
      observaciones: '',
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reserva ? 'Editar Reserva' : proyectoId ? 'Nueva Reserva - Proyecto' : 'Nueva Reserva'}
          </DialogTitle>
          {proyectoId && !reserva && (
            <p className="text-sm text-gray-600">
              Creando reserva para el proyecto seleccionado. Selecciona una unidad disponible y completa los datos del cliente.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {proyectoId && (isLoadingProyecto ? (
            // Estado de carga
            <div>
              <Label>Proyecto</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ) : proyectoActual ? (
            // Layout específico cuando se accede desde un proyecto
            <>
              <div>
                <Label>Proyecto</Label>
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="font-medium text-blue-900">{proyectoActual.name || 'Proyecto'}</div>
                  <div className="text-sm text-blue-700 space-y-1 mt-1">
                    <div><span className="font-medium">Tipo:</span> {proyectoActual.type || 'N/A'}</div>
                    <div><span className="font-medium">Estado:</span> {proyectoActual.status || 'N/A'}</div>
                    {proyectoActual.location && (
                      <div><span className="font-medium">Ubicación:</span> {proyectoActual.location}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clienteId">Cliente *</Label>
                  <Select
                    value={formData.clienteId}
                    onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingClientes ? (
                        <SelectItem value="" disabled>Cargando clientes...</SelectItem>
                      ) : errorClientes ? (
                        <SelectItem value="" disabled>Error al cargar clientes</SelectItem>
                      ) : clientes && clientes.length > 0 ? (
                        clientes.map((cliente: any) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.razonSocial || `${cliente.nombre} ${cliente.apellido || ''}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No hay clientes disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vendedorId">Vendedor *</Label>
                  <Select
                    value={formData.vendedorId}
                    onValueChange={(value) => setFormData({ ...formData, vendedorId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingVendedores ? (
                        <SelectItem value="" disabled>Cargando vendedores...</SelectItem>
                      ) : errorVendedores ? (
                        <SelectItem value="" disabled>Error al cargar vendedores</SelectItem>
                      ) : vendedores && vendedores.length > 0 ? (
                        vendedores.map((vendedor: any) => (
                          <SelectItem key={vendedor.id} value={vendedor.id}>
                            {vendedor.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No hay vendedores disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : (
            // Layout original cuando no se proporciona proyectoId
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proyectoId">Proyecto *</Label>
                <Select
                  value={formData.proyectoId}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      proyectoId: value,
                      loteId: '',
                      unidadCementerioId: '',
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {proyectos?.proyectos?.map((proyecto: any) => (
                      <SelectItem key={proyecto.id} value={proyecto.id}>
                        {proyecto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="clienteId">Cliente *</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes?.map((cliente: any) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.razonSocial || `${cliente.nombre} ${cliente.apellido || ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loteId">Lote</Label>
              <Select
                value={formData.loteId}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    loteId: value,
                    unidadCementerioId: '',
                  })
                }}
                disabled={!proyectoId && !formData.proyectoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NINGUNO">Ninguno</SelectItem>
                  {isLoadingLotes ? (
                    <SelectItem value="loading" disabled>Cargando lotes...</SelectItem>
                  ) : lotes?.lotes?.filter((lote: any) => lote.estado === 'DISPONIBLE').map((lote: any) => (
                    <SelectItem key={lote.id} value={lote.id}>
                      Lote {lote.numero} - {lote.area}m²
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unidadCementerioId">Unidad Cementerio</Label>
              <Select
                value={formData.unidadCementerioId}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    unidadCementerioId: value,
                    loteId: '',
                  })
                }}
                disabled={!proyectoId && !formData.proyectoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NINGUNA">Ninguna</SelectItem>
                  {isLoadingUnidades ? (
                    <SelectItem value="loading" disabled>Cargando unidades...</SelectItem>
                  ) : unidadesCementerio?.unidades?.filter((unidad: any) => unidad.estado === 'DISPONIBLE').map((unidad: any) => (
                    <SelectItem key={unidad.id} value={unidad.id}>
                      {unidad.tipoUnidad} {unidad.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="montoReserva">Monto de Reserva *</Label>
              <Input
                id="montoReserva"
                type="number"
                step="0.01"
                value={formData.montoReserva}
                onChange={(e) => setFormData({ ...formData, montoReserva: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="vendedorId">Vendedor *</Label>
              <Select
                value={formData.vendedorId}
                onValueChange={(value) => setFormData({ ...formData, vendedorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingVendedores ? (
                    <SelectItem value="" disabled>Cargando vendedores...</SelectItem>
                  ) : errorVendedores ? (
                    <SelectItem value="" disabled>Error al cargar vendedores</SelectItem>
                  ) : vendedores && vendedores.length > 0 ? (
                    vendedores.map((vendedor: any) => (
                      <SelectItem key={vendedor.id} value={vendedor.id}>
                        {vendedor.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No hay vendedores disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <FiLoader className="mr-2 h-4 w-4 animate-spin" />}
              {reserva ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 