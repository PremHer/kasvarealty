'use client'

import { useState, useMemo } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiX, FiUser, FiMail, FiMapPin, FiPhone, FiCreditCard, FiCalendar } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import EditEmpresaModal from './edit-empresa-modal'
import NewEmpresaModal from './new-empresa-modal'
import DeleteEmpresaAlert from './delete-empresa-alert'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import { TipoBanco, TipoBilleteraVirtual } from '@prisma/client'
import { EmpresaFilters } from './empresa-filters'
import { Pagination } from '@/components/ui/pagination'

interface Empresa {
  id: string
  nombre: string
  ruc: string
  representanteLegal: {
    id: string
    nombre: string
    email: string
  }
  direccion: string
  telefono: string
  email: string
  bancos: TipoBanco[]
  billeterasVirtuales: TipoBilleteraVirtual[]
  numeroProyectos: number
  createdAt: string
  updatedAt: string
  representanteLegalId: string
}

interface EmpresaListProps {
  empresas: Empresa[]
  onEmpresaUpdated: () => void
  onEmpresaCreated: () => void
}

export function EmpresaList({ empresas, onEmpresaUpdated, onEmpresaCreated }: EmpresaListProps) {
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEmpresaDetails, setSelectedEmpresaDetails] = useState<Empresa | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null)
  const { toast, currentToast } = useToast()
  const { data: session } = useSession()

  // Estado para filtros y paginación
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'nombre',
    sortOrder: 'asc' as 'asc' | 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const canEditEmpresas = ['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role || '')

  // Filtrar y ordenar empresas
  const filteredEmpresas = useMemo(() => {
    let result = [...empresas]

    // Aplicar búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(empresa => 
        empresa.nombre.toLowerCase().includes(searchLower) ||
        empresa.ruc.toLowerCase().includes(searchLower) ||
        empresa.email.toLowerCase().includes(searchLower)
      )
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Empresa]
      const bValue = b[filters.sortBy as keyof Empresa]
      
      if (filters.sortBy === 'numeroProyectos') {
        return filters.sortOrder === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })

    return result
  }, [empresas, filters])

  // Calcular paginación
  const totalPages = Math.ceil(filteredEmpresas.length / itemsPerPage)
  const paginatedEmpresas = filteredEmpresas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Resetear a la primera página al cambiar filtros
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleEdit = (empresa: Empresa) => {
    if (!canEditEmpresas) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para editar empresas',
        variant: 'destructive'
      })
      return
    }
    setSelectedEmpresa(empresa)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (empresa: Empresa) => {
    if (!canEditEmpresas) {
      toast({
        title: 'Error',
        description: 'No tienes permisos para eliminar empresas',
        variant: 'destructive'
      })
      return
    }
    setEmpresaToDelete(empresa)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!empresaToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/empresas/${empresaToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la empresa')
      }

      toast({
        title: 'Empresa eliminada',
        description: 'La empresa ha sido eliminada exitosamente',
      })

      onEmpresaUpdated()
    } catch (error) {
      console.error('Error al eliminar empresa:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la empresa',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setEmpresaToDelete(null)
    }
  }

  const handleViewDetails = (empresa: Empresa) => {
    setSelectedEmpresaDetails(empresa)
  }

  const handleCloseDetails = () => {
    setSelectedEmpresaDetails(null)
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
          <h2 className="text-2xl font-bold text-gray-900">Empresas Desarrolladoras</h2>
          <p className="mt-1 text-sm text-gray-500">Gestiona las empresas desarrolladoras y sus proyectos</p>
        </div>
        {canEditEmpresas && (
          <Button 
            onClick={() => setIsNewModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Nueva Empresa
          </Button>
        )}
      </div>

      <EmpresaFilters onFilterChange={handleFilterChange} />

      {!selectedEmpresaDetails && (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th scope="col" className="w-1/4 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th scope="col" className="w-1/6 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    RUC
                  </th>
                  <th scope="col" className="w-1/4 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Representante Legal
                  </th>
                  <th scope="col" className="w-1/6 px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Proyectos
                  </th>
                  <th scope="col" className="w-1/6 px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmpresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 truncate" title={empresa.nombre}>
                            {empresa.nombre}
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={empresa.email}>
                            {empresa.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {empresa.ruc}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 truncate" title={empresa.representanteLegal.nombre}>
                            {empresa.representanteLegal.nombre}
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={empresa.representanteLegal.email}>
                            {empresa.representanteLegal.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {empresa.numeroProyectos} proyectos
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(empresa)}
                          title="Ver detalles"
                          className="text-gray-600 hover:text-primary-600 hover:bg-primary-50"
                        >
                          <FiEye className="h-4 w-4" />
                        </Button>
                        {canEditEmpresas && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(empresa)}
                              disabled={isDeleting}
                              title="Editar"
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(empresa)}
                              disabled={isDeleting}
                              title="Eliminar"
                              className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </Button>
                          </>
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

      {selectedEmpresaDetails && (
        <Card className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-6">
                <div className="h-20 w-20 rounded-xl bg-primary-100 flex items-center justify-center shadow-sm">
                  <FiUser className="h-10 w-10 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">{selectedEmpresaDetails.nombre}</h3>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <FiUser className="h-5 w-5 text-primary-500" />
                      <span className="text-base text-gray-700">{selectedEmpresaDetails.representanteLegal.nombre}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <FiMail className="h-5 w-5 text-blue-500" />
                      <span className="text-base text-gray-700">{selectedEmpresaDetails.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <FiPhone className="h-5 w-5 text-green-500" />
                      <span className="text-base text-gray-700">{selectedEmpresaDetails.telefono}</span>
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
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                  <h4 className="font-semibold text-gray-900">Dirección</h4>
                </div>
                <p className="text-gray-600">{selectedEmpresaDetails.direccion}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FiCreditCard className="h-5 w-5 text-gray-400" />
                  <h4 className="font-semibold text-gray-900">Información Bancaria</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Bancos</h5>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedEmpresaDetails.bancos.map((banco) => (
                        <Badge key={banco} variant="secondary" className="bg-gray-100 text-gray-700">
                          {banco}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-500">Billeteras Virtuales</h5>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedEmpresaDetails.billeterasVirtuales.map((billetera) => (
                        <Badge key={billetera} variant="secondary" className="bg-gray-100 text-gray-700">
                          {billetera}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FiCalendar className="h-5 w-5 text-gray-400" />
              <h4 className="font-semibold text-gray-900">Información de Registro</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-500">Fecha de Creación</h5>
                <p className="text-gray-600">
                  {new Date(selectedEmpresaDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-500">Última Actualización</h5>
                <p className="text-gray-600">
                  {new Date(selectedEmpresaDetails.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {selectedEmpresa && (
        <EditEmpresaModal
          empresa={selectedEmpresa}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedEmpresa(null)
          }}
          onEmpresaUpdated={onEmpresaUpdated}
        />
      )}

      <NewEmpresaModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onEmpresaCreated={onEmpresaCreated}
      />

      <DeleteEmpresaAlert
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setEmpresaToDelete(null)
        }}
        onEmpresaDeleted={handleDeleteConfirm}
        empresaId={empresaToDelete?.id || ''}
        empresaNombre={empresaToDelete?.nombre || ''}
      />
    </div>
  )
} 