'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@/types/project'
import { FiArrowLeft, FiMapPin, FiCalendar, FiDollarSign, FiHome, FiEdit2, FiUser, FiCheckCircle, FiAlertCircle, FiUserPlus, FiXCircle, FiClock, FiInfo, FiUsers, FiPlus, FiGrid, FiCreditCard, FiFileText, FiMap } from 'react-icons/fi'
import { useToast } from '@/components/ui/use-toast'
import EditProjectModal from '@/components/projects/edit-project-modal'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UnidadInmobiliaria } from '@prisma/client'
import UnitList from '@/components/projects/units/UnitList'
import UnitModal from '@/components/projects/units/UnitModal'
import ManzanasList from '@/components/proyectos/ManzanasList'
import ManzanasStats from '@/components/proyectos/ManzanasStats'
import PabellonesList from '@/components/proyectos/PabellonesList'
import PabellonesStats from '@/components/proyectos/PabellonesStats'
import ProjectVentas from '@/components/projects/ProjectVentas'
import ProjectComisiones from '@/components/projects/ProjectComisiones'
import ProjectContratos from '@/components/projects/ProjectContratos'
import PlanoDisponibilidad from '@/components/projects/PlanoDisponibilidad'
import CaracteristicasTab from '@/components/projects/tabs/CaracteristicasTab'

