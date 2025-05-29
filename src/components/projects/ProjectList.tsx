'use client'

import { useState } from 'react'
import { Project } from '@/types/project'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import EditProjectModal from './edit-project-modal'
import NewProjectModal from './new-project-modal'
import { useSession } from 'next-auth/react'
import ProjectCard from './ProjectCard'
import { ProjectFilters } from './project-filters'
import { EstadoProyecto, TipoProyecto } from '@prisma/client'
import { Pagination } from '@/components/ui/pagination'
import { useFilters } from '@/hooks/useFilters'

interface ProjectListProps {
  projects: Project[]
  onProjectUpdated: () => void
  onProjectDeleted: (projectId: string) => void
}

type ProjectFilters = {
  search: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  status: EstadoProyecto | 'all'
  type: TipoProyecto | 'all'
}

const defaultFilters: ProjectFilters = {
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  status: 'all',
  type: 'all'
}

export default function ProjectList({ projects, onProjectUpdated, onProjectDeleted }: ProjectListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const {
    filters,
    currentPage,
    totalPages,
    paginatedItems: paginatedProjects,
    handleFilterChange,
    handlePageChange,
    hasActiveFilters
  } = useFilters<Project>(projects, {
    searchFields: ['name', 'description'],
    sortableFields: {
      name: { type: 'string' as const, label: 'Nombre' },
      createdAt: { type: 'date' as const, label: 'Fecha de creación' },
      budget: { type: 'number' as const, label: 'Presupuesto' },
      progress: { type: 'number' as const, label: 'Progreso' }
    },
    filterFields: {
      status: {
        type: 'enum' as const,
        values: ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
        label: 'Estado'
      },
      type: {
        type: 'enum' as const,
        values: [
          'CASA_INDIVIDUAL', 'CONDOMINIO_CASAS', 'DEPARTAMENTO', 'CONDOMINIO_DEPARTAMENTOS',
          'DUPLEX', 'PENTHOUSE', 'TOWNHOUSE', 'CENTRO_COMERCIAL', 'MODULO_COMERCIAL',
          'GALERIA_COMERCIAL', 'PLAZA_COMERCIAL', 'OFICINAS', 'BODEGA', 'SHOWROOM',
          'MIXTO_RESIDENCIAL_COMERCIAL', 'MIXTO_OFICINAS_COMERCIAL', 'LOTIZACION',
          'CEMENTERIO', 'HOTEL', 'HOSPITAL', 'CLINICA', 'COLEGIO', 'UNIVERSIDAD',
          'ESTADIO', 'COMPLEJO_DEPORTIVO', 'PARQUE_INDUSTRIAL'
        ],
        label: 'Tipo'
      }
    },
    itemsPerPage: 9 // 3x3 grid
  })

  const handleEdit = (project: Project) => {
    setSelectedProject(project)
    setIsEditModalOpen(true)
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  return (
    <div className="space-y-6">
      <ProjectFilters 
        onFilterChange={handleFilterChange}
        filters={filters as ProjectFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProjects.map((project: Project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={handleEdit}
            onDelete={onProjectDeleted}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

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