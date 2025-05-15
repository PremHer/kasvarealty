'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Project } from '@/types/project'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiCheck, FiX, FiArrowLeft, FiAlertCircle, FiInfo, FiHome, FiUser, FiMapPin, FiDollarSign, FiCalendar } from 'react-icons/fi'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'

export default function PendingProjectsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [pendingProjects, setPendingProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Solo permitir acceso a gerentes generales
    if (session.user.role !== 'GERENTE_GENERAL') {
      router.push('/dashboard')
      return
    }

    fetchPendingProjects()
  }, [session, router])

  const fetchPendingProjects = async () => {
    try {
      const response = await fetch('/api/projects/pending')
      if (response.ok) {
        const data = await response.json()
        setPendingProjects(data)
      }
    } catch (error) {
      console.error('Error al cargar proyectos pendientes:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proyectos pendientes',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (project: Project) => {
    setSelectedProject(project)
    setApproveDialogOpen(true)
  }

  const handleReject = async (project: Project) => {
    setSelectedProject(project)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const confirmApprove = async () => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: 'Proyecto aprobado',
          description: `El proyecto "${selectedProject.name}" ha sido aprobado exitosamente`,
          variant: 'default'
        })
        setApproveDialogOpen(false)
        fetchPendingProjects()
      } else {
        const error = await response.json()
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error al aprobar proyecto:', error)
      toast({
        title: 'Error',
        description: 'No se pudo aprobar el proyecto',
        variant: 'destructive'
      })
    }
  }

  const confirmReject = async () => {
    if (!selectedProject || !rejectReason) return

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      })

      if (response.ok) {
        toast({
          title: 'Proyecto rechazado',
          description: `El proyecto "${selectedProject.name}" ha sido rechazado`,
          variant: 'default'
        })
        setRejectDialogOpen(false)
        fetchPendingProjects()
      } else {
        const error = await response.json()
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error al rechazar proyecto:', error)
      toast({
        title: 'Error',
        description: 'No se pudo rechazar el proyecto',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <Link href="/dashboard/projects" className="text-gray-600 hover:text-blue-600 transition-colors">
                Proyectos
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-blue-600 font-medium">Pendientes</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-600">Proyectos Pendientes de Aprobación</h1>
        <Link href="/dashboard/projects">
          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Button>
        </Link>
      </div>
      
      {pendingProjects.length === 0 ? (
        <div className="text-center py-8">
          <FiInfo className="mx-auto h-12 w-12 text-blue-400" />
          <p className="mt-2 text-gray-600">No hay proyectos pendientes de aprobación</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden border-blue-100 hover:border-blue-200 transition-colors">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-xl font-semibold text-blue-700">{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-blue-600">Descripción</h3>
                      <p className="mt-1 text-gray-700">{project.description}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 flex items-center">
                        <FiHome className="mr-2 h-4 w-4 text-blue-500" />
                        Empresa Desarrolladora
                      </h3>
                      <p className="mt-1 text-gray-700">{project.developerCompany?.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 flex items-center">
                        <FiUser className="mr-2 h-4 w-4 text-blue-500" />
                        Gerente del Proyecto
                      </h3>
                      <p className="mt-1 text-gray-700">{project.manager.name}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 flex items-center">
                        <FiMapPin className="mr-2 h-4 w-4 text-blue-500" />
                        Ubicación
                      </h3>
                      <p className="mt-1 text-gray-700">{project.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 flex items-center">
                        <FiDollarSign className="mr-2 h-4 w-4 text-blue-500" />
                        Inversión Total
                      </h3>
                      <p className="mt-1 text-gray-700">${project.inversionTotal?.toLocaleString() || 'No especificada'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 flex items-center">
                        <FiCalendar className="mr-2 h-4 w-4 text-blue-500" />
                        Fecha de Creación
                      </h3>
                      <p className="mt-1 text-gray-700">{new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(project)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <FiX className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleApprove(project)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FiCheck className="w-4 h-4 mr-2" />
                    Aprobar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo de Aprobación */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-600">Confirmar Aprobación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas aprobar el proyecto "{selectedProject?.name}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmApprove} className="bg-blue-600 hover:bg-blue-700">
              <FiCheck className="w-4 h-4 mr-2" />
              Aprobar Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Rechazo */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Rechazar Proyecto</DialogTitle>
            <DialogDescription>
              Por favor, proporciona un motivo detallado para el rechazo del proyecto "{selectedProject?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectReason" className="text-gray-700">Motivo del Rechazo</Label>
            <Input
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ingrese el motivo del rechazo..."
              className="mt-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <FiX className="w-4 h-4 mr-2" />
              Rechazar Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 