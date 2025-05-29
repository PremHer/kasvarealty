'use client'

import { useState, useMemo, useEffect } from 'react'
import { FiEdit2, FiTrash2, FiUser, FiMail, FiShield, FiCalendar, FiX } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import EditUserModal from './edit-user-modal'
import { DeleteUserAlert } from './delete-user-alert'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import type { Rol } from '@prisma/client'
import { UserFilters } from './user-filters'
import { Pagination } from '@/components/ui/pagination'

interface User {
  id: string
  nombre: string
  email: string
  rol: Rol
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
}

interface UsersTableProps {
  users: User[]
  onUserUpdated: () => void
  onUserCreated: () => void
}

const ROLE_TRANSLATIONS: Record<Rol, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  GERENTE_GENERAL: 'Gerente General',
  SALES_MANAGER: 'Gerente de Ventas',
  SALES_REP: 'Representante de Ventas',
  SALES_ASSISTANT: 'Asistente de Ventas',
  SALES_COORDINATOR: 'Coordinador de Ventas',
  PROJECT_MANAGER: 'Gerente de Proyectos',
  CONSTRUCTION_SUPERVISOR: 'Supervisor de Construcción',
  QUALITY_CONTROL: 'Control de Calidad',
  PROJECT_ASSISTANT: 'Asistente de Proyectos',
  FINANCE_MANAGER: 'Gerente Financiero',
  ACCOUNTANT: 'Contador',
  FINANCE_ASSISTANT: 'Asistente Financiero',
  INVESTOR: 'Inversionista',
  GUEST: 'Invitado',
  DEVELOPER: 'Desarrollador'
}

