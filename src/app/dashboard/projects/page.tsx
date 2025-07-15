'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { FiPlus, FiAlertCircle } from 'react-icons/fi'
import { Project, EstadoProyecto, TipoProyecto } from '@/types/project'
import ProjectList from '@/components/projects/ProjectList'
import NewProjectModal from '@/components/projects/new-project-modal'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Breadcrumb } from "@/components/ui/breadcrumb"

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

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Verificar si el usuario tiene permiso para ver proyectos
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'PROJECT_MANAGER', 'SALES_MANAGER']
    if (!allowedRoles.includes(session.user.role || '')) {
      router.push('/dashboard')
      return
    }

    fetchProjects()
  }, [session, router])

  // Permitir crear proyectos a todos los roles que pueden ver proyectos
  const canCreateProject = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'PROJECT_MANAGER', 'SALES_MANAGER'].includes(session?.user?.role || '')

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
      // No necesitamos hacer la llamada DELETE aquí porque ya se hizo en el ProjectCard
      // Solo actualizamos la lista de proyectos
      setProjects(prevProjects => prevProjects.filter(project => project.id !== id))
      toast.success('Proyecto eliminado correctamente')
    } catch (error) {
      console.error('Error al actualizar la lista de proyectos:', error)
      // No mostramos error aquí porque la eliminación ya fue exitosa
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
          <Breadcrumb
            items={[
              { label: "Proyectos" }
            ]}
            className="mt-2"
          />
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

      <ProjectList 
        projects={projects}
        onProjectUpdated={fetchProjects}
        onProjectDeleted={handleProjectDeleted}
      />

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  )
} 