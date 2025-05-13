'use client'

import { useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiX, FiUser, FiMail, FiShield, FiCalendar, FiUserPlus } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import EditUserModal from './edit-user-modal'
import NewUserModal from './new-user-modal'
import DeleteUserAlert from './delete-user-alert'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import type { Rol } from '@prisma/client'

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

export default function UsersTable({ users, onUserUpdated, onUserCreated }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const { toast, currentToast } = useToast()
  const { data: session } = useSession()

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

  const canEditUsers = (userRole: Rol) => {
    const currentUserRole = session?.user?.role as Rol
    if (!currentUserRole) return false

    // SUPER_ADMIN puede editar a cualquiera
    if (currentUserRole === 'SUPER_ADMIN') return true

    // ADMIN puede editar a cualquiera excepto SUPER_ADMIN
    if (currentUserRole === 'ADMIN') return userRole !== 'SUPER_ADMIN'

    // Los gerentes solo pueden editar usuarios de su área
    const allowedRoles = ROLE_HIERARCHY[currentUserRole] || []
    return allowedRoles.includes(userRole)
  }

  const canDeleteUsers = (userRole: Rol) => {
    const currentUserRole = session?.user?.role as Rol
    if (!currentUserRole) return false

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
    if (!canEditUsers(user.rol)) {
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
    if (!canDeleteUsers(user.rol)) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para eliminar este usuario',
        variant: 'destructive'
      })
      return
    }
    setUserToDelete(user)
    setDeleteDialogOpen(true)
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
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleViewDetails = (user: User) => {
    setSelectedUserDetails(user)
  }

  const handleCloseDetails = () => {
    setSelectedUserDetails(null)
  }

  return (
    <div className="space-y-6">
      {currentToast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          currentToast.variant === 'destructive' ? 'bg-red-500' : 'bg-green-500'
        } text-white z-50`}>
          <h3 className="font-bold">{currentToast.title}</h3>
          <p>{currentToast.description}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h2>
          <p className="mt-1 text-sm text-gray-500">Gestiona los usuarios y sus permisos</p>
        </div>
        {canCreateUsers && (
          <Button 
            onClick={() => setIsNewModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          >
            <FiUserPlus className="mr-2 h-5 w-5" />
            Nuevo Usuario
          </Button>
        )}
      </div>

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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
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
                        {user.rol ? user.rol.replace(/_/g, ' ') : 'Sin rol'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? "success" : "destructive"}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                          title="Ver detalles"
                          className="text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                        >
                          <FiEye className="h-4 w-4" />
                        </Button>
                        {canEditUsers(user.rol) && (
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
                        {canDeleteUsers(user.rol) && (
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

      {selectedUserDetails && (
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
                      <span className="text-base text-gray-700">{selectedUserDetails.rol ? selectedUserDetails.rol.replace(/_/g, ' ') : 'Sin rol'}</span>
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

      <NewUserModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onUserCreated={onUserCreated}
      />

      <DeleteUserAlert
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setUserToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        userId={userToDelete?.id || ''}
        userName={userToDelete?.nombre || ''}
      />
    </div>
  )
} 