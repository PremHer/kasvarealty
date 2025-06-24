'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PabellonWithRelations } from '@/types/cementerio'
import { PabellonService, PabellonPendiente } from '@/lib/services/pabellonService'
import { FiPlus, FiTrash2, FiChevronDown, FiChevronRight, FiSearch, FiEye, FiEyeOff } from 'react-icons/fi'
import { Loader2 as Loader2Icon } from 'lucide-react'
import UnidadCementerioCard from './UnidadCementerioCard'
import UnidadCementerioModal from './UnidadCementerioModal'
import PabellonPendienteSelector from './PabellonPendienteSelector'
import UnidadCementerioPendienteSelector from './UnidadCementerioPendienteSelector'
import { Info } from 'lucide-react'

interface PabellonesListProps {
  proyectoId: string
  onPabellonesChange?: () => void
}

export default function PabellonesList({ proyectoId, onPabellonesChange }: PabellonesListProps) {
  const [loading, setLoading] = useState(true)
  const [pabellones, setPabellones] = useState<PabellonWithRelations[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUnidadModal, setShowUnidadModal] = useState(false)
  const [selectedPabellonId, setSelectedPabellonId] = useState<string>('')
  const [cantidadPabellones, setCantidadPabellones] = useState(0)
  const [expandedPabellones, setExpandedPabellones] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{ 
    open: boolean; 
    pabellonId: string | null; 
    pabellonName: string;
    tieneUnidades: boolean;
    cantidadUnidades: number;
  }>({
    open: false,
    pabellonId: null,
    pabellonName: '',
    tieneUnidades: false,
    cantidadUnidades: 0
  })
  const [infoPabellonesACrear, setInfoPabellonesACrear] = useState<any>(null)
  const [calculandoInfo, setCalculandoInfo] = useState(false)
  const [mostrarInactivos, setMostrarInactivos] = useState(true)
  const [cambiandoEstados, setCambiandoEstados] = useState<Set<string>>(new Set())
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [pabellonesPendientes, setPabellonesPendientes] = useState<PabellonPendiente[]>([])
  const [isPendienteSelectorOpen, setIsPendienteSelectorOpen] = useState(false)
  const [isUnidadPendienteSelectorOpen, setIsUnidadPendienteSelectorOpen] = useState(false)
  const [pabellonPendienteSeleccionado, setPabellonPendienteSeleccionado] = useState<PabellonPendiente | null>(null)
  const [huecos, setHuecos] = useState<any>({ PARCELA: [], NICHO: [], MAUSOLEO: [] })
  const [unidadPendienteSeleccionada, setUnidadPendienteSeleccionada] = useState<any>(null)
  const [pabellonIdOriginal, setPabellonIdOriginal] = useState<string>('')
  const { toast } = useToast()
  const session = useSession()

  const canManagePabellones = [
    'SUPER_ADMIN',
    'GERENTE_GENERAL',
    'PROJECT_MANAGER'
  ].includes(session.data?.user?.role || '')

  const togglePabellon = (pabellonId: string) => {
    setExpandedPabellones(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pabellonId)) {
        newSet.delete(pabellonId)
      } else {
        newSet.add(pabellonId)
      }
      return newSet
    })
  }

  const cargarPabellones = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/proyectos/${proyectoId}/pabellones?incluirInactivos=true`)
      if (!response.ok) throw new Error('Error al cargar pabellones')
      const data = await response.json()
      setPabellones(data)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pabellones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [proyectoId, toast])

  const cargarPabellonesYNotificar = useCallback(async () => {
    await cargarPabellones()
    onPabellonesChange?.()
  }, [cargarPabellones, onPabellonesChange])

  const handleUnidadesChanged = useCallback(async () => {
    await cargarPabellones()
    onPabellonesChange?.()
  }, [cargarPabellones, onPabellonesChange])

  useEffect(() => {
    cargarPabellones()
  }, [cargarPabellones])

  // Calcular información de pabellones a crear
  useEffect(() => {
    if (cantidadPabellones > 0) {
      const calcularInfoPabellones = async () => {
        try {
          setCalculandoInfo(true)
          
          // Obtener el último código de pabellón existente
          const ultimoPabellon = pabellones
            .filter(p => p.isActive)
            .sort((a, b) => {
              const numA = parseInt(a.codigo.replace('PAB', ''))
              const numB = parseInt(b.codigo.replace('PAB', ''))
              return numB - numA
            })[0]

          const ultimoNumero = ultimoPabellon 
            ? parseInt(ultimoPabellon.codigo.replace('PAB', ''))
            : 0

          const pabellonesACrear = []
          for (let i = 1; i <= cantidadPabellones; i++) {
            const numero = ultimoNumero + i
            const codigo = `PAB${numero.toString().padStart(2, '0')}`
            pabellonesACrear.push({
              codigo,
              nombre: `Pabellón ${codigo}`,
              descripcion: `Pabellón ${codigo} del proyecto`
            })
          }

          setInfoPabellonesACrear(pabellonesACrear)
        } catch (error) {
          console.error('Error al calcular pabellones:', error)
          setInfoPabellonesACrear(null)
        } finally {
          setCalculandoInfo(false)
        }
      }

      calcularInfoPabellones()
    } else {
      setInfoPabellonesACrear(null)
    }
  }, [cantidadPabellones, pabellones])

  const handleCrearPabellon = async () => {
    try {
      // Detectar pabellones pendientes
      const pabellonesPendientes = PabellonService.detectarPabellonesPendientes(pabellones)
      
      if (pabellonesPendientes.length > 0) {
        // Hay pabellones pendientes, mostrar selector
        setPabellonesPendientes(pabellonesPendientes)
        setIsPendienteSelectorOpen(true)
      } else {
        // No hay pabellones pendientes, crear pabellón normal
        setPabellonPendienteSeleccionado(null)
        setShowCreateDialog(true)
      }
    } catch (error) {
      console.error('Error al detectar pabellones pendientes:', error)
      // En caso de error, proceder con creación normal
      setPabellonPendienteSeleccionado(null)
      setShowCreateDialog(true)
    }
  }

  const handlePabellonPendienteSeleccionado = (pabellonPendiente: PabellonPendiente) => {
    // Crear pabellón con código específico
    setPabellonPendienteSeleccionado(pabellonPendiente)
    setShowCreateDialog(true)
  }

  const handleContinuarNormal = () => {
    // Continuar con creación normal (ignorar huecos)
    setPabellonPendienteSeleccionado(null)
    setShowCreateDialog(true)
  }

  const handleCreatePabellones = async () => {
    try {
      if (pabellonPendienteSeleccionado) {
        // Crear pabellón pendiente específico
        const response = await fetch(`/api/proyectos/${proyectoId}/pabellones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: pabellonPendienteSeleccionado.codigo,
            nombre: pabellonPendienteSeleccionado.nombre,
            descripcion: `Pabellón ${pabellonPendienteSeleccionado.codigo} del proyecto`
          })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        toast({
          title: "Exito",
          description: `Pabellón ${pabellonPendienteSeleccionado.codigo} creado correctamente`,
          variant: "default"
        })

        setShowCreateDialog(false)
        setPabellonPendienteSeleccionado(null)
        await cargarPabellonesYNotificar()
      } else if (cantidadPabellones > 0) {
        // Creación masiva
        if (cantidadPabellones <= 0) {
          toast({
            title: "Error",
            description: "Debes especificar una cantidad mayor a 0",
            variant: "destructive"
          })
          return
        }

        const response = await fetch(`/api/proyectos/${proyectoId}/pabellones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cantidad: cantidadPabellones })
        })

        if (!response.ok) {
          const error = await response.text()
          throw new Error(error)
        }

        toast({
          title: "Exito",
          description: "Pabellones creados correctamente",
          variant: "default"
        })

        setShowCreateDialog(false)
        setCantidadPabellones(0)
        await cargarPabellonesYNotificar()
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear pabellones",
        variant: "destructive"
      })
    }
  }

  const handleToggleEstado = async (pabellonId: string, isActive: boolean) => {
    try {
      setCambiandoEstados(prev => new Set(prev).add(pabellonId))
      
      const response = await fetch(`/api/proyectos/${proyectoId}/pabellones/${pabellonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (!response.ok) throw new Error('Error al actualizar estado')

      toast({
        title: "Exito",
        description: `Pabellon ${isActive ? 'desactivado' : 'activado'} correctamente`,
        variant: "default"
      })

      await cargarPabellonesYNotificar()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Error al cambiar estado del pabellon",
        variant: "destructive"
      })
    } finally {
      setCambiandoEstados(prev => {
        const newSet = new Set(prev)
        newSet.delete(pabellonId)
        return newSet
      })
    }
  }

  const handleDeletePabellon = async () => {
    if (!deleteDialog.pabellonId) return

    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/pabellones/${deleteDialog.pabellonId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      toast({
        title: "Éxito",
        description: "Pabellón eliminado correctamente",
        variant: "default"
      })

      setDeleteDialog({ open: false, pabellonId: null, pabellonName: '', tieneUnidades: false, cantidadUnidades: 0 })
      await cargarPabellonesYNotificar()
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error.message || "Error al eliminar pabellón",
        variant: "destructive"
      })
    }
  }

  const handleCreateUnidad = async (pabellonId: string) => {
    setPabellonIdOriginal(pabellonId)
    setSelectedPabellonId(pabellonId)
    setShowUnidadModal(true)
  }

  const handleUnidadCreated = () => {
    handleUnidadesChanged()
    setUnidadPendienteSeleccionada(null)
    setPabellonIdOriginal('')
  }

  const handleUnidadModalClose = (open: boolean) => {
    setShowUnidadModal(open)
    if (!open) {
      setUnidadPendienteSeleccionada(null)
      setPabellonIdOriginal('')
    }
  }

  const handleUnidadPendienteSeleccionada = (unidadPendiente: any) => {
    setSelectedPabellonId(unidadPendiente.pabellonId)
    setUnidadPendienteSeleccionada(unidadPendiente)
    setIsUnidadPendienteSelectorOpen(false)
    setShowUnidadModal(true)
  }

  const handleContinuarCreacionNormal = () => {
    setSelectedPabellonId(pabellonIdOriginal)
    setIsUnidadPendienteSelectorOpen(false)
    setShowUnidadModal(true)
  }

  const pabellonesFiltrados = pabellones.filter(pabellon => {
    const cumpleFiltroInactivos = mostrarInactivos || pabellon.isActive
    const cumpleBusqueda = !terminoBusqueda || 
      pabellon.codigo.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      pabellon.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())
    
    return cumpleFiltroInactivos && cumpleBusqueda
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar pabellones..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="mostrar-inactivos"
              checked={mostrarInactivos}
              onCheckedChange={setMostrarInactivos}
            />
            <Label htmlFor="mostrar-inactivos" className="text-sm">
              Mostrar inactivos
            </Label>
          </div>
        </div>

        {canManagePabellones && (
          <Button className="flex items-center gap-2" onClick={handleCrearPabellon}>
            <FiPlus className="w-4 h-4" />
            Nuevo Pabellon
          </Button>
        )}

        {canManagePabellones && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {pabellonPendienteSeleccionado 
                    ? `Crear Pabellón ${pabellonPendienteSeleccionado.codigo}` 
                    : 'Crear Nuevos Pabellones'
                  }
                </DialogTitle>
                <DialogDescription>
                  {pabellonPendienteSeleccionado 
                    ? `Creando pabellón ${pabellonPendienteSeleccionado.codigo} para llenar un hueco en la secuencia.`
                    : 'Ingresa la cantidad de pabellones que deseas crear. Se generarán automáticamente los códigos.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              {pabellonPendienteSeleccionado ? (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-medium text-orange-900">
                        Creando pabellón pendiente: {pabellonPendienteSeleccionado.codigo}
                      </span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      Este pabellón se creará con el código {pabellonPendienteSeleccionado.codigo} para llenar un hueco en la secuencia.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cantidad">Cantidad de Pabellones</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      min="1"
                      max="50"
                      value={cantidadPabellones}
                      onChange={(e) => setCantidadPabellones(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  {cantidadPabellones > 0 && (
                    <div className="rounded-lg bg-muted p-4 text-sm">
                      <div className="font-medium mb-3">Se crearán los siguientes pabellones:</div>
                      <div className="space-y-2">
                        {calculandoInfo ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                            Calculando pabellones a crear...
                          </div>
                        ) : infoPabellonesACrear ? (
                          <div className="max-h-40 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-2">
                              {infoPabellonesACrear.map((pabellon: any, index: number) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-background rounded text-xs">
                                  <span className="font-mono">{pabellon.codigo}</span>
                                  <span className="text-muted-foreground">{pabellon.nombre}</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                Lista completa: {infoPabellonesACrear.map((p: any) => p.codigo).join(', ')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">Error al calcular los pabellones a crear.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false)
                  setPabellonPendienteSeleccionado(null)
                }}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreatePabellones} 
                  disabled={!pabellonPendienteSeleccionado && cantidadPabellones <= 0}
                >
                  {pabellonPendienteSeleccionado 
                    ? `Crear ${pabellonPendienteSeleccionado.codigo}` 
                    : 'Crear Pabellones'
                  }
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-4">
        {pabellonesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FiEyeOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay pabellones
              </h3>
              <p className="text-gray-500">
                {terminoBusqueda 
                  ? 'No se encontraron pabellones con ese criterio de busqueda'
                  : 'Aun no se han creado pabellones para este proyecto'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          pabellonesFiltrados.map((pabellon) => (
            <Card key={pabellon.id} className={`${!pabellon.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => togglePabellon(pabellon.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedPabellones.has(pabellon.id) ? (
                        <FiChevronDown className="w-4 h-4" />
                      ) : (
                        <FiChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {pabellon.codigo} - {pabellon.nombre}
                        {!pabellon.isActive && (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {pabellon.unidades.length} unidades • 
                        Creado por {pabellon.creadoPorUsuario?.nombre || 'Sistema'}
                      </p>
                    </div>
                  </div>
                  
                  {canManagePabellones && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleEstado(pabellon.id, pabellon.isActive)}
                        disabled={cambiandoEstados.has(pabellon.id)}
                      >
                        {pabellon.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteDialog({
                          open: true,
                          pabellonId: pabellon.id,
                          pabellonName: pabellon.nombre,
                          tieneUnidades: pabellon.unidades.length > 0,
                          cantidadUnidades: pabellon.unidades.length
                        })}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {(pabellon.descripcion || pabellon.observaciones) && (
                  <div className="mb-4 space-y-2">
                    {pabellon.descripcion && (
                      <p className="text-sm text-gray-600">{pabellon.descripcion}</p>
                    )}
                    {pabellon.observaciones && (
                      <p className="text-sm text-gray-500 italic">{pabellon.observaciones}</p>
                    )}
                  </div>
                )}

                {expandedPabellones.has(pabellon.id) && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Unidades del Pabellon</h4>
                      {canManagePabellones && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCreateUnidad(pabellon.id)}
                        >
                          <FiPlus className="w-4 h-4 mr-2" />
                          Nueva Unidad
                        </Button>
                      )}
                    </div>
                    
                    {pabellon.unidades.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay unidades en este pabellon
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pabellon.unidades.map((unidad) => (
                          <UnidadCementerioCard
                            key={unidad.id}
                            unidad={unidad}
                            proyectoId={proyectoId}
                            onUnidadChanged={handleUnidadesChanged}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={deleteDialog.tieneUnidades ? "text-orange-600" : "text-destructive"}>
              {deleteDialog.tieneUnidades ? 'No se puede eliminar' : 'Eliminar Pabellón'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-left">
                {deleteDialog.tieneUnidades ? (
                  <>
                    <div className="text-red-600 bg-red-50 p-4 rounded-md border border-red-200 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-5 w-5" />
                        <span className="font-medium">No se puede eliminar este pabellón</span>
                      </div>
                      <p>El pabellón <strong>"{deleteDialog.pabellonName}"</strong> tiene {deleteDialog.cantidadUnidades} unidad{deleteDialog.cantidadUnidades !== 1 ? 'es' : ''} registrada{deleteDialog.cantidadUnidades !== 1 ? 's' : ''}.</p>
                      <p className="mt-2">Para eliminar el pabellón, primero debe eliminar todas las unidades asociadas.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p>¿Estás seguro de que deseas eliminar el pabellón <strong>"{deleteDialog.pabellonName}"</strong>?</p>
                    <br />
                    <p>Esta acción eliminará permanentemente:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>El pabellón y todos sus datos</li>
                    </ul>
                    <br />
                    <p className="text-destructive font-medium">Esta acción no se puede deshacer.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2">
              {deleteDialog.tieneUnidades ? 'Entendido' : 'Cancelar'}
            </AlertDialogCancel>
            {!deleteDialog.tieneUnidades && (
              <AlertDialogAction 
                onClick={handleDeletePabellon}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Eliminar Pabellón
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UnidadCementerioModal
        open={showUnidadModal}
        onOpenChange={handleUnidadModalClose}
        proyectoId={proyectoId}
        pabellonId={selectedPabellonId}
        unidadPendiente={unidadPendienteSeleccionada}
        onUnidadCreated={handleUnidadCreated}
      />

      <PabellonPendienteSelector
        pabellonesPendientes={pabellonesPendientes}
        isOpen={isPendienteSelectorOpen}
        onClose={() => setIsPendienteSelectorOpen(false)}
        onPabellonSeleccionado={handlePabellonPendienteSeleccionado}
        onContinuarNormal={handleContinuarNormal}
      />

      <UnidadCementerioPendienteSelector
        huecos={huecos}
        isOpen={isUnidadPendienteSelectorOpen}
        onClose={() => setIsUnidadPendienteSelectorOpen(false)}
        onUnidadSeleccionada={handleUnidadPendienteSeleccionada}
        onContinuarNormal={handleContinuarCreacionNormal}
      />
    </div>
  )
}