export default function UsersTable({ users: initialUsers, onUserUpdated, onUserCreated }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [associatedData, setAssociatedData] = useState<{
    proyectos: number
    proyectosList: string[]
    ventas: number
    ventasList: string[]
    actividades: number
    actividadesList: string[]
  } | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()

  // Actualizar el estado local cuando cambian los usuarios iniciales
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  // Estado para filtros y paginación
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    role: undefined as Rol | undefined,
    status: 'all' as 'active' | 'inactive' | 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtrar y ordenar usuarios
  const filteredUsers = useMemo(() => {
    let result = [...users]

    // Aplicar búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(user => 
        user.nombre.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
    }

    // Aplicar filtro de rol
    if (filters.role !== undefined) {
      result = result.filter(user => user.rol === filters.role)
    }

    // Aplicar filtro de estado
    if (filters.status !== 'all') {
      result = result.filter(user => 
        filters.status === 'active' ? user.isActive : !user.isActive
      )
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      if (filters.sortBy === 'createdAt' || filters.sortBy === 'lastLogin') {
        const aDate = a[filters.sortBy] instanceof Date ? a[filters.sortBy].getTime() : 
                     a[filters.sortBy] ? new Date(a[filters.sortBy] as string).getTime() : 0
        const bDate = b[filters.sortBy] instanceof Date ? b[filters.sortBy].getTime() : 
                     b[filters.sortBy] ? new Date(b[filters.sortBy] as string).getTime() : 0
        return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate
      }
      
      const aValue = a[filters.sortBy as keyof User]
      const bValue = b[filters.sortBy as keyof User]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })

    return result
  }, [users, filters])

  // Calcular paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleFilterChange = (newFilters: {
    search: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    role?: Rol
    status?: 'active' | 'inactive' | 'all'
  }) => {
    setFilters({
      ...newFilters,
      role: newFilters.role,
      status: newFilters.status || 'all'
    })
    setCurrentPage(1) // Resetear a la primera página al cambiar filtros
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const ROLE_HIERARCHY: Record<Rol, Rol[]> = {
    SUPER_ADMIN: ['ADMIN', 'GERENTE_GENERAL', 'DEVELOPER', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
    ADMIN: ['GERENTE_GENERAL', 'DEVELOPER', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
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

  const canCreateUsers = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL',
    'SALES_MANAGER',
    'PROJECT_MANAGER',
    'FINANCE_MANAGER'
  ].includes(session?.user?.role as Rol)

  const canEditUsers = (userRole: Rol, userId: string) => {
    const currentUserRole = session?.user?.role as Rol
    const currentUserId = session?.user?.id
    if (!currentUserRole) return false

    // No permitir editar el propio registro
    if (currentUserId === userId) return false

    // SUPER_ADMIN puede editar a cualquiera excepto a sí mismo
    if (currentUserRole === 'SUPER_ADMIN') return true

    // ADMIN puede editar a cualquiera excepto SUPER_ADMIN, ADMIN y a sí mismo
    if (currentUserRole === 'ADMIN') {
      return userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN'
    }

    // Los gerentes solo pueden editar usuarios de su área
    const allowedRoles = ROLE_HIERARCHY[currentUserRole] || []
    return allowedRoles.includes(userRole)
  }

  const canDeleteUsers = (userRole: Rol, userId: string) => {
    const currentUserRole = session?.user?.role as Rol
    const currentUserId = session?.user?.id
    if (!currentUserRole) return false

    // No permitir eliminar el propio registro
    if (currentUserId === userId) return false

    // SUPER_ADMIN puede eliminar a cualquiera excepto a sí mismo
    if (currentUserRole === 'SUPER_ADMIN') return true

    // ADMIN puede eliminar a cualquiera excepto SUPER_ADMIN, ADMIN y a sí mismo
    if (currentUserRole === 'ADMIN') {
      return userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN'
    }

    // Los gerentes solo pueden eliminar usuarios de su área
    const allowedRoles = ROLE_HIERARCHY[currentUserRole] || []
    return allowedRoles.includes(userRole)
  }

  const handleEdit = (user: User) => {
    if (!canEditUsers(user.rol, user.id)) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para editar este usuario',
        variant: 'destructive'
      })
      return
    }
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (user: User) => {
    if (!canDeleteUsers(user.rol, user.id)) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para eliminar este usuario',
        variant: 'destructive'
      })
      return
    }

    try {
      // Obtener datos asociados antes de mostrar el diálogo
      const response = await fetch(`/api/users/${user.id}/associated-data`)
      if (response.ok) {
        const data = await response.json()
        setAssociatedData(data)
    }
    setUserToDelete(user)
    } catch (error) {
      console.error('Error al obtener datos asociados:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al obtener datos asociados"
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el usuario')
      }

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado exitosamente',
      })

      onUserUpdated()
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
      setAssociatedData(null)
    }
  }

  const handleViewDetails = (user: User) => {
    setSelectedUserDetails(user)
  }

  const handleCloseDetails = () => {
    setSelectedUserDetails(null)
  }

  const handleToggleStatus = async (user: User) => {
    if (!canEditUsers(user.rol, user.id)) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para cambiar el estado de este usuario',
        variant: 'destructive'
      })
      return
    }

    try {
      // Actualizar el estado local inmediatamente
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { ...u, isActive: !u.isActive }
            : u
        )
      )

      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !user.isActive })
      })

      if (!response.ok) {
        // Si hay error, revertir el estado local
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.id 
              ? { ...u, isActive: !u.isActive }
              : u
          )
        )
        throw new Error('Error al actualizar el estado del usuario')
      }

      toast({
        title: 'Estado actualizado',
        description: `Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`,
      })
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'Error al actualizar el estado del usuario',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      <UserFilters onFilterChange={handleFilterChange} />

      {!selectedUserDetails && (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th scope="col" className="w-1/3 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="w-1/4 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rol
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
                {paginatedUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleViewDetails(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 truncate" title={user.nombre}>
                            {user.nombre}
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={user.email}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {ROLE_TRANSLATIONS[user.rol] || 'Sin rol'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggleStatus(user)}
                          disabled={!canEditUsers(user.rol, user.id)}
                          className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                        />
                        <span className={`text-sm ${user.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        {canEditUsers(user.rol, user.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            disabled={isDeleting}
                            title="Editar"
                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteUsers(user.rol, user.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            disabled={isDeleting}
                            title="Eliminar"
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
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {selectedUserDetails && (
        <div className="mt-4">
          <Card className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-6">
                  <div className="h-20 w-20 rounded-xl bg-primary-100 flex items-center justify-center shadow-sm">
                    <FiUser className="h-10 w-10 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{selectedUserDetails.nombre}</h3>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        <FiMail className="h-5 w-5 text-primary-500" />
                        <span className="text-base text-gray-700">{selectedUserDetails.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        <FiShield className="h-5 w-5 text-blue-500" />
                        <span className="text-base text-gray-700">{ROLE_TRANSLATIONS[selectedUserDetails.rol] || 'Sin rol'}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        <Badge variant={selectedUserDetails.isActive ? "success" : "destructive"}>
                          {selectedUserDetails.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
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
              <div className="flex items-center space-x-2">
                <FiCalendar className="h-5 w-5 text-gray-400" />
                <h4 className="font-semibold text-gray-900">Información de Registro</h4>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Fecha de Creación</h5>
                  <p className="text-gray-600">
                    {new Date(selectedUserDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Último Acceso</h5>
                  <p className="text-gray-600">
                    {selectedUserDetails.lastLogin 
                      ? new Date(selectedUserDetails.lastLogin).toLocaleDateString()
                      : 'Nunca ha iniciado sesión'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          currentUserRole={session?.user?.role as Rol}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedUser(null)
          }}
          onUserUpdated={onUserUpdated}
        />
      )}

      {userToDelete && (
        <DeleteUserAlert
          isOpen={!!userToDelete}
          onClose={() => {
            setUserToDelete(null)
            setAssociatedData(null)
          }}
          onConfirm={handleDeleteConfirm}
          userName={userToDelete.nombre}
          associatedData={associatedData || undefined}
        />
      )}
    </div>
  )
} 