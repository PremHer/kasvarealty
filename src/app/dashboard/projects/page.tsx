'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FiPlus, FiFilter } from 'react-icons/fi'
import { Project, EstadoProyecto } from '@/types/project'
import ProjectList from '@/components/projects/ProjectList'
import ProjectFilters from '@/components/projects/project-filters'
import NewProjectModal from '@/components/projects/new-project-modal'
import { useRouter } from 'next/navigation'

interface Filters {
  status: 'ALL' | EstadoProyecto
  search: string
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
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    status: 'ALL',
    search: ''
  })

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
    if (filters.status !== 'ALL' && project.status !== filters.status) {
      return false
    }
    if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiFilter className="h-5 w-5 mr-2" />
            Filtros
          </button>
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

      {showFilters && (
        <ProjectFilters
          filters={filters}
          onFilterChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <ProjectList 
          projects={filteredProjects} 
          onProjectUpdated={fetchProjects}
          onProjectDeleted={handleProjectDeleted}
        />
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