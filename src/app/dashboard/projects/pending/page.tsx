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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PendingProjectsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [pendingProjects, setPendingProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [projectManagers, setProjectManagers] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [activeTab, setActiveTab] = useState<'approval' | 'assignment'>('approval')

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
    fetchProjectManagers()
  }, [session, router, activeTab])

  const fetchPendingProjects = async () => {
    try {
      const endpoint = activeTab === 'approval' ? '/api/projects/pending' : '/api/projects/pending-assignment'
      const response = await fetch(endpoint)
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

  const fetchProjectManagers = async () => {
    try {
      const response = await fetch('/api/users/project-managers')
      if (response.ok) {
        const data = await response.json()
        setProjectManagers(data)
      }
    } catch (error) {
      console.error('Error al cargar gerentes de proyecto:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los gerentes de proyecto',
        variant: 'destructive'
      })
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

  const handleAssign = async (project: Project) => {
    setSelectedProject(project)
    setSelectedManager('')
    setAssignDialogOpen(true)
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

  const confirmAssign = async () => {
    if (!selectedProject || !selectedManager) return

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ managerId: selectedManager })
      })

      if (response.ok) {
        toast({
          title: 'Proyecto asignado',
          description: `El proyecto "${selectedProject.name}" ha sido asignado exitosamente`,
          variant: 'default'
        })
        setAssignDialogOpen(false)
        fetchPendingProjects()
      } else {
        const error = await response.json()
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error al asignar proyecto:', error)
      toast({
        title: 'Error',
        description: 'No se pudo asignar el proyecto',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <h1 className="text-2xl font-bold text-blue-600">Proyectos Pendientes</h1>
        <Link href="/dashboard/projects">
          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('approval')}
            className={`${
              activeTab === 'approval'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pendientes de Aprobación
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`${
              activeTab === 'assignment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pendientes de Asignación
          </button>
        </nav>
      </div>

      {pendingProjects.length === 0 ? (
        <div className="text-center py-8">
          <FiInfo className="mx-auto h-12 w-12 text-blue-400" />
          <p className="mt-2 text-gray-600">
            {activeTab === 'approval'
              ? 'No hay proyectos pendientes de aprobación'
              : 'No hay proyectos pendientes de asignación'}
          </p>
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
                    {activeTab === 'approval' ? (
                      <div>
                        <h3 className="text-sm font-medium text-blue-600 flex items-center">
                          <FiUser className="mr-2 h-4 w-4 text-blue-500" />
                          Gerente del Proyecto
                        </h3>
                        <p className="mt-1 text-gray-700">{project.manager?.name || 'No asignado'}</p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-medium text-blue-600 flex items-center">
                          <FiUser className="mr-2 h-4 w-4 text-blue-500" />
                          Creado por
                        </h3>
                        <p className="mt-1 text-gray-700">{project.createdBy?.name || 'No disponible'}</p>
                      </div>
                    )}
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
                  {activeTab === 'approval' ? (
                    <>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(project)}
                      >
                        <FiX className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                      <Button
                        onClick={() => handleApprove(project)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <FiCheck className="mr-2 h-4 w-4" />
                        Aprobar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(project)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <FiX className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    <Button
                      onClick={() => handleAssign(project)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                        <FiUser className="mr-2 h-4 w-4" />
                      Asignar Gerente
                    </Button>
                    </>
                  )}
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
              Por favor, proporciona una razón para rechazar el proyecto "{selectedProject?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectReason">Razón del Rechazo</Label>
            <Input
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ingrese la razón del rechazo"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmReject}
              disabled={!rejectReason}
              className="bg-red-600 hover:bg-red-700"
            >
              <FiX className="w-4 h-4 mr-2" />
              Rechazar Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Asignación */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-600">Asignar Gerente de Proyecto</DialogTitle>
            <DialogDescription>
              Selecciona un gerente de proyecto para "{selectedProject?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="manager">Gerente de Proyecto</Label>
            <Select
              value={selectedManager}
              onValueChange={setSelectedManager}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Seleccione un gerente" />
              </SelectTrigger>
              <SelectContent>
                {projectManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name} - {manager.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAssign}
              disabled={!selectedManager}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FiUser className="w-4 h-4 mr-2" />
              Asignar Gerente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 