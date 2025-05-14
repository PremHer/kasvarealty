'use client'

import { useState } from 'react'
import { Project } from '@/types/project'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import EditProjectModal from './edit-project-modal'
import NewProjectModal from './new-project-modal'
import { useSession } from 'next-auth/react'
import ProjectCard from './ProjectCard'

interface ProjectListProps {
  projects: Project[]
  onProjectUpdated: () => void
  onProjectDeleted: (projectId: string) => void
}

export default function ProjectList({ projects, onProjectUpdated, onProjectDeleted }: ProjectListProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const handleEdit = (project: Project) => {
    setSelectedProject(project)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm('¿Está seguro de eliminar este proyecto?')) return
    onProjectDeleted(projectId)
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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