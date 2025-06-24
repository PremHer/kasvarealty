'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UnidadCementerioWithRelations } from '@/types/cementerio'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import UnidadCementerioPendienteSelector, { UnidadCementerioPendiente } from './UnidadCementerioPendienteSelector'

interface UnidadCementerioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyectoId: string
  pabellonId: string
  unidad?: UnidadCementerioWithRelations | null
  unidadPendiente?: any | null
  tipoUnidadPreSeleccionado?: 'PARCELA' | 'NICHO' | 'MAUSOLEO' | null
  onUnidadCreated?: () => void
}

export default function UnidadCementerioModal({ 
  open, 
  onOpenChange, 
  proyectoId, 
  pabellonId, 
  unidad, 
  unidadPendiente,
  tipoUnidadPreSeleccionado,
  onUnidadCreated 
}: UnidadCementerioModalProps) {
  const [loading, setLoading] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [codigoGenerado, setCodigoGenerado] = useState('')
  const [huecos, setHuecos] = useState<{ PARCELA: string[]; NICHO: string[]; MAUSOLEO: string[] }>({
    PARCELA: [],
    NICHO: [],
    MAUSOLEO: []
  })
  const [isPendienteSelectorOpen, setIsPendienteSelectorOpen] = useState(false)
  const [unidadPendienteSeleccionada, setUnidadPendienteSeleccionada] = useState<UnidadCementerioPendiente | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    precio: '',
    estado: 'DISPONIBLE',
    tipoUnidad: '',
    descripcion: '',
    observaciones: '',
    latitud: '',
    longitud: '',
    dimensionLargo: '',
    dimensionAncho: '',
    capacidad: '',
    tipoTerreno: 'TIERRA',
    nivelVertical: '',
    capacidadUrnas: '',
    material: 'CONCRETO',
    medidaAlto: '',
    medidaAncho: '',
    medidaProfundidad: '',
    capacidadPersonas: '',
    tipoConstruccion: 'FAMILIAR',
    niveles: '',
    materialMausoleo: 'CONCRETO'
  })
  const { toast } = useToast()

  const isEditing = !!unidad

  // Función para cargar datos completos de la unidad cuando se está editando
  const cargarDatosCompletosUnidad = async (unidadId: string) => {
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/unidades-cementerio/${unidadId}`)
      if (response.ok) {
        const unidadCompleta = await response.json()
        return unidadCompleta
      }
    } catch (error) {
      console.error('Error al cargar datos completos de la unidad:', error)
    }
    return null
  }

  // Función para detectar huecos
  const detectarHuecos = async () => {
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/pabellones/${pabellonId}/huecos-unidades`)
      if (response.ok) {
        const huecosData = await response.json()
        setHuecos(huecosData)
        return huecosData
      }
    } catch (error) {
      console.error('Error al detectar huecos:', error)
    }
    return null
  }

  // Función para generar código automático
  const generarCodigoAutomatico = async (tipoUnidad: string, considerarHuecos: boolean = true) => {
    if (isEditing) return // No generar código si estamos editando
    
    try {
      setGeneratingCode(true)
      
      // Si hay una unidad pendiente seleccionada, usar ese código directamente
      if (unidadPendienteSeleccionada && unidadPendienteSeleccionada.tipoUnidad === tipoUnidad) {
        setCodigoGenerado(unidadPendienteSeleccionada.codigo)
        setFormData(prev => ({ ...prev, codigo: unidadPendienteSeleccionada.codigo }))
        return unidadPendienteSeleccionada.codigo
      }
      
      // Si hay una unidad pendiente pasada como prop, usar ese código
      if (unidadPendiente && unidadPendiente.tipoUnidad === tipoUnidad) {
        setCodigoGenerado(unidadPendiente.codigo)
        setFormData(prev => ({ ...prev, codigo: unidadPendiente.codigo }))
        return unidadPendiente.codigo
      }
      
      // Generar código desde la API con el parámetro considerarHuecos
      const response = await fetch(
        `/api/proyectos/${proyectoId}/unidades-cementerio?pabellonId=${pabellonId}&tipoUnidad=${tipoUnidad}&generarCodigo=true&considerarHuecos=${considerarHuecos}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setCodigoGenerado(data.codigo)
        setFormData(prev => ({ ...prev, codigo: data.codigo }))
        return data.codigo
      } else {
        const errorText = await response.text()
        console.error('Error al generar código:', errorText)
        toast({
          title: "Error",
          description: `No se pudo generar el código automático: ${errorText}`,
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('Error al generar código:', error)
      toast({
        title: "Error",
        description: "Error al generar código automático",
        variant: "destructive"
      })
      return null
    } finally {
      setGeneratingCode(false)
    }
  }

  // Detectar huecos cuando se abre el modal para nueva unidad
  useEffect(() => {
    if (!isEditing && open) {
      detectarHuecos()
    }
  }, [open, isEditing, proyectoId, pabellonId])

  // Manejar unidad pendiente cuando se pasa como prop
  useEffect(() => {
    if (unidadPendiente && !isEditing) {
      setUnidadPendienteSeleccionada(unidadPendiente)
      setFormData(prev => ({ 
        ...prev, 
        tipoUnidad: unidadPendiente.tipoUnidad,
        codigo: unidadPendiente.codigo // Establecer el código directamente
      }))
      setCodigoGenerado(unidadPendiente.codigo)
      setMostrarFormulario(true)
    }
  }, [unidadPendiente, isEditing])

  // Manejar tipo pre-seleccionado
  useEffect(() => {
    if (tipoUnidadPreSeleccionado && !isEditing) {
      setFormData(prev => ({ 
        ...prev, 
        tipoUnidad: tipoUnidadPreSeleccionado
      }))
      setMostrarFormulario(true)
    }
  }, [tipoUnidadPreSeleccionado, isEditing])

  useEffect(() => {
    const cargarDatos = async () => {
      if (unidad && isEditing) {
        // Cargar datos completos de la unidad para edición
        const unidadCompleta = await cargarDatosCompletosUnidad(unidad.id)
        const unidadParaUsar = unidadCompleta || unidad
        
        setFormData({
          codigo: unidadParaUsar.codigo,
          precio: unidadParaUsar.precio.toString(),
          estado: unidadParaUsar.estado,
          tipoUnidad: unidadParaUsar.tipoUnidad,
          descripcion: unidadParaUsar.descripcion || '',
          observaciones: unidadParaUsar.observaciones || '',
          latitud: unidadParaUsar.latitud?.toString() || '',
          longitud: unidadParaUsar.longitud?.toString() || '',
          dimensionLargo: unidadParaUsar.parcela?.dimensionLargo?.toString() || '',
          dimensionAncho: unidadParaUsar.parcela?.dimensionAncho?.toString() || '',
          capacidad: unidadParaUsar.parcela?.capacidad?.toString() || '',
          tipoTerreno: unidadParaUsar.parcela?.tipoTerreno || 'TIERRA',
          nivelVertical: unidadParaUsar.nicho?.nivelVertical?.toString() || '',
          capacidadUrnas: unidadParaUsar.nicho?.capacidadUrnas?.toString() || '',
          material: unidadParaUsar.nicho?.material || 'CONCRETO',
          medidaAlto: unidadParaUsar.nicho?.medidaAlto?.toString() || '',
          medidaAncho: unidadParaUsar.nicho?.medidaAncho?.toString() || '',
          medidaProfundidad: unidadParaUsar.nicho?.medidaProfundidad?.toString() || '',
          capacidadPersonas: unidadParaUsar.mausoleo?.capacidadPersonas?.toString() || '',
          tipoConstruccion: unidadParaUsar.mausoleo?.tipoConstruccion || 'FAMILIAR',
          niveles: unidadParaUsar.mausoleo?.niveles?.toString() || '',
          materialMausoleo: unidadParaUsar.mausoleo?.material || 'CONCRETO'
        })
        setCodigoGenerado(unidadParaUsar.codigo)
        setMostrarFormulario(true)
      } else if (!unidad) {
        setFormData({
          codigo: '',
          precio: '',
          estado: 'DISPONIBLE',
          tipoUnidad: '',
          descripcion: '',
          observaciones: '',
          latitud: '',
          longitud: '',
          dimensionLargo: '',
          dimensionAncho: '',
          capacidad: '',
          tipoTerreno: 'TIERRA',
          nivelVertical: '',
          capacidadUrnas: '',
          material: 'CONCRETO',
          medidaAlto: '',
          medidaAncho: '',
          medidaProfundidad: '',
          capacidadPersonas: '',
          tipoConstruccion: 'FAMILIAR',
          niveles: '',
          materialMausoleo: 'CONCRETO'
        })
        setCodigoGenerado('')
        setUnidadPendienteSeleccionada(null)
        // No generar código automático al abrir el modal para nueva unidad
        // El usuario debe seleccionar el tipo primero
      }
    }

    cargarDatos()
  }, [unidad, open, isEditing, proyectoId])

  // Generar código automático cuando cambie el tipo de unidad
  useEffect(() => {
    if (!isEditing && open && formData.tipoUnidad) {
      generarCodigoAutomatico(formData.tipoUnidad)
    }
  }, [formData.tipoUnidad])

  // Detectar huecos cuando se seleccione un tipo de unidad
  useEffect(() => {
    if (!isEditing && open && formData.tipoUnidad) {
      detectarHuecosParaTipo(formData.tipoUnidad)
    }
  }, [formData.tipoUnidad, open, isEditing])

  const detectarHuecosParaTipo = async (tipoUnidad: string) => {
    try {
      const response = await fetch(`/api/proyectos/${proyectoId}/pabellones/${pabellonId}/huecos-unidades`)
      
      if (response.ok) {
        const huecos = await response.json()
        
        // Verificar si hay huecos solo para el tipo seleccionado
        const huecosTipo = huecos[tipoUnidad] || []
        
        if (huecosTipo.length > 0) {
          // Hay huecos para este tipo, mostrar selector de unidades pendientes
          setHuecos(huecos)
          setIsPendienteSelectorOpen(true)
        } else {
          // No hay huecos, mostrar directamente el formulario
          setMostrarFormulario(true)
          // Generar código automático para el tipo seleccionado
          await generarCodigoAutomatico(tipoUnidad, false)
        }
      }
    } catch (error) {
      console.error('Error al detectar huecos para tipo:', error)
      // En caso de error, mostrar el formulario de todas formas
      setMostrarFormulario(true)
      await generarCodigoAutomatico(tipoUnidad, false)
    }
  }

  const handleUnidadPendienteSeleccionada = (unidadPendiente: UnidadCementerioPendiente) => {
    setUnidadPendienteSeleccionada(unidadPendiente)
    setFormData(prev => ({ 
      ...prev, 
      tipoUnidad: unidadPendiente.tipoUnidad,
      codigo: unidadPendiente.codigo 
    }))
    setCodigoGenerado(unidadPendiente.codigo)
    setIsPendienteSelectorOpen(false)
    setMostrarFormulario(true)
  }

  const handleContinuarNormal = async () => {
    setUnidadPendienteSeleccionada(null)
    setFormData(prev => ({ 
      ...prev, 
      codigo: '' // Solo limpiar el código para que se genere uno nuevo
      // No limpiar tipoUnidad para mantener la selección del usuario
    }))
    setCodigoGenerado('')
    setIsPendienteSelectorOpen(false)
    setMostrarFormulario(true)
    
    // Generar código automático después de limpiar el estado
    if (formData.tipoUnidad) {
      await generarCodigoAutomatico(formData.tipoUnidad, false)
    }
  }

  // Generar código automático cuando se cierra el selector de unidades pendientes
  useEffect(() => {
    if (!isPendienteSelectorOpen && !isEditing && open && formData.tipoUnidad && !formData.codigo && !unidadPendienteSeleccionada) {
      generarCodigoAutomatico(formData.tipoUnidad, false)
    }
  }, [isPendienteSelectorOpen, isEditing, open, formData.tipoUnidad, formData.codigo, unidadPendienteSeleccionada])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.precio) {
      toast({
        title: "Error",
        description: "El precio es requerido",
        variant: "destructive"
      })
      return
    }

    // Para nuevas unidades, generar código automático si no existe
    if (!isEditing && !formData.codigo) {
      const codigo = await generarCodigoAutomatico(formData.tipoUnidad)
      if (!codigo) {
        toast({
          title: "Error",
          description: "No se pudo generar el código automático",
          variant: "destructive"
        })
        return
      }
    }

    if (formData.tipoUnidad === 'PARCELA') {
      if (!formData.dimensionLargo || !formData.dimensionAncho || !formData.capacidad) {
        toast({
          title: "Error",
          description: "Dimensiones y capacidad son requeridas para parcelas",
          variant: "destructive"
        })
        return
      }
    } else if (formData.tipoUnidad === 'NICHO') {
      if (!formData.nivelVertical || !formData.capacidadUrnas || !formData.medidaAlto || !formData.medidaAncho || !formData.medidaProfundidad) {
        toast({
          title: "Error",
          description: "Nivel, capacidad y medidas son requeridas para nichos",
          variant: "destructive"
        })
        return
      }
    } else if (formData.tipoUnidad === 'MAUSOLEO') {
      if (!formData.dimensionLargo || !formData.dimensionAncho || !formData.capacidadPersonas || !formData.niveles) {
        toast({
          title: "Error",
          description: "Dimensiones, capacidad y niveles son requeridos para mausoleos",
          variant: "destructive"
        })
        return
      }
    }

    try {
      setLoading(true)

      const payload: any = {
        codigo: formData.codigo,
        precio: parseFloat(formData.precio),
        estado: formData.estado,
        tipoUnidad: formData.tipoUnidad,
        descripcion: formData.descripcion || undefined,
        observaciones: formData.observaciones || undefined,
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
        pabellonId
      }

      if (formData.tipoUnidad === 'PARCELA') {
        payload.parcela = {
          dimensionLargo: parseFloat(formData.dimensionLargo),
          dimensionAncho: parseFloat(formData.dimensionAncho),
          capacidad: parseInt(formData.capacidad),
          tipoTerreno: formData.tipoTerreno
        }
      } else if (formData.tipoUnidad === 'NICHO') {
        payload.nicho = {
          nivelVertical: parseInt(formData.nivelVertical),
          capacidadUrnas: parseInt(formData.capacidadUrnas),
          material: formData.material,
          medidaAlto: parseFloat(formData.medidaAlto),
          medidaAncho: parseFloat(formData.medidaAncho),
          medidaProfundidad: parseFloat(formData.medidaProfundidad)
        }
      } else if (formData.tipoUnidad === 'MAUSOLEO') {
        payload.mausoleo = {
          dimensionLargo: parseFloat(formData.dimensionLargo),
          dimensionAncho: parseFloat(formData.dimensionAncho),
          capacidadPersonas: parseInt(formData.capacidadPersonas),
          tipoConstruccion: formData.tipoConstruccion,
          material: formData.materialMausoleo,
          niveles: parseInt(formData.niveles)
        }
      }

      const url = isEditing 
        ? `/api/proyectos/${proyectoId}/unidades-cementerio/${unidad!.id}`
        : `/api/proyectos/${proyectoId}/unidades-cementerio`

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData)
      }

      const result = await response.json()

      toast({
        title: isEditing ? "Unidad actualizada" : "Unidad creada",
        description: isEditing 
          ? "La unidad se ha actualizado correctamente"
          : "La unidad se ha creado correctamente",
      })

      onUnidadCreated?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar la solicitud",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderCamposEspecificos = () => {
    switch (formData.tipoUnidad) {
      case 'PARCELA':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dimensionLargo">Largo (m)</Label>
              <Input
                id="dimensionLargo"
                type="number"
                step="0.01"
                value={formData.dimensionLargo}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensionLargo: e.target.value }))}
                placeholder="Ej: 5.00"
              />
            </div>
            <div>
              <Label htmlFor="dimensionAncho">Ancho (m)</Label>
              <Input
                id="dimensionAncho"
                type="number"
                step="0.01"
                value={formData.dimensionAncho}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensionAncho: e.target.value }))}
                placeholder="Ej: 3.00"
              />
            </div>
            <div>
              <Label htmlFor="capacidad">Capacidad (personas)</Label>
              <Input
                id="capacidad"
                type="number"
                value={formData.capacidad}
                onChange={(e) => setFormData(prev => ({ ...prev, capacidad: e.target.value }))}
                placeholder="Ej: 4"
              />
            </div>
            <div>
              <Label htmlFor="tipoTerreno">Tipo de Terreno</Label>
              <Select
                value={formData.tipoTerreno}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipoTerreno: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TIERRA">Tierra</SelectItem>
                  <SelectItem value="CEMENTO">Cemento</SelectItem>
                  <SelectItem value="JARDIN">Jardín</SelectItem>
                  <SelectItem value="CESPED">Césped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'NICHO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nivelVertical">Nivel Vertical</Label>
              <Input
                id="nivelVertical"
                type="number"
                value={formData.nivelVertical}
                onChange={(e) => setFormData(prev => ({ ...prev, nivelVertical: e.target.value }))}
                placeholder="Ej: 1"
              />
            </div>
            <div>
              <Label htmlFor="capacidadUrnas">Capacidad de Urnas</Label>
              <Input
                id="capacidadUrnas"
                type="number"
                value={formData.capacidadUrnas}
                onChange={(e) => setFormData(prev => ({ ...prev, capacidadUrnas: e.target.value }))}
                placeholder="Ej: 2"
              />
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Select
                value={formData.material}
                onValueChange={(value) => setFormData(prev => ({ ...prev, material: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONCRETO">Concreto</SelectItem>
                  <SelectItem value="MARMOL">Mármol</SelectItem>
                  <SelectItem value="OTROS">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="medidaAlto">Alto (cm)</Label>
              <Input
                id="medidaAlto"
                type="number"
                step="0.1"
                value={formData.medidaAlto}
                onChange={(e) => setFormData(prev => ({ ...prev, medidaAlto: e.target.value }))}
                placeholder="Ej: 60.0"
              />
            </div>
            <div>
              <Label htmlFor="medidaAncho">Ancho (cm)</Label>
              <Input
                id="medidaAncho"
                type="number"
                step="0.1"
                value={formData.medidaAncho}
                onChange={(e) => setFormData(prev => ({ ...prev, medidaAncho: e.target.value }))}
                placeholder="Ej: 40.0"
              />
            </div>
            <div>
              <Label htmlFor="medidaProfundidad">Profundidad (cm)</Label>
              <Input
                id="medidaProfundidad"
                type="number"
                step="0.1"
                value={formData.medidaProfundidad}
                onChange={(e) => setFormData(prev => ({ ...prev, medidaProfundidad: e.target.value }))}
                placeholder="Ej: 50.0"
              />
            </div>
          </div>
        )

      case 'MAUSOLEO':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dimensionLargo">Largo (m)</Label>
              <Input
                id="dimensionLargo"
                type="number"
                step="0.01"
                value={formData.dimensionLargo}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensionLargo: e.target.value }))}
                placeholder="Ej: 8.00"
              />
            </div>
            <div>
              <Label htmlFor="dimensionAncho">Ancho (m)</Label>
              <Input
                id="dimensionAncho"
                type="number"
                step="0.01"
                value={formData.dimensionAncho}
                onChange={(e) => setFormData(prev => ({ ...prev, dimensionAncho: e.target.value }))}
                placeholder="Ej: 6.00"
              />
            </div>
            <div>
              <Label htmlFor="capacidadPersonas">Capacidad de Personas</Label>
              <Input
                id="capacidadPersonas"
                type="number"
                value={formData.capacidadPersonas}
                onChange={(e) => setFormData(prev => ({ ...prev, capacidadPersonas: e.target.value }))}
                placeholder="Ej: 8"
              />
            </div>
            <div>
              <Label htmlFor="niveles">Niveles</Label>
              <Input
                id="niveles"
                type="number"
                value={formData.niveles}
                onChange={(e) => setFormData(prev => ({ ...prev, niveles: e.target.value }))}
                placeholder="Ej: 2"
              />
            </div>
            <div>
              <Label htmlFor="tipoConstruccion">Tipo de Construcción</Label>
              <Select
                value={formData.tipoConstruccion}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipoConstruccion: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAMILIAR">Familiar</SelectItem>
                  <SelectItem value="COLECTIVO">Colectivo</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="materialMausoleo">Material</Label>
              <Select
                value={formData.materialMausoleo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, materialMausoleo: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LADRILLO">Ladrillo</SelectItem>
                  <SelectItem value="CONCRETO">Concreto</SelectItem>
                  <SelectItem value="GRANITO">Granito</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setMostrarFormulario(false)
      setUnidadPendienteSeleccionada(null)
      setIsPendienteSelectorOpen(false)
      setHuecos({ PARCELA: [], NICHO: [], MAUSOLEO: [] })
      setCodigoGenerado('')
      if (!isEditing) {
        setFormData({
          codigo: '',
          precio: '',
          estado: 'DISPONIBLE',
          tipoUnidad: '',
          descripcion: '',
          observaciones: '',
          latitud: '',
          longitud: '',
          dimensionLargo: '',
          dimensionAncho: '',
          capacidad: '',
          tipoTerreno: 'TIERRA',
          nivelVertical: '',
          capacidadUrnas: '',
          material: 'CONCRETO',
          medidaAlto: '',
          medidaAncho: '',
          medidaProfundidad: '',
          capacidadPersonas: '',
          tipoConstruccion: 'FAMILIAR',
          niveles: '',
          materialMausoleo: 'CONCRETO'
        })
      }
    }
  }, [open, isEditing])

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Unidad de Cementerio' : 'Nueva Unidad de Cementerio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la unidad de cementerio'
              : 'Completa la información para crear una nueva unidad de cementerio'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de tipo de unidad primero - Más llamativo */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-center block">
              {isEditing ? 'Tipo de Unidad' : '¿Qué tipo de unidad deseas crear?'}
            </Label>
            
            {isEditing ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {formData.tipoUnidad === 'PARCELA' ? '🏞️' : 
                       formData.tipoUnidad === 'NICHO' ? '🏛️' : '⛪'}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {formData.tipoUnidad === 'PARCELA' ? 'Parcela' : 
                       formData.tipoUnidad === 'NICHO' ? 'Nicho' : 'Mausoleo'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {formData.tipoUnidad === 'PARCELA' ? 'Terreno para entierro tradicional' : 
                       formData.tipoUnidad === 'NICHO' ? 'Espacio vertical para urnas' : 'Construcción familiar'}
                    </p>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>No se puede cambiar el tipo de unidad.</strong> Si necesitas cambiar el tipo, 
                        elimina esta unidad y crea una nueva con el tipo deseado.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            ) : formData.tipoUnidad && mostrarFormulario ? (
              // Mostrar tipo seleccionado de forma no editable
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {formData.tipoUnidad === 'PARCELA' ? '🏞️' : 
                       formData.tipoUnidad === 'NICHO' ? '🏛️' : '⛪'}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      {formData.tipoUnidad === 'PARCELA' ? 'Parcela' : 
                       formData.tipoUnidad === 'NICHO' ? 'Nicho' : 'Mausoleo'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {formData.tipoUnidad === 'PARCELA' ? 'Terreno para entierro tradicional' : 
                       formData.tipoUnidad === 'NICHO' ? 'Espacio vertical para urnas' : 'Construcción familiar'}
                    </p>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Tipo de unidad seleccionado.</strong> No se puede cambiar el tipo una vez seleccionado. 
                        Si necesitas cambiar el tipo, cierra este modal y selecciona el tipo deseado.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            ) : (
              // Mostrar selectores de tipo solo si no hay tipo seleccionado
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    formData.tipoUnidad === 'PARCELA' 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, tipoUnidad: 'PARCELA' }))}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏞️</div>
                    <h3 className="font-semibold text-lg mb-2">Parcela</h3>
                    <p className="text-sm text-gray-600">Terreno para entierro tradicional</p>
                  </div>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    formData.tipoUnidad === 'NICHO' 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, tipoUnidad: 'NICHO' }))}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏛️</div>
                    <h3 className="font-semibold text-lg mb-2">Nicho</h3>
                    <p className="text-sm text-gray-600">Espacio vertical para urnas</p>
                  </div>
                </div>
                
                <div 
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    formData.tipoUnidad === 'MAUSOLEO' 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, tipoUnidad: 'MAUSOLEO' }))}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">⛪</div>
                    <h3 className="font-semibold text-lg mb-2">Mausoleo</h3>
                    <p className="text-sm text-gray-600">Construcción familiar</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mensajes informativos con código específico */}
          {!isEditing && formData.tipoUnidad && mostrarFormulario && (
            <div className="space-y-3">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Código:</strong> {generatingCode ? 'Generando...' : codigoGenerado ? `Se creará con el código: ${codigoGenerado}` : 'Generando código...'}
                </AlertDescription>
              </Alert>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Estado:</strong> Se creará por defecto como "DISPONIBLE"
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Campos del formulario - Solo habilitados si hay tipo seleccionado */}
          {formData.tipoUnidad && mostrarFormulario && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData(prev => ({ ...prev, precio: e.target.value }))}
                    placeholder="Ej: 5000.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitud">Latitud</Label>
                  <Input
                    id="latitud"
                    type="number"
                    step="0.000001"
                    value={formData.latitud}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitud: e.target.value }))}
                    placeholder="Ej: -12.046374"
                  />
                </div>
                <div>
                  <Label htmlFor="longitud">Longitud</Label>
                  <Input
                    id="longitud"
                    type="number"
                    step="0.000001"
                    value={formData.longitud}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitud: e.target.value }))}
                    placeholder="Ej: -77.042793"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción de la unidad"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                  placeholder="Observaciones adicionales"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-base font-medium">Campos Específicos - {formData.tipoUnidad}</Label>
                <div className="mt-4">
                  {renderCamposEspecificos()}
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.tipoUnidad || (!isEditing && !codigoGenerado) || !mostrarFormulario}
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Selector de unidades pendientes (huecos) */}
    <UnidadCementerioPendienteSelector
      huecos={huecos}
      isOpen={isPendienteSelectorOpen}
      onClose={() => setIsPendienteSelectorOpen(false)}
      onUnidadSeleccionada={handleUnidadPendienteSeleccionada}
      onContinuarNormal={handleContinuarNormal}
    />
    </>
  )
}
