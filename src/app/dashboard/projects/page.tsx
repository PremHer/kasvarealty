'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FiPlus, FiFilter } from 'react-icons/fi'
import ProjectList from '@/components/projects/project-list'
import ProjectFilters from '@/components/projects/project-filters'
import NewProjectModal from '@/components/projects/new-project-modal'

type ProjectStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

interface Project {
  id: string
  name: string
  description: string
  location: string
  startDate: string
  endDate: string | null
  budget: number
  status: ProjectStatus
  createdBy: {
    id: string
    name: string
    email: string
  }
  approvedBy: {
    id: string
    name: string
    email: string
  } | null
  manager: {
    id: string
    name: string
    email: string
  }
}

interface Filters {
  status: 'ALL' | ProjectStatus
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
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    status: 'ALL',
    search: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [])

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
          {session?.user?.role === 'PROJECT_MANAGER' && (
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
        <ProjectList projects={filteredProjects} onProjectUpdated={fetchProjects} />
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