'use client'

import { useState } from 'react'
import { Project } from '@/types/project'
import { FiEdit2, FiTrash2, FiMapPin, FiCalendar, FiDollarSign, FiHome } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import EditProjectModal from './edit-project-modal'
import NewProjectModal from './new-project-modal'
import { useSession } from 'next-auth/react'

interface ProjectListProps {
  projects: Project[]
  onProjectUpdated: () => void
}

export default function ProjectList({ projects, onProjectUpdated }: ProjectListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const canEditProject = (project: Project) => {
    if (!session?.user) return false
    const userRole = session.user.role
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole)
    const isProjectManager = userRole === 'PROJECT_MANAGER'
    const isProjectGerente = project.managerId === session.user.id
    const isGerenteGeneral = userRole === 'GERENTE_GENERAL'
    const isEmpresaGerenteGeneral = project.developerCompany?.id === session.user.empresaId

    return isAdmin || (isProjectManager && isProjectGerente) || (isGerenteGeneral && isEmpresaGerenteGeneral)
  }

  const handleEdit = (project: Project) => {
    if (!canEditProject(project)) {
      toast({
        title: 'Error',
        description: 'No tienes permiso para editar este proyecto',
        variant: 'destructive'
      })
      return
    }
    setSelectedProject(project)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (projectId: string) => {
    if (!session?.user) return

    const project = projects.find(p => p.id === projectId)
    if (!project || !canEditProject(project)) {
      toast({
        title: 'Error',
        description: 'No tienes permiso para eliminar este proyecto',
        variant: 'destructive'
      })
      return
    }

    if (!confirm('¿Está seguro de eliminar este proyecto?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el proyecto')
      }

      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido eliminado exitosamente',
        variant: 'default'
      })

      onProjectUpdated()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el proyecto',
        variant: 'destructive'
      })
    }
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  const getProjectTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'CASA_INDIVIDUAL': 'Casa Individual',
      'CONDOMINIO_CASAS': 'Condominio de Casas',
      'DEPARTAMENTO': 'Departamento',
      'CONDOMINIO_DEPARTAMENTOS': 'Condominio de Departamentos',
      'DUPLEX': 'Dúplex',
      'PENTHOUSE': 'Penthouse',
      'TOWNHOUSE': 'Townhouse',
      'CENTRO_COMERCIAL': 'Centro Comercial',
      'MODULO_COMERCIAL': 'Módulo Comercial',
      'GALERIA_COMERCIAL': 'Galería Comercial',
      'PLAZA_COMERCIAL': 'Plaza Comercial',
      'OFICINAS': 'Oficinas',
      'BODEGA': 'Bodega',
      'SHOWROOM': 'Showroom',
      'MIXTO_RESIDENCIAL_COMERCIAL': 'Mixto Residencial Comercial',
      'MIXTO_OFICINAS_COMERCIAL': 'Mixto Oficinas Comercial',
      'LOTIZACION': 'Lotización',
      'CEMENTERIO': 'Cementerio',
      'HOTEL': 'Hotel',
      'HOSPITAL': 'Hospital',
      'CLINICA': 'Clínica',
      'COLEGIO': 'Colegio',
      'UNIVERSIDAD': 'Universidad',
      'ESTADIO': 'Estadio',
      'COMPLEJO_DEPORTIVO': 'Complejo Deportivo',
      'PARQUE_INDUSTRIAL': 'Parque Industrial'
    }
    return types[type] || type
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'No especificado'
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'No especificada'
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div 
              className="p-6 cursor-pointer"
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
                  <p className="text-sm text-primary-600 font-medium">{getProjectTypeLabel(project.type)}</p>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {project.developerCompany?.name || 'Empresa no especificada'}
                  </p>
                </div>
                {canEditProject(project) && (
                  <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(project)
                      }}
                      className="p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project.id)
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <FiMapPin className="w-4 h-4 mr-2 text-primary-500 flex-shrink-0" />
                  <span className="text-sm truncate">{project.location || 'Ubicación no especificada'}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <FiCalendar className="w-4 h-4 mr-2 text-primary-500" />
                  <span className="text-sm">Inicio: {formatDate(project.startDate)}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <FiDollarSign className="w-4 h-4 mr-2 text-primary-500" />
                  <span className="text-sm">Inversión: {formatCurrency(project.inversionInicial)}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <FiHome className="w-4 h-4 mr-2 text-primary-500" />
                  <span className="text-sm">Área: {project.totalArea ? `${project.totalArea} m²` : 'No especificada'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-primary-600 text-center italic">
                  Haz clic en la tarjeta para ver todos los detalles del proyecto
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditModalOpen && selectedProject && (
        <EditProjectModal
          project={selectedProject}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedProject(null)
          }}
          onProjectUpdated={onProjectUpdated}
        />
      )}

      {isNewModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewModalOpen(false)}
          onProjectCreated={onProjectUpdated}
        />
      )}
    </div>
  )
} 