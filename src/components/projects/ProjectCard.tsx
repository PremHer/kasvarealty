'use client'

import { useState } from 'react'
import { Project, EstadoProyecto } from '@/types/project'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiEdit2, FiTrash2, FiEye, FiMapPin, FiCalendar, FiDollarSign, FiCheckCircle, FiXCircle, FiClock, FiPause, FiAlertCircle, FiUserPlus, FiHome } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
}

const getStatusConfig = (status: EstadoProyecto) => {
  const configs: Record<EstadoProyecto, { color: string; icon: any; label: string }> = {
    DRAFT: {
      color: 'bg-slate-50 text-slate-600 border-slate-200',
      icon: FiAlertCircle,
      label: 'Borrador'
    },
    PENDING_APPROVAL: {
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      icon: FiAlertCircle,
      label: 'Pendiente de Aprobación'
    },
    PENDING_ASSIGNMENT: {
      color: 'bg-orange-50 text-orange-700 border-orange-100',
      icon: FiUserPlus,
      label: 'Pendiente de Asignación'
    },
    APPROVED: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: FiCheckCircle,
      label: 'Aprobado'
    },
    REJECTED: {
      color: 'bg-rose-50 text-rose-700 border-rose-100',
      icon: FiXCircle,
      label: 'Rechazado'
    },
    IN_PROGRESS: {
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: FiClock,
      label: 'En Progreso'
    },
    COMPLETED: {
      color: 'bg-violet-50 text-violet-700 border-violet-100',
      icon: FiCheckCircle,
      label: 'Completado'
    },
    CANCELLED: {
      color: 'bg-slate-50 text-slate-600 border-slate-200',
      icon: FiXCircle,
      label: 'Cancelado'
    }
  }
  return configs[status]
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

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const statusConfig = getStatusConfig(project.status as EstadoProyecto)
  const StatusIcon = statusConfig.icon

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      // Primero verificamos si hay relaciones activas
      const response = await fetch(`/api/projects/${project.id}/check-relations`)
      
      if (response.status === 409) {
        // Si hay relaciones activas, mostramos el diálogo detallado
        const data = await response.json()
        setErrorMessage(data.error)
        setErrorDialogOpen(true)
        return
      }

      if (!response.ok) {
        throw new Error('Error al verificar relaciones')
      }

      // Si no hay relaciones activas, mostramos el diálogo de confirmación simple
      setDeleteDialogOpen(true)
    } catch (error) {
      console.error('Error al verificar relaciones:', error)
      toast.error('Error al verificar relaciones del proyecto')
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      // Si la respuesta es 404, significa que el proyecto ya fue eliminado
      // o que la eliminación fue exitosa pero el recurso ya no existe
      if (response.status === 404 || response.ok) {
        // Primero actualizamos el estado local
        onDelete(project.id)
        // Luego cerramos el diálogo
        setDeleteDialogOpen(false)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || 'Error al eliminar el proyecto')
        return
      }
    } catch (error) {
      console.error('Error al eliminar:', error)
      toast.error('Error al eliminar el proyecto')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(project)
  }

  const handleCardClick = () => {
    router.push(`/dashboard/projects/${project.id}`)
  }

  const canEdit = ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'PROJECT_MANAGER'].includes(session?.user?.role || '')
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role || '')

  return (
    <>
      <div 
        className="relative overflow-hidden rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="absolute top-0 right-0 p-2">
          <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1`}>
            <StatusIcon className="h-4 w-4" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
              <p className="text-sm text-primary-600 font-medium">{getProjectTypeLabel(project.type)}</p>
              <p className="text-sm text-gray-500 mt-1 truncate">
                {project.developerCompany?.name || 'Empresa no especificada'}
              </p>
            </div>
            {(canEdit || canDelete) && (
              <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                {canEdit && (
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeleteClick}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                    disabled={isDeleting}
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
              <span className="text-sm">Inicio: {project.startDate ? format(new Date(project.startDate), 'PPP', { locale: es }) : 'No especificada'}</span>
            </div>
            <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
              <FiDollarSign className="w-4 h-4 mr-2 text-primary-500" />
              <span className="text-sm">Inversión: {project.inversionInicial ? `S/ ${Number(project.inversionInicial).toLocaleString('es-PE')}` : 'No especificada'}</span>
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

      {/* Diálogo de confirmación simple */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar el proyecto <span className="font-semibold">{project.name}</span>?
              <span className="block mt-2 text-sm text-red-600">
                Esta acción no se puede deshacer.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de error con relaciones activas */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">No se puede eliminar el proyecto</DialogTitle>
            <DialogDescription>
              El proyecto tiene relaciones activas que deben ser eliminadas o transferidas antes de poder eliminarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <h4 className="font-medium text-red-800 mb-2">Relaciones activas encontradas</h4>
              <div className="text-sm text-red-700 whitespace-pre-line">
                {errorMessage}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h4 className="font-medium text-yellow-800 mb-2">¿Qué hacer?</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                <li>Elimine o transfiera todas las relaciones activas</li>
                <li>Una vez que no haya relaciones, podrá eliminar el proyecto</li>
                <li>Si necesita ayuda, contacte al administrador del sistema</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 