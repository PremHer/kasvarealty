'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FiPlus, FiAlertCircle } from 'react-icons/fi'
import { Project, EstadoProyecto, TipoProyecto } from '@/types/project'
import ProjectList from '@/components/projects/ProjectList'
import { ProjectFilters } from '@/components/projects/project-filters'
import NewProjectModal from '@/components/projects/new-project-modal'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pagination } from '@/components/ui/pagination'

interface Filters {
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  status: EstadoProyecto | 'all'
  type: TipoProyecto | 'all'
}

interface SessionUser {
  role?: string
}

interface Session {
  user?: SessionUser
}

export default function ProjectsPage() {
  const { data: session } = useSession() as { data: Session | null }
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    status: 'all',
    type: 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9 // 3 columnas x 3 filas

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Verificar si el usuario tiene permiso para ver proyectos
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'PROJECT_MANAGER']
    if (!allowedRoles.includes(session.user.role || '')) {
      router.push('/dashboard')
      return
    }

    fetchProjects()
  }, [session, router])

  // Permitir crear proyectos a todos los roles que pueden ver proyectos
  const canCreateProject = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'PROJECT_MANAGER'].includes(session?.user?.role || '')

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectCreated = () => {
    setShowNewProjectModal(false)
    fetchProjects()
  }

  const handleProjectDeleted = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchProjects()
      } else {
        const error = await response.json()
        console.error('Error al eliminar proyecto:', error)
      }
    } catch (error) {
      console.error('Error al eliminar proyecto:', error)
    }
  }

  const filteredProjects = projects.filter(project => {
    if (filters.status !== 'all' && project.status !== filters.status) {
      return false
    }
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.type !== 'all' && project.type !== filters.type) {
      return false
    }
    return true
  }).sort((a, b) => {
    const aValue = a[filters.sortBy as keyof Project]
    const bValue = b[filters.sortBy as keyof Project]
    
    if (filters.sortBy === 'createdAt') {
      const aDate = new Date(aValue as string).getTime()
      const bDate = new Date(bValue as string).getTime()
      return filters.sortOrder === 'asc' ? aDate - bDate : bDate - aDate
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return filters.sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  // Calcular paginación
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Resetear a la primera página al cambiar filtros
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona los proyectos inmobiliarios</p>
        </div>
        <div className="flex space-x-4">
          {session?.user?.role === 'GERENTE_GENERAL' && (
            <Link
              href="/dashboard/projects/pending"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <FiAlertCircle className="mr-2 h-5 w-5" />
              Proyectos Pendientes
            </Link>
          )}
          {canCreateProject && (
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <FiPlus className="h-5 w-5 mr-2" />
              Nuevo Proyecto
            </button>
          )}
        </div>
      </div>

      <ProjectFilters onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <ProjectList 
            projects={paginatedProjects} 
            onProjectUpdated={fetchProjects}
            onProjectDeleted={handleProjectDeleted}
          />
          
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  )
} 