'use client'

import { useState, useMemo } from 'react'
import { FiEdit2, FiTrash2, FiUser, FiMail, FiMapPin, FiPhone, FiCreditCard, FiCalendar, FiX } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import EditEmpresaModal from './edit-empresa-modal'
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEmpresaDetails, setSelectedEmpresaDetails] = useState<Empresa | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()

  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const filteredEmpresas = useMemo(() => {
    let result = [...empresas]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(empresa => 
        empresa.nombre.toLowerCase().includes(searchLower) ||
        empresa.ruc.toLowerCase().includes(searchLower) ||
        empresa.email.toLowerCase().includes(searchLower)
      )
    }

    result.sort((a, b) => {
      if (filters.sortBy === 'createdAt') {
        const aDate = new Date(a.createdAt).getTime()
        const bDate = new Date(b.createdAt).getTime()
        return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate
      }
      
      if (filters.sortBy === 'numeroProyectos') {
        return filters.sortOrder === 'asc' 
          ? a.numeroProyectos - b.numeroProyectos
          : b.numeroProyectos - a.numeroProyectos
      }
      
      const aValue = a[filters.sortBy as keyof Empresa]
      const bValue = b[filters.sortBy as keyof Empresa]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })

    return result
  }, [empresas, filters])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredEmpresas.length / itemsPerPage)
  const paginatedEmpresas = filteredEmpresas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const canEditEmpresas = ['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role || '')

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
                  <tr 
                    key={empresa.id} 
                    className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleViewDetails(empresa)}
                  >
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
                      <span className="text-sm text-gray-900">{empresa.ruc}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FiUser className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {empresa.representanteLegal?.nombre || 'No asignado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {empresa.numeroProyectos} proyectos
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
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

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {selectedEmpresaDetails && (
        <div className="mt-4">
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
                        <FiMail className="h-5 w-5 text-primary-500" />
                        <span className="text-base text-gray-700">{selectedEmpresaDetails.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                        <FiMapPin className="h-5 w-5 text-blue-500" />
                        <span className="text-base text-gray-700">{selectedEmpresaDetails.direccion}</span>
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
              <div className="flex items-center space-x-2">
                <FiCalendar className="h-5 w-5 text-gray-400" />
                <h4 className="font-semibold text-gray-900">Información de Registro</h4>
              </div>
              <div className="grid grid-cols-2 gap-6">
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

              <div className="flex items-center space-x-2 mt-6">
                <FiUser className="h-5 w-5 text-gray-400" />
                <h4 className="font-semibold text-gray-900">Representante Legal</h4>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedEmpresaDetails.representanteLegal ? (
                  <div className="space-y-2">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Nombre</h5>
                      <p className="text-gray-600">{selectedEmpresaDetails.representanteLegal.nombre}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-500">Email</h5>
                      <p className="text-gray-600">{selectedEmpresaDetails.representanteLegal.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay representante legal asignado</p>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-6">
                <FiCreditCard className="h-5 w-5 text-gray-400" />
                <h4 className="font-semibold text-gray-900">Información Bancaria</h4>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Bancos</h5>
                  <div className="mt-2 space-y-2">
                    {selectedEmpresaDetails.bancos.length > 0 ? (
                      selectedEmpresaDetails.bancos.map((banco, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700">
                          {banco}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No hay bancos registrados</p>
                    )}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Billeteras Virtuales</h5>
                  <div className="mt-2 space-y-2">
                    {selectedEmpresaDetails.billeterasVirtuales.length > 0 ? (
                      selectedEmpresaDetails.billeterasVirtuales.map((billetera, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-50 text-green-700">
                          {billetera}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">No hay billeteras virtuales registradas</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedEmpresa && (
        <EditEmpresaModal
          empresa={selectedEmpresa}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedEmpresa(null)
          }}
          onEmpresaUpdated={() => {
            onEmpresaUpdated()
            setIsEditModalOpen(false)
            setSelectedEmpresa(null)
          }}
        />
      )}

      {empresaToDelete && (
        <DeleteEmpresaAlert
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setEmpresaToDelete(null)
          }}
          onConfirm={handleDeleteConfirm}
          empresaName={empresaToDelete.nombre}
        />
      )}
    </div>
  )
} 