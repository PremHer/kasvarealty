"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { ClienteModal } from './ClienteModal'
import { Cliente, TIPO_CLIENTE, EstadoCliente } from '@/types/cliente'
// import { TipoCliente, EstadoCliente } from '@prisma/client' // Eliminar
import { Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClienteActions } from './ClienteActions'
import { FiEdit2, FiTrash2, FiMoreVertical, FiEdit, FiUser, FiX, FiMail, FiInfo, FiHome } from 'react-icons/fi'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useSession } from 'next-auth/react'
import type { Rol } from '@prisma/client'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

interface ClienteListProps {
  clientes: Cliente[]
  onUpdate: (cliente: Cliente) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

interface ExtendedSession {
  user?: {
    id: string
    role: string
    empresaId?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function ClienteList({ clientes: initialClientes, onUpdate, onDelete }: ClienteListProps) {
  const router = useRouter()
  const { data: session } = useSession() as { data: ExtendedSession | null }
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null)
  const queryClient = useQueryClient()

  // Actualizar el estado local cuando cambian los props
  useEffect(() => {
    setClientes(initialClientes)
  }, [initialClientes])

  const ROLE_HIERARCHY: Record<Rol, Rol[]> = {
    SUPER_ADMIN: ['ADMIN', 'GERENTE_GENERAL', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
    ADMIN: ['GERENTE_GENERAL', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
    GERENTE_GENERAL: ['SALES_MANAGER', 'PROJECT_MANAGER', 'FINANCE_MANAGER', 'INVESTOR', 'GUEST'],
    SALES_MANAGER: ['SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'GUEST'],
    PROJECT_MANAGER: ['CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'GUEST'],
    FINANCE_MANAGER: ['ACCOUNTANT', 'FINANCE_ASSISTANT', 'GUEST'],
    DEVELOPER: ['GUEST'],
    SALES_REP: ['GUEST'],
    SALES_ASSISTANT: ['GUEST'],
    SALES_COORDINATOR: ['GUEST'],
    CONSTRUCTION_SUPERVISOR: ['GUEST'],
    QUALITY_CONTROL: ['GUEST'],
    PROJECT_ASSISTANT: ['GUEST'],
    ACCOUNTANT: ['GUEST'],
    FINANCE_ASSISTANT: ['GUEST'],
    INVESTOR: ['GUEST'],
    GUEST: []
  }

  const canCreateClientes = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL',
    'SALES_MANAGER',
    'SALES_REP',
    'SALES_ASSISTANT',
    'SALES_COORDINATOR'
  ].includes(session?.user?.role as Rol)

  const canEditClientes = (cliente: Cliente) => {
    const currentUserRole = session?.user?.role as Rol
    if (!currentUserRole) return false

    // SUPER_ADMIN y ADMIN pueden editar cualquier cliente
    if (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') return true

    // GERENTE_GENERAL puede editar clientes de su empresa
    if (currentUserRole === 'GERENTE_GENERAL') {
      return cliente.empresaId === session?.user?.empresaId
    }

    // Roles de ventas pueden editar clientes de su empresa
    if (['SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR'].includes(currentUserRole)) {
      return cliente.empresaId === session?.user?.empresaId
    }

    return false
  }

  const canDeleteClientes = (cliente: Cliente) => {
    const currentUserRole = session?.user?.role as Rol
    if (!currentUserRole) return false

    // Solo SUPER_ADMIN, ADMIN y GERENTE_GENERAL pueden eliminar clientes
    if (!['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL'].includes(currentUserRole)) return false

    // Si es GERENTE_GENERAL, solo puede eliminar clientes de su empresa
    if (currentUserRole === 'GERENTE_GENERAL') {
      return cliente.empresaId === session?.user?.empresaId
    }

    return true
  }

  const handleToggleStatus = async (cliente: Cliente) => {
    try {
      if (!session?.user || !canEditClientes(cliente)) {
        toast.error('No tienes permiso para cambiar el estado de los clientes')
        return
      }

      const newStatus = !cliente.isActive
      
      // Llamar a la API para actualizar el estado
      const response = await fetch(`/api/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del cliente')
      }

      const updatedCliente = await response.json()

      // Actualizar el estado local
      setClientes(prevClientes => 
        prevClientes.map(c => 
          c.id === cliente.id 
          ? { ...c, isActive: newStatus }
          : c
        )
      )

      // Refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      
      toast.success('Estado del cliente actualizado correctamente')
    } catch (error) {
      console.error('Error al cambiar estado del cliente:', error)
      toast.error('Error al cambiar el estado del cliente')
    }
  }

  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setSelectedCliente(null)
  }

  const handleDeleteClick = (cliente: Cliente) => {
    setClienteToDelete(cliente)
  }

  const handleDeleteConfirm = async () => {
    if (!clienteToDelete) return

    try {
      await onDelete(clienteToDelete.id)
      setClienteToDelete(null)
    } catch (error) {
      console.error('Error al eliminar el cliente:', error)
      toast.error('Error al eliminar el cliente')
    }
  }

  const handleEditClick = (cliente: Cliente) => {
    setClienteToEdit(cliente)
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (data: Partial<Cliente>) => {
    if (!clienteToEdit) return

    try {
      const updatedCliente = {
        ...clienteToEdit,
        ...data
      }
      await onUpdate(updatedCliente)
      setIsEditModalOpen(false)
      setClienteToEdit(null)
    } catch (error) {
      console.error('Error al actualizar el cliente:', error)
      toast.error('Error al actualizar el cliente')
    }
  }

  const getNombreCompleto = (cliente: Cliente) => {
    if (cliente.tipo === 'EMPRESA') {
      return cliente.representanteLegal || cliente.razonSocial || 'Sin representante legal'
    }
    return `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 'Sin nombre'
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th scope="col" className="w-1/3 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="w-1/4 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="w-1/4 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="w-1/6 px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr 
                    key={cliente.id} 
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleViewDetails(cliente)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 truncate" title={getNombreCompleto(cliente)}>
                            {cliente.tipo === 'EMPRESA' ? cliente.razonSocial : `${cliente.nombre} ${cliente.apellido}`}
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={cliente.email}>
                            {cliente.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={cliente.tipo === 'INDIVIDUAL' ? 'default' : 'secondary'} className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {cliente.tipo === 'INDIVIDUAL' ? 'Persona Natural' : 'Empresa'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={cliente.isActive}
                          onCheckedChange={() => handleToggleStatus(cliente)}
                          disabled={!canEditClientes(cliente)}
                          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                        />
                        <Badge variant={
                          cliente.isActive ? 'success' :
                          'secondary'
                        } className={
                          !cliente.isActive ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : ''
                        }>
                          {cliente.isActive ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {canEditClientes(cliente) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(cliente)}
                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <FiEdit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteClientes(cliente) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(cliente)}
                            className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Panel de Detalles */}
      {isDetailsOpen && selectedCliente && (
        <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <FiUser className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedCliente.tipo === 'EMPRESA' ? selectedCliente.razonSocial : `${selectedCliente.nombre} ${selectedCliente.apellido}`}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedCliente.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              {selectedCliente.tipo === 'INDIVIDUAL' ? (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FiUser className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Información Personal</h3>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Nombre:</span> {selectedCliente.nombre} {selectedCliente.apellido}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">DNI:</span> {selectedCliente.dni || '-'}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Sexo:</span> {selectedCliente.sexo || '-'}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Fecha de Nacimiento:</span> {selectedCliente.fechaNacimiento ? new Date(selectedCliente.fechaNacimiento).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : '-'}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Estado Civil:</span> {selectedCliente.estadoCivil || '-'}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Ocupación:</span> {selectedCliente.ocupacion || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FiUser className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Información de la Empresa</h3>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Razón Social:</span> {selectedCliente.razonSocial || '-'}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">RUC:</span> {selectedCliente.ruc || '-'}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Representante Legal:</span> {selectedCliente.representanteLegal || '-'}
                        </p>
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Cargo:</span> {selectedCliente.cargoRepresentante || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <FiMail className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contacto</h3>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Email:</span> {selectedCliente.email}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Teléfono:</span> {selectedCliente.telefono || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <FiHome className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Direcciones</h3>
                  <div className="mt-1 space-y-2">
                    {selectedCliente.direcciones && selectedCliente.direcciones.length > 0 ? (
                      selectedCliente.direcciones.map((direccion, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Tipo:</span>{' '}
                            <Badge variant="outline" className="ml-1">
                              {direccion.tipo}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            <span className="font-medium">País:</span> {direccion.pais}
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Ciudad:</span> {direccion.ciudad}
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Dirección:</span> {direccion.direccion}
                          </div>
                          {direccion.referencia && (
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">Referencia:</span> {direccion.referencia}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No hay direcciones registradas</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <FiInfo className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Información Adicional</h3>
                  <div className="mt-1 space-y-1">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">Tipo:</span>{' '}
                      <Badge variant={selectedCliente.tipo === 'INDIVIDUAL' ? 'default' : 'secondary'} className="bg-blue-50 text-blue-700">
                        {selectedCliente.tipo === 'INDIVIDUAL' ? 'Persona Natural' : 'Empresa'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">Estado:</span>{' '}
                      <Badge variant={
                        selectedCliente.isActive ? 'success' :
                        'secondary'
                      }>
                        {selectedCliente.isActive ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">Fecha de Registro:</span>{' '}
                      {new Date(selectedCliente.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100">
            <Button 
              className="w-full"
              onClick={() => handleEditClick(selectedCliente)}
            >
              <FiEdit className="mr-2 h-4 w-4" />
              Editar Cliente
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {isEditModalOpen && clienteToEdit && (
        <ClienteModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          initialData={clienteToEdit}
          onSubmit={handleEditSubmit}
          submitLabel="Actualizar Cliente"
        />
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={!!clienteToDelete} onOpenChange={() => setClienteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{' '}
              <span className="font-medium">
                {clienteToDelete?.tipo === 'EMPRESA' 
                  ? clienteToDelete.razonSocial 
                  : `${clienteToDelete?.nombre} ${clienteToDelete?.apellido}`}
              </span>
              {' '}y toda su información asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 