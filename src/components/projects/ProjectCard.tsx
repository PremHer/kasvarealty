import { Project } from '@/types/project'
import { Button } from '@/components/ui/button'
import { FiEdit2, FiTrash2, FiMapPin, FiCalendar, FiDollarSign, FiHome } from 'react-icons/fi'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
}

const statusColors = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  APROBADO: 'bg-green-100 text-green-800',
  RECHAZADO: 'bg-red-100 text-red-800',
  EN_PROGRESO: 'bg-blue-100 text-blue-800',
  COMPLETADO: 'bg-purple-100 text-purple-800',
  CANCELADO: 'bg-gray-100 text-gray-800'
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

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const canEdit = () => {
    if (!session?.user) return false

    const userRole = session.user.role as string
    const userId = session.user.id as string

    // Super Admin y Admin pueden editar cualquier proyecto
    if (['SUPER_ADMIN', 'ADMIN'].includes(userRole)) return true

    // Project Manager solo puede editar sus proyectos asignados
    if (userRole === 'PROJECT_MANAGER' && project.managerId === userId) return true

    // Gerente General puede editar todos los proyectos que ve (ya filtrados por el backend)
    if (userRole === 'GERENTE_GENERAL') return true

    return false
  }

  const canDelete = () => {
    if (!session?.user) return false

    const userRole = session.user.role as string
    const userId = session.user.id as string

    // Super Admin y Admin pueden eliminar cualquier proyecto
    if (['SUPER_ADMIN', 'ADMIN'].includes(userRole)) return true

    // Project Manager solo puede eliminar sus proyectos asignados
    if (userRole === 'PROJECT_MANAGER' && project.managerId === userId) return true

    // Gerente General puede eliminar todos los proyectos que ve (ya filtrados por el backend)
    if (userRole === 'GERENTE_GENERAL') return true

    return false
  }

  const handleProjectClick = () => {
    router.push(`/dashboard/projects/${project.id}`)
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div 
        className="p-6 cursor-pointer"
        onClick={handleProjectClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
            <p className="text-sm text-primary-600 font-medium">{getProjectTypeLabel(project.type)}</p>
            <p className="text-sm text-gray-500 mt-1 truncate">
              {project.developerCompany?.name || 'Empresa no especificada'}
            </p>
          </div>
          {(canEdit() || canDelete()) && (
            <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
              {canEdit() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(project)
                  }}
                  className="p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <FiEdit2 className="w-5 h-5" />
                </button>
              )}
              {canDelete() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(project.id)
                  }}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              )}
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
  )
} 