const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Cargando mapa...</p>
    </div>
  )
})

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [units, setUnits] = useState<UnidadInmobiliaria[]>([])
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnidadInmobiliaria | undefined>()
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()

  const canEditProject = (project: Project) => {
    if (!session?.user) return false
    const userRole = session.user.role
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'GERENTE_GENERAL'].includes(userRole)
    const isProjectManager = userRole === 'PROJECT_MANAGER'
    const isProjectGerente = project.managerId === session.user.id

    return isAdmin || (isProjectManager && isProjectGerente)
  }

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) {
          throw new Error('Error al cargar el proyecto')
        }
        const data = await response.json()
        setProject(data)
      } catch (error) {
        console.error('Error:', error)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el proyecto',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id, toast])

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}/units`)
        if (!response.ok) {
          throw new Error('Error al cargar las unidades')
        }
        const data = await response.json()
        setUnits(data)
      } catch (error) {
        console.error('Error:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las unidades',
          variant: 'destructive'
        })
      }
    }

    if (project) {
      fetchUnits()
    }
  }, [project, params.id, toast])

  const handleProjectUpdated = (updatedProject: Project) => {
    setProject(updatedProject)
    setIsEditModalOpen(false)
    toast({
      title: 'Éxito',
      description: 'Proyecto actualizado correctamente',
      variant: 'default'
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'No especificado'
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-slate-100 text-slate-800',
      'PENDING_APPROVAL': 'bg-amber-100 text-amber-800',
      'PENDING_ASSIGNMENT': 'bg-orange-100 text-orange-800',
      'APPROVED': 'bg-emerald-100 text-emerald-800',
      'REJECTED': 'bg-rose-100 text-rose-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-violet-100 text-violet-800',
      'CANCELLED': 'bg-slate-100 text-slate-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FiAlertCircle className="w-5 h-5" />
      case 'PENDING_APPROVAL':
        return <FiAlertCircle className="w-5 h-5" />
      case 'PENDING_ASSIGNMENT':
        return <FiUserPlus className="w-5 h-5" />
      case 'APPROVED':
        return <FiCheckCircle className="w-5 h-5" />
      case 'REJECTED':
        return <FiXCircle className="w-5 h-5" />
      case 'IN_PROGRESS':
        return <FiClock className="w-5 h-5" />
      case 'COMPLETED':
        return <FiCheckCircle className="w-5 h-5" />
      case 'CANCELLED':
        return <FiXCircle className="w-5 h-5" />
      default:
        return <FiAlertCircle className="w-5 h-5" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'DRAFT': 'Borrador',
      'PENDING_APPROVAL': 'Pendiente de Aprobación',
      'PENDING_ASSIGNMENT': 'Pendiente de Asignación',
      'APPROVED': 'Aprobado',
      'REJECTED': 'Rechazado',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    }
    return labels[status] || status
  }

  const handleUnitSave = async (unitData: Partial<UnidadInmobiliaria>) => {
    try {
      const url = selectedUnit
        ? `/api/projects/${params.id}/units/${selectedUnit.id}`
        : `/api/projects/${params.id}/units`
      
      const response = await fetch(url, {
        method: selectedUnit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(unitData)
      })

      if (!response.ok) {
        throw new Error('Error al guardar la unidad')
      }

      const updatedUnit = await response.json()
      
      if (selectedUnit) {
        setUnits(units.map(unit => 
          unit.id === selectedUnit.id ? updatedUnit : unit
        ))
      } else {
        setUnits([...units, updatedUnit])
      }

      setIsUnitModalOpen(false)
      setSelectedUnit(undefined)
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }

  const handleUnitDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/units/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la unidad')
      }

      setUnits(units.filter(unit => unit.id !== id))
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la unidad',
        variant: 'destructive'
      })
    }
  }

  const isProjectPending = (project: Project) => {
    return project.status === 'PENDING_APPROVAL' || project.status === 'PENDING_ASSIGNMENT'
  }

  const getPendingMessage = (status: string) => {
    if (status === 'PENDING_APPROVAL') {
      return 'Este proyecto está pendiente de aprobación. Para acceder a la gestión completa del proyecto, primero debe ser aprobado.'
    }
    return 'Este proyecto está pendiente de asignación. Para acceder a la gestión completa del proyecto, primero debe ser asignado a un gerente.'
  }

  const handleManzanasChange = useCallback(() => {
    setStatsRefreshTrigger(prev => prev + 1);
  }, []);

  const handlePabellonesChange = useCallback(() => {
    setStatsRefreshTrigger(prev => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Proyecto no encontrado</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>
          {project && (
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {getStatusIcon(project.status)}
                <span className="ml-1">{getStatusLabel(project.status)}</span>
              </span>
            </div>
          )}
        </div>
        {project && canEditProject(project) && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <FiEdit2 className="w-5 h-5 mr-2" />
            Editar Proyecto
          </button>
        )}
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FiInfo className="w-4 h-4" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="caracteristicas" className="flex items-center gap-2">
            <FiGrid className="w-4 h-4" />
            Características
          </TabsTrigger>
          {!isProjectPending(project) && (
            <>
              <TabsTrigger value="units" className="flex items-center gap-2">
                <FiHome className="w-4 h-4" />
                Unidades
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                Ventas
              </TabsTrigger>
              <TabsTrigger value="comisiones" className="flex items-center gap-2">
                <FiCreditCard className="w-4 h-4" />
                Comisiones
              </TabsTrigger>
              <TabsTrigger value="contratos" className="flex items-center gap-2">
                <FiFileText className="w-4 h-4" />
                Contratos
              </TabsTrigger>
              <TabsTrigger value="plano" className="flex items-center gap-2">
                <FiMap className="w-4 h-4" />
                Plano
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <FiUsers className="w-4 h-4" />
                Clientes
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="details">
          {isProjectPending(project) && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Acceso Restringido</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    {getPendingMessage(project.status)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-700">Información del Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
                      <div className="space-y-4">
                        <div className="flex items-start text-gray-600">
                          <FiUser className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                          <div>
                            <p className="font-medium">Empresa Desarrolladora</p>
                            <p className="text-sm">{project.developerCompany?.name || 'No especificada'}</p>
                          </div>
                        </div>
                        <div className="flex items-start text-gray-600">
                          <FiUser className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                          <div>
                            <p className="font-medium">Gerente del Proyecto</p>
                            <p className="text-sm">{project.manager?.name || 'No asignado'}</p>
                          </div>
                        </div>
                        <div className="flex items-start text-gray-600">
                          <FiMapPin className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                          <div>
                            <p className="font-medium">Ubicación</p>
                            <p className="text-sm">{project.location}</p>
                            <p className="text-sm text-gray-500">
                              {[project.departamento, project.provincia, project.distrito]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start text-gray-600">
                          <FiCalendar className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                          <div>
                            <p className="font-medium">Fechas</p>
                            <p className="text-sm">Inicio: {formatDate(project.startDate)}</p>
                            {project.endDate && (
                              <p className="text-sm">Fin: {formatDate(project.endDate)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Financiera</h2>
                      <div className="space-y-4">
                        <div className="flex items-start text-gray-600">
                          <FiDollarSign className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                          <div>
                            <p className="font-medium">Inversiones</p>
                            <p className="text-sm">Inicial: {formatCurrency(project.inversionInicial)}</p>
                            <p className="text-sm">Total: {formatCurrency(project.inversionTotal)}</p>
                            <p className="text-sm">Actual: {formatCurrency(project.inversionActual)}</p>
                          </div>
                        </div>
                        {project.precioTerreno && (
                          <div className="flex items-start text-gray-600">
                            <FiDollarSign className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                            <div>
                              <p className="font-medium">Precio del Terreno</p>
                              <p className="text-sm">{formatCurrency(project.precioTerreno)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h2>
                      <div className="space-y-4">
                        <div className="flex items-start text-gray-600">
                          <FiHome className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                          <div>
                            <p className="font-medium">Áreas</p>
                            <p className="text-sm">Total: {project.totalArea ? `${project.totalArea} m²` : 'No especificada'}</p>
                            <p className="text-sm">Útil: {project.usableArea ? `${project.usableArea} m²` : 'No especificada'}</p>
                          </div>
                        </div>
                        {project.totalUnits && (
                          <div className="flex items-start text-gray-600">
                            <FiHome className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                            <div>
                              <p className="font-medium">Unidades</p>
                              <p className="text-sm">Total: {project.totalUnits}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {project.status === 'REJECTED' && project.razonRechazo && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="text-sm font-medium text-red-800 flex items-center">
                          <FiAlertCircle className="mr-2 h-4 w-4" />
                          Motivo del Rechazo
                        </h3>
                        <p className="mt-2 text-red-700">{project.razonRechazo}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ubicación en el Mapa</h2>
                <div className="relative z-0">
                  <MapPicker
                    initialLocation={
                      project.latitud && project.longitud
                        ? {
                            latitud: project.latitud,
                            longitud: project.longitud
                          }
                        : undefined
                    }
                    readOnly
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipo del Proyecto</h2>
                <div className="space-y-4">
                  {project.manager && (
                    <div className="flex items-start text-gray-600">
                      <FiUser className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                      <div>
                        <p className="font-medium">Gerente del Proyecto</p>
                        <p className="text-sm">{project.manager.name}</p>
                        <p className="text-sm text-gray-500">{project.manager.email}</p>
                      </div>
                    </div>
                  )}
                  {project.createdBy && (
                    <div className="flex items-start text-gray-600">
                      <FiUser className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                      <div>
                        <p className="font-medium">Creado por</p>
                        <p className="text-sm">{project.createdBy.name}</p>
                        <p className="text-sm text-gray-500">{project.createdBy.email}</p>
                      </div>
                    </div>
                  )}
                  {project.approvedBy && (
                    <div className="flex items-start text-gray-600">
                      <FiUser className="w-5 h-5 mr-3 mt-1 text-primary-500" />
                      <div>
                        <p className="font-medium">Aprobado por</p>
                        <p className="text-sm">{project.approvedBy.name}</p>
                        <p className="text-sm text-gray-500">{project.approvedBy.email}</p>
                      </div>
                    </div>
                  )}
                  {project.rejectedBy && (
                    <div className="flex items-start text-gray-600">
                      <FiUser className="w-5 h-5 mr-3 mt-1 text-red-500" />
                      <div>
                        <p className="font-medium text-red-600">Rechazado por</p>
                        <p className="text-sm">{project.rejectedBy.name}</p>
                        <p className="text-sm text-gray-500">{project.rejectedBy.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="caracteristicas">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-blue-700">
                Características del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CaracteristicasTab proyectoId={params.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {!isProjectPending(project) && (
          <>
            <TabsContent value="units">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-700">
                    {project.type === 'LOTIZACION' ? 'Manzanas y Lotes' : 
                     project.type === 'CEMENTERIO' ? 'Pabellones y Unidades' : 
                     'Unidades Inmobiliarias'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.type === 'LOTIZACION' ? (
                    <div className="space-y-6">
                      <ManzanasStats proyectoId={params.id} refreshTrigger={statsRefreshTrigger} />
                      <ManzanasList proyectoId={params.id} onManzanasChange={handleManzanasChange} />
                    </div>
                  ) : project.type === 'CEMENTERIO' ? (
                    <div className="space-y-6">
                      <PabellonesStats proyectoId={params.id} refreshTrigger={statsRefreshTrigger} />
                      <PabellonesList proyectoId={params.id} onPabellonesChange={handlePabellonesChange} />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiGrid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Gestión de Unidades en Desarrollo
                      </h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        La gestión de unidades para proyectos de tipo "{getProjectTypeLabel(project.type)}" 
                        está en desarrollo. Próximamente estará disponible.
                      </p>
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                          Tipos de proyecto disponibles:
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Lotización - Manzanas y Lotes</li>
                          <li>• Cementerio - Pabellones y Unidades</li>
                          <li>• Otros tipos - En desarrollo</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales">
              <ProjectVentas 
                proyectoId={params.id} 
                tipoProyecto={project.type} 
              />
            </TabsContent>

            <TabsContent value="comisiones">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-700">Comisiones del Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectComisiones 
                    proyectoId={params.id} 
                    tipoProyecto={project.type} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contratos">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-700">Contratos del Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectContratos 
                    proyectoId={params.id} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plano">
              <PlanoDisponibilidad proyectoId={params.id} />
            </TabsContent>

            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-blue-700">Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => {/* TODO: Implementar registro de clientes */}}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <FiPlus className="w-5 h-5 mr-2" />
                      Nuevo Cliente
                    </button>
                  </div>
                  {/* TODO: Implementar lista de clientes */}
                  <p className="text-gray-500 text-center py-8">No hay clientes registrados</p>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      {isEditModalOpen && project && (
        <EditProjectModal
          project={project}
          onClose={() => setIsEditModalOpen(false)}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      {isUnitModalOpen && (
        <UnitModal
          projectId={params.id}
          unit={selectedUnit}
          onClose={() => {
            setIsUnitModalOpen(false)
            setSelectedUnit(undefined)
          }}
          onSave={handleUnitSave}
        />
      )}
    </div>
  )
} 