'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  User, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  FileText, 
  Users, 
  Calculator,
  Percent,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Table as TableIcon,
  TrendingUp
} from 'lucide-react'


interface Cliente {
  id: string
  nombre: string
  apellido?: string
  email?: string
  telefono?: string
}

interface Unidad {
  id: string
  codigo: string
  precio: number
  estado: string
  tipoUnidad?: string
  manzana?: {
    nombre: string
    proyecto: {
      id: string
      nombre: string
    }
  }
  pabellon?: {
    nombre: string
    proyecto: {
      id: string
      nombre: string
    }
  }
}

interface VentaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO'
  unidadId?: string
  proyectoId?: string
}

export default function VentaModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  tipoVenta, 
  unidadId,
  proyectoId
}: VentaModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingUnidades, setLoadingUnidades] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null)
  const [formData, setFormData] = useState({
    unidadId: unidadId || '',
    clienteId: '',
    fechaVenta: new Date().toISOString().split('T')[0],
    fechaEntrega: '',
    precioOriginal: '',
    precioVenta: '',
    montoDescuento: '',
    motivoDescuento: '',
    tipoVenta: 'CONTADO',
    formaPago: 'EFECTIVO',
    montoInicial: '',
    numeroCuotas: '12',
    frecuenciaCuota: 'MENSUAL',
    montoCuota: '',
    fechaPrimeraCuota: '',
    saldoPendiente: '',
    comisionVendedor: '',
    porcentajeComision: '',
    estadoDocumentacion: 'PENDIENTE',
    documentosRequeridos: '',
    condicionesEspeciales: '',
    observaciones: '',
    // NUEVO: Campos de amortización
    aplicarIntereses: false,
      modeloAmortizacion: 'FRANCES' as 'FRANCES' | 'ALEMAN' | 'JAPONES',
    tasaInteresAnual: '',
    montoIntereses: '',
    montoCapital: '',
    saldoCapital: '',
    // Campos para selección de unidad
    manzanaId: '',
    vendedorId: '',
    // Campos para múltiples clientes
    clientes: [] as string[],
    // Campos para cuotas personalizadas
    cuotasPersonalizadas: false,
    cuotasPersonalizadasList: [] as Array<{monto: number, fecha: string, intereses?: number}>,
    // Campos para comprobantes
    comprobantesPago: [] as Array<{
      id: string
      tipo: 'INICIAL' | 'CUOTA' | 'CONTADO'
      monto: number
      fecha: string
      archivo: File | null
      nombreArchivo: string
      descripcion: string
      numeroOperacion?: string
    }>
  })
  const { toast } = useToast()

  // Estado para múltiples clientes
  const [clientesSeleccionados, setClientesSeleccionados] = useState<Cliente[]>([])
  const [clienteTemporal, setClienteTemporal] = useState<string>('')

  // Estado para vendedores
  const [vendedores, setVendedores] = useState<Array<{
    id: string
    nombre: string
    apellido: string
    email: string
    rol: string
    isActive: boolean
  }>>([])
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<string>('')

  // Estado para selección procedimental
  const [manzanasPabellones, setManzanasPabellones] = useState<Array<{
    id: string
    nombre: string
    proyecto: {
      id: string
      nombre: string
    }
    unidades: Unidad[]
  }>>([])
  const [manzanaPabellonSeleccionado, setManzanaPabellonSeleccionado] = useState<string>('')
  const [unidadesDisponibles, setUnidadesDisponibles] = useState<Unidad[]>([])

  // Estado para cuotas personalizadas
  const [modoCuotasPersonalizadas, setModoCuotasPersonalizadas] = useState(false)



  // Estado para cuotas generadas (regulares o personalizadas)
  const [cuotasGeneradas, setCuotasGeneradas] = useState<Array<{
    numeroCuota: number
    fechaVencimiento: Date
    monto: number
    montoCapital: number
    montoInteres: number
    saldoCapitalAnterior: number
    saldoCapitalPosterior: number
    estado: string
    montoPagado: number
  }>>([])

  // Estado para comprobantes de pago (eliminado - se usa formData.comprobantesPago)

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('informacion')

  // Estado para mensaje de error de comprobantes pendientes
  const [comprobantesError, setComprobantesError] = useState('')

  // Estado para validaciones
  const [validaciones, setValidaciones] = useState({
    precioVenta: { valido: true, mensaje: '' },
    montoInicial: { valido: true, mensaje: '' },
    saldoPendiente: { valido: true, mensaje: '' },
    numeroCuotas: { valido: true, mensaje: '' },
    montoCuota: { valido: true, mensaje: '' },
    fechaPrimeraCuota: { valido: true, mensaje: '' },
    cuotas: { valido: true, mensaje: '' },
    tasaInteresAnual: { valido: true, mensaje: '' }
  })

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      limpiarFormulario()
    } else {
      // Limpiar mensaje de error cuando se cierra el modal
      setComprobantesError('')
    }
  }, [isOpen])

  // Cargar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('/api/clientes')
        if (response.ok) {
          const data = await response.json()
          setClientes(data)
        } else {
          console.error('❌ Error al cargar clientes:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('❌ Error al cargar clientes:', error)
      }
    }

    if (isOpen) {
      fetchClientes()
    }
  }, [isOpen])

  // Cargar unidades disponibles y organizarlas por manzanas/pabellones
  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        setLoadingUnidades(true)
        const endpoint = tipoVenta === 'LOTE' 
          ? '/api/ventas/lotes-disponibles'
          : '/api/ventas/unidades-cementerio-disponibles'
        
        // Si tenemos proyectoId, filtrar por proyecto
        const url = proyectoId 
          ? `${endpoint}?proyectoId=${proyectoId}`
          : endpoint
        
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          setUnidades(data)
          
          // Organizar unidades por manzanas/pabellones
          const manzanasPabellonesMap = new Map()
          
          data.forEach((unidad: Unidad) => {
            const proyectoInfo = tipoVenta === 'LOTE' 
              ? unidad.manzana?.proyecto 
              : unidad.pabellon?.proyecto
            const manzanaPabellonInfo = tipoVenta === 'LOTE' 
              ? unidad.manzana 
              : unidad.pabellon
            
            // Filtrar por proyecto si se proporciona proyectoId
            if (proyectoId && proyectoInfo && proyectoInfo.id !== proyectoId) {
              return // Saltar esta unidad si no pertenece al proyecto
            }
            
            if (proyectoInfo && manzanaPabellonInfo) {
              const key = `${proyectoInfo.id}-${manzanaPabellonInfo.nombre}`
              
              if (!manzanasPabellonesMap.has(key)) {
                manzanasPabellonesMap.set(key, {
                  id: key,
                  nombre: manzanaPabellonInfo.nombre,
                  proyecto: {
                    id: proyectoInfo.id,
                    nombre: proyectoInfo.nombre
                  },
                  unidades: []
                })
              }
              
              manzanasPabellonesMap.get(key).unidades.push(unidad)
            }
          })
          
          const manzanasPabellonesArray = Array.from(manzanasPabellonesMap.values())
          setManzanasPabellones(manzanasPabellonesArray)
          
          // Si solo hay una manzana/pabellón y tenemos proyectoId, seleccionarla automáticamente
          if (proyectoId && manzanasPabellonesArray.length === 1) {
            setManzanaPabellonSeleccionado(manzanasPabellonesArray[0].id)
            setFormData(prev => ({ ...prev, manzanaId: manzanasPabellonesArray[0].id }))
          }
        } else {
          toast({
            title: 'Error',
            description: 'Error al cargar las unidades disponibles',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('Error al cargar unidades:', error)
        toast({
          title: 'Error',
          description: 'Error al cargar las unidades disponibles',
          variant: 'destructive'
        })
      } finally {
        setLoadingUnidades(false)
      }
    }

    if (isOpen) {
      fetchUnidades()
    }
  }, [isOpen, tipoVenta, proyectoId, toast])

  // Actualizar unidades disponibles cuando se selecciona una manzana/pabellón
  useEffect(() => {
    if (manzanaPabellonSeleccionado) {
      const manzanaPabellon = manzanasPabellones.find(mp => mp.id === manzanaPabellonSeleccionado)
      if (manzanaPabellon) {
        setUnidadesDisponibles(manzanaPabellon.unidades)
      }
    } else {
      // Si no hay manzana seleccionada, mostrar todas las unidades del proyecto
      if (proyectoId) {
        setUnidadesDisponibles(unidades)
    } else {
      setUnidadesDisponibles([])
    }
    }
    
    // Limpiar unidad seleccionada cuando cambia la manzana/pabellón
    setFormData(prev => ({ ...prev, unidadId: '' }))
    setSelectedUnidad(null)
  }, [manzanaPabellonSeleccionado, manzanasPabellones, proyectoId, unidades])

  // Cargar vendedores
  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        const response = await fetch('/api/vendedores')
        if (response.ok) {
          const data = await response.json()
          // Extraer solo los usuarios de los perfiles de vendedor
          const usuariosVendedores = data.vendedores.map((perfil: any) => perfil.usuario)
          setVendedores(usuariosVendedores || [])
        } else if (response.status === 403) {
          console.warn('No tienes permisos para ver vendedores')
          setVendedores([])
        } else {
          console.error('Error al cargar vendedores:', response.status)
          setVendedores([])
        }
      } catch (error) {
        console.error('Error al cargar vendedores:', error)
        setVendedores([])
      }
    }

    if (isOpen) {
      fetchVendedores()
    }
  }, [isOpen])

  // Actualizar unidad seleccionada
  useEffect(() => {
    if (formData.unidadId) {
      const unidad = unidadesDisponibles.find(u => u.id === formData.unidadId)
      setSelectedUnidad(unidad || null)
      if (unidad) {
        const precioOriginal = unidad.precio
        const precioVenta = unidad.precio
        
        setFormData(prev => ({ 
          ...prev, 
          precioOriginal: precioOriginal.toString(),
          precioVenta: precioVenta.toString()
          // NO establecer montoDescuento - debe quedar vacío hasta que el usuario lo configure
        }))
      } else {
        setFormData({...formData, unidadId: formData.unidadId})
      }
    }
  }, [formData.unidadId, unidadesDisponibles])

  // Calcular descuento y precio de venta
  useEffect(() => {
    const precioOriginal = parseFloat(formData.precioOriginal) || 0
    const montoDescuento = parseFloat(formData.montoDescuento) || 0
    const precioVenta = precioOriginal - montoDescuento
    
    if (precioVenta > 0) {
      setFormData(prev => ({ 
        ...prev, 
        precioVenta: precioVenta.toFixed(2)
      }))
      
      // Validar descuento
      if (montoDescuento > precioOriginal) {
        setValidaciones(prev => ({
          ...prev,
          precioVenta: { 
            valido: false, 
            mensaje: 'El descuento no puede ser mayor al precio original' 
          }
        }))
      } else if (montoDescuento < 0) {
        setValidaciones(prev => ({
          ...prev,
          precioVenta: { 
            valido: false, 
            mensaje: 'El descuento no puede ser negativo' 
          }
        }))
      } else {
        setValidaciones(prev => ({
          ...prev,
          precioVenta: { valido: true, mensaje: '' }
        }))
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        precioVenta: '0.00'
      }))
      setValidaciones(prev => ({
        ...prev,
        precioVenta: { 
          valido: false, 
          mensaje: 'El precio de venta debe ser mayor a 0' 
        }
      }))
    }
  }, [formData.precioOriginal, formData.montoDescuento])

  // Calcular monto por cuota
  useEffect(() => {
    if (formData.tipoVenta === 'CUOTAS') {
      const precioVenta = parseFloat(formData.precioVenta) || 0
      const montoInicial = parseFloat(formData.montoInicial) || 0
      const numeroCuotas = parseInt(formData.numeroCuotas) || 1
      const saldoFinanciar = precioVenta - montoInicial
      
      // Validar monto inicial
      if (montoInicial > precioVenta) {
        setValidaciones(prev => ({
          ...prev,
          montoInicial: { 
            valido: false, 
            mensaje: 'El monto inicial no puede ser mayor al precio de venta' 
          }
        }))
      } else if (montoInicial < 0) {
        setValidaciones(prev => ({
          ...prev,
          montoInicial: { 
            valido: false, 
            mensaje: 'El monto inicial debe ser mayor o igual a 0' 
          }
        }))
      } else {
        setValidaciones(prev => ({
          ...prev,
          montoInicial: { valido: true, mensaje: '' }
        }))
      }

      // Validar número de cuotas
      if (numeroCuotas <= 0) {
        setValidaciones(prev => ({
          ...prev,
          cuotas: { 
            valido: false, 
            mensaje: 'El número de cuotas debe ser mayor a 0' 
          }
        }))
      } else if (numeroCuotas > 120) {
        setValidaciones(prev => ({
          ...prev,
          cuotas: { 
            valido: false, 
            mensaje: 'El número de cuotas no puede exceder 120' 
          }
        }))
      } else {
        setValidaciones(prev => ({
          ...prev,
          cuotas: { valido: true, mensaje: '' }
        }))
      }

      // Validar saldo pendiente
      if (saldoFinanciar < 0) {
        setValidaciones(prev => ({
          ...prev,
          saldoPendiente: { 
            valido: false, 
            mensaje: 'El saldo pendiente no puede ser negativo' 
          }
        }))
      } else {
        setValidaciones(prev => ({
          ...prev,
          saldoPendiente: { valido: true, mensaje: '' }
        }))
      }
      
      // NUEVO: Validaciones de tasas de interés
      if (formData.aplicarIntereses && formData.tasaInteresAnual) {
        const tasaInteres = parseFloat(formData.tasaInteresAnual)
        
        if (isNaN(tasaInteres)) {
          setValidaciones(prev => ({
            ...prev,
            tasaInteresAnual: { 
              valido: false, 
              mensaje: 'La tasa de interés debe ser un número válido' 
            }
          }))
        } else if (tasaInteres < 0 || tasaInteres > 100) {
          setValidaciones(prev => ({
            ...prev,
            tasaInteresAnual: { 
              valido: false, 
              mensaje: 'La tasa de interés debe estar entre 0% y 100%' 
            }
          }))
        } else if (tasaInteres === 0) {
          setValidaciones(prev => ({
            ...prev,
            tasaInteresAnual: { 
              valido: false, 
              mensaje: 'Si se aplican intereses, la tasa debe ser mayor a 0%' 
            }
          }))
        } else {
          setValidaciones(prev => ({
            ...prev,
            tasaInteresAnual: { valido: true, mensaje: '' }
          }))
        }
      } else if (formData.aplicarIntereses && !formData.tasaInteresAnual) {
        setValidaciones(prev => ({
          ...prev,
          tasaInteresAnual: { 
            valido: false, 
            mensaje: 'Debe ingresar una tasa de interés' 
          }
        }))
      } else {
        setValidaciones(prev => ({
          ...prev,
          tasaInteresAnual: { valido: true, mensaje: '' }
        }))
      }

      // Calcular monto por cuota
      let montoCuota = 0
      if (numeroCuotas > 0) {
        // Si hay intereses aplicados, usar amortización
        if (formData.aplicarIntereses && parseFloat(formData.tasaInteresAnual) > 0) {
          const tasaInteresAnual = parseFloat(formData.tasaInteresAnual)
          
          // Calcular la tasa de interés según la frecuencia
          let periodosPorAno = 12 // Por defecto mensual
          
          switch (formData.frecuenciaCuota) {
            case 'MENSUAL':
              periodosPorAno = 12
              break
            case 'BIMESTRAL':
              periodosPorAno = 6
              break
            case 'TRIMESTRAL':
              periodosPorAno = 4
              break
            case 'SEMESTRAL':
              periodosPorAno = 2
              break
            case 'ANUAL':
              periodosPorAno = 1
              break
            case 'QUINCENAL':
              periodosPorAno = 24
              break
            case 'SEMANAL':
              periodosPorAno = 52
              break
            default:
              periodosPorAno = 12
          }
          
          const tasaInteresPorPeriodo = tasaInteresAnual / periodosPorAno / 100
          
          // Fórmula de amortización francesa
          montoCuota = saldoFinanciar * (tasaInteresPorPeriodo * Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas)) / (Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas) - 1)
        } else {
          // Cálculo sin intereses
          const montoCuotaDecimal = saldoFinanciar / numeroCuotas
          // Tomar solo la parte entera para las cuotas regulares
          const cuotaEntera = Math.floor(montoCuotaDecimal)
          
          // Calcular la diferencia que se acumulará en la última cuota
          const diferencia = saldoFinanciar - (cuotaEntera * numeroCuotas)
          
          // El monto por cuota que se muestra es la cuota entera
          montoCuota = cuotaEntera
          
          // Si hay diferencia, se acumulará en la última cuota
          // pero el campo montoCuota debe mostrar la cuota entera
        }
      }
      
      setFormData(prev => ({ 
        ...prev, 
        montoCuota: montoCuota.toFixed(2),
        saldoPendiente: saldoFinanciar.toFixed(2)
      }))
    }
  }, [formData.tipoVenta, formData.precioVenta, formData.montoInicial, formData.numeroCuotas, formData.aplicarIntereses, formData.tasaInteresAnual, formData.frecuenciaCuota])

  // Funciones para calcular comisiones
  const calcularPorcentajeDesdeMonto = (monto: string) => {
    const precioVenta = parseFloat(formData.precioVenta) || 0
    const montoComision = parseFloat(monto) || 0
    
    if (precioVenta > 0 && montoComision > 0) {
      const porcentaje = (montoComision / precioVenta) * 100
      setFormData(prev => ({ 
        ...prev, 
        porcentajeComision: porcentaje.toFixed(2)
      }))
    }
  }

  const calcularMontoDesdePorcentaje = (porcentaje: string) => {
    const precioVenta = parseFloat(formData.precioVenta) || 0
    const porcentajeComision = parseFloat(porcentaje) || 0
    
    if (precioVenta > 0 && porcentajeComision > 0) {
      const monto = (precioVenta * porcentajeComision) / 100
      setFormData(prev => ({ 
        ...prev, 
        comisionVendedor: monto.toFixed(2)
      }))
    }
  }

  // Función para validar si el formulario está completo basado en grupos obligatorios
  const isFormValid = () => {
    const progress = getFormProgress()
    
    // El formulario es válido si todos los grupos obligatorios están completos
    // (excluyendo Documentación que es opcional)
    return progress.camposCompletados === progress.totalCampos
  }

  // Función para validar archivos de comprobantes (solo al crear la venta)
  const validarComprobantesParaCrearVenta = () => {
    // Verificar si hay pagos que requieren comprobantes
    const hayPagosQueRequierenComprobantes = (() => {
      if (formData.tipoVenta === 'CONTADO') {
        const montoTotal = parseFloat(formData.precioVenta) || 0
        return montoTotal > 0
      } else if (formData.tipoVenta === 'CUOTAS') {
        const montoInicial = parseFloat(formData.montoInicial) || 0
        if (montoInicial > 0) return true
        
        // Verificar si hay cuotas personalizadas vencidas con montos > 0
        if (formData.cuotasPersonalizadas && formData.cuotasPersonalizadasList.length > 0) {
          const fechaActual = new Date()
          fechaActual.setHours(0, 0, 0, 0)
          return formData.cuotasPersonalizadasList.some(cuota => {
            const montoCuota = typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0
            if (montoCuota > 0) {
              const fechaCuota = new Date(cuota.fecha)
              fechaCuota.setHours(0, 0, 0, 0)
              return fechaCuota <= fechaActual
            }
            return false
          })
        }
        
        // Para cuotas regulares, verificar si hay saldo a financiar
        const saldoPendiente = parseFloat(formData.saldoPendiente) || 0
        return saldoPendiente > 0
      }
      return false
    })()

    // Si hay pagos que requieren comprobantes, verificar que tengan archivos adjuntos
    if (hayPagosQueRequierenComprobantes) {
      if (formData.comprobantesPago.length === 0) {
        return { valido: false, mensaje: 'Debes generar los comprobantes de pago en la pestaña "Comprobantes"' }
      }

      const comprobantesSinArchivo = formData.comprobantesPago.filter(comp => !comp.archivo)
      
      if (comprobantesSinArchivo.length > 0) {
        return { valido: false, mensaje: `Faltan ${comprobantesSinArchivo.length} comprobante(s) sin archivo adjunto` }
      }
    }

    return { valido: true, mensaje: '' }
  }

  // Función para obtener el progreso del formulario basado en grupos independientes
  const getFormProgress = () => {
    let gruposCompletados = 0
    const gruposObligatorios = []

    // 1. Selección de Unidad (requiere MANZANA Y UNIDAD)
    const unidadCompleta = !!(formData.manzanaId && formData.unidadId)
    gruposObligatorios.push({
      nombre: 'Selección de Unidad',
      valido: unidadCompleta
    })
    if (unidadCompleta) gruposCompletados++

    // 2. Información de Venta (requiere FECHA VENTA, FECHA ENTREGA Y VENDEDOR)
    const infoVentaCompleta = !!(formData.fechaVenta && formData.fechaEntrega && formData.vendedorId)
    gruposObligatorios.push({
      nombre: 'Información de Venta',
      valido: infoVentaCompleta
    })
    if (infoVentaCompleta) gruposCompletados++

    // 3. Gestión de Clientes (requiere al menos 1 cliente)
    const clientesCompletos = clientesSeleccionados.length > 0
    gruposObligatorios.push({
      nombre: 'Gestión de Clientes',
      valido: clientesCompletos
    })
    if (clientesCompletos) gruposCompletados++

    // 4. Configuración de Precios (requiere PRECIO ORIGINAL, PRECIO VENTA Y DESCUENTO)
    const preciosCompletos = !!(formData.precioOriginal && parseFloat(formData.precioOriginal) > 0) && 
      !!(formData.precioVenta && parseFloat(formData.precioVenta) > 0) &&
      (formData.montoDescuento !== undefined && formData.montoDescuento !== '')
    gruposObligatorios.push({
      nombre: 'Configuración de Precios',
      valido: preciosCompletos
    })
    if (preciosCompletos) gruposCompletados++

    // 5. Configuración de Pagos (requiere TIPO VENTA, FORMA PAGO, COMISIÓN Y PORCENTAJE)
    const pagosCompletos = (() => {
      if (formData.tipoVenta === 'CONTADO') {
        // Para contado, requiere tipo de venta, forma de pago, comisión y porcentaje
        return formData.tipoVenta === 'CONTADO' && 
               formData.formaPago && 
               (formData.comisionVendedor !== undefined && formData.comisionVendedor !== '') &&
               (formData.porcentajeComision !== undefined && formData.porcentajeComision !== '')
      } else if (formData.tipoVenta === 'CUOTAS') {
        // Para cuotas, requiere solo tipo de venta, forma de pago, comisión y porcentaje
        // La configuración de cuotas se valida en un grupo separado
        return formData.formaPago &&
               (formData.comisionVendedor !== undefined && formData.comisionVendedor !== '') &&
               (formData.porcentajeComision !== undefined && formData.porcentajeComision !== '')
      }
      return false
    })()
    
    gruposObligatorios.push({
      nombre: 'Configuración de Pagos',
      valido: pagosCompletos
    })
    if (pagosCompletos) gruposCompletados++

    // 6. Configuración de Cuotas (solo si es venta en cuotas)
    let cuotasCompletas = false
    if (formData.tipoVenta === 'CUOTAS') {
      // Verificar que se haya generado la lista de cuotas con al menos una cuota
      cuotasCompletas = cuotasGeneradas && cuotasGeneradas.length > 0
      gruposObligatorios.push({
        nombre: 'Configuración de Cuotas',
        valido: cuotasCompletas
      })
      if (cuotasCompletas) gruposCompletados++
    }

    // 7. Comprobantes de Pago (requiere comprobantes generados Y archivos adjuntos)
    const comprobantesValidos = formData.comprobantesPago.length > 0 && 
      formData.comprobantesPago.every(comp => comp.archivo)
    gruposObligatorios.push({
      nombre: 'Comprobantes de Pago',
      valido: comprobantesValidos
    })
    if (comprobantesValidos) gruposCompletados++

    // NO incluir "Documentación" como obligatorio

    const totalGrupos = gruposObligatorios.length
    const porcentaje = Math.round((gruposCompletados / totalGrupos) * 100)

    return {
      porcentaje,
      camposCompletados: gruposCompletados,
      totalCampos: totalGrupos,
      camposFaltantes: gruposObligatorios.filter(grupo => !grupo.valido).map(grupo => grupo.nombre)
    }
  }

  // Función para obtener la numeración de secciones
  const getSectionNumber = (sectionName: string) => {
    const sections = [
      'Selección de Unidad',
      'Información de Venta', 
      'Gestión de Clientes',
      'Configuración de Precios',
      'Configuración de Pagos'
    ]
    
    // Agregar sección de cuotas solo si es venta en cuotas
    if (formData.tipoVenta === 'CUOTAS') {
      sections.push('Configuración de Cuotas')
    }
    
    // Agregar secciones finales
    sections.push('Comprobantes de Pago', 'Documentación')
    
    const index = sections.findIndex(section => section.includes(sectionName))
    return index >= 0 ? index + 1 : 0
  }

  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setFormData({
      unidadId: unidadId || '',
      clienteId: '',
      fechaVenta: new Date().toISOString().split('T')[0],
      fechaEntrega: '',
      precioOriginal: '',
      precioVenta: '',
      montoDescuento: '',
      motivoDescuento: '',
      tipoVenta: 'CONTADO',
      formaPago: 'EFECTIVO',
      montoInicial: '',
      numeroCuotas: '12',
      frecuenciaCuota: 'MENSUAL',
      montoCuota: '',
      fechaPrimeraCuota: '',
      saldoPendiente: '',
      comisionVendedor: '',
      porcentajeComision: '',
      estadoDocumentacion: 'PENDIENTE',
      documentosRequeridos: '',
      condicionesEspeciales: '',
      observaciones: '',
      // NUEVO: Campos de amortización
      aplicarIntereses: false,
      modeloAmortizacion: 'FRANCES' as 'FRANCES' | 'ALEMAN' | 'JAPONES',
      tasaInteresAnual: '',
      montoIntereses: '',
      montoCapital: '',
      saldoCapital: '',
      // Campos para selección de unidad
      manzanaId: '',
      vendedorId: '',
      // Campos para múltiples clientes
      clientes: [] as string[],
      // Campos para cuotas personalizadas
      cuotasPersonalizadas: false,
      cuotasPersonalizadasList: [] as Array<{monto: number, fecha: string, intereses?: number}>,
      // Campos para comprobantes
      comprobantesPago: [] as Array<{
        id: string
        tipo: 'INICIAL' | 'CUOTA' | 'CONTADO'
        monto: number
        fecha: string
        archivo: File | null
        nombreArchivo: string
        descripcion: string
      }>
    })
    setClientesSeleccionados([])
    setFormData(prev => ({
      ...prev,
      clientes: []
    }))
    setClienteTemporal('')
    setVendedorSeleccionado('')
    setManzanaPabellonSeleccionado('')
    setUnidadesDisponibles([])
    setSelectedUnidad(null)
    setModoCuotasPersonalizadas(false)
    
    setFormData(prev => ({ ...prev, comprobantesPago: [] }))
    setActiveTab('informacion')
    setComprobantesError('')
    setValidaciones({
      precioVenta: { valido: true, mensaje: '' },
      montoInicial: { valido: true, mensaje: '' },
      saldoPendiente: { valido: true, mensaje: '' },
      numeroCuotas: { valido: true, mensaje: '' },
      montoCuota: { valido: true, mensaje: '' },
      fechaPrimeraCuota: { valido: true, mensaje: '' },
      cuotas: { valido: true, mensaje: '' },
      tasaInteresAnual: { valido: true, mensaje: '' }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que no hay errores antes de enviar
    const hayErrores = Object.values(validaciones).some(v => !v.valido)
    if (hayErrores) {
      toast({
        title: 'Error de validación',
        description: 'Por favor, corrige los errores en el formulario antes de continuar',
        variant: 'destructive'
      })
      return
    }

    // Validar que se haya seleccionado al menos un cliente
    if (clientesSeleccionados.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un cliente en la pestaña "Clientes"',
        variant: 'destructive'
      })
      return
    }

    // Validar que se haya seleccionado una unidad
    if (!formData.unidadId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una unidad',
        variant: 'destructive'
      })
      return
    }

    // Validar comprobantes de pago usando la función específica
    const validacionComprobantes = validarComprobantesParaCrearVenta()
    
    if (!validacionComprobantes.valido) {
      toast({
        title: 'Error',
        description: validacionComprobantes.mensaje,
        variant: 'destructive'
      })
      return
    }

    // Validar configuración de cuotas si es venta en cuotas
    if (formData.tipoVenta === 'CUOTAS') {
      const montoInicial = parseFloat(formData.montoInicial) || 0
      const numeroCuotas = parseInt(formData.numeroCuotas) || 0
      
      if (numeroCuotas <= 0) {
        toast({
          title: 'Error',
          description: 'Debes configurar el número de cuotas en la pestaña "Cuotas"',
          variant: 'destructive'
        })
        return
      }
      
      // Para cuotas personalizadas, validar que haya al menos una cuota
      if (formData.cuotasPersonalizadas) {
        if (formData.cuotasPersonalizadasList.length === 0) {
          toast({
            title: 'Error',
            description: 'Debes agregar al menos una cuota personalizada en la pestaña "Cuotas"',
            variant: 'destructive'
          })
          return
        }
      } else {
        // Para cuotas regulares, validar fechaPrimeraCuota del formulario
        if (!formData.fechaPrimeraCuota) {
          toast({
            title: 'Error',
            description: 'Debes configurar la fecha de la primera cuota en la pestaña "Cuotas"',
            variant: 'destructive'
          })
          return
        }
      }
    }

    setLoading(true)

    try {
      // Crear FormData para enviar archivos
      const formDataToSend = new FormData()
      
      // Agregar datos de la venta
      console.log('🔍 Debug - formData.vendedorId:', formData.vendedorId)
      console.log('🔍 Debug - formData completo:', formData)
      
      // Extraer el número de operación del comprobante de pago inicial
      const comprobanteInicial = formData.comprobantesPago.find(comp => comp.tipo === 'INICIAL')
      const numeroOperacion = comprobanteInicial?.numeroOperacion || ''
      
      console.log('🔍 Debug - número de operación extraído:', numeroOperacion)
      
      const ventaData = {
        ...formData,
        clienteIds: clientesSeleccionados.map(c => c.id),
        vendedorId: formData.vendedorId,
        manzanaId: formData.manzanaId,
        unidadId: formData.unidadId,
        fechaVenta: formData.fechaVenta,
        fechaEntrega: formData.fechaEntrega,
        precioOriginal: parseFloat(formData.precioOriginal) || 0,
        precioVenta: parseFloat(formData.precioVenta) || 0,
        montoDescuento: parseFloat(formData.montoDescuento) || 0,
        motivoDescuento: formData.motivoDescuento,
        tipoVenta: formData.tipoVenta,
        formaPago: formData.formaPago,
        montoInicial: parseFloat(formData.montoInicial) || 0,
        numeroCuotas: parseInt(formData.numeroCuotas) || 0,
        frecuenciaCuota: formData.frecuenciaCuota,
        montoCuota: parseFloat(formData.montoCuota) || 0,
        fechaPrimeraCuota: formData.fechaPrimeraCuota,
        saldoPendiente: parseFloat(formData.saldoPendiente) || 0,
        comisionVendedor: parseFloat(formData.comisionVendedor) || 0,
        porcentajeComision: parseFloat(formData.porcentajeComision) || 0,
        estadoDocumentacion: formData.estadoDocumentacion,
        documentosRequeridos: formData.documentosRequeridos,
        condicionesEspeciales: formData.condicionesEspeciales,
        observaciones: formData.observaciones,
        aplicarIntereses: formData.aplicarIntereses,
        modeloAmortizacion: formData.modeloAmortizacion,
        tasaInteresAnual: parseFloat(formData.tasaInteresAnual) || 0,
        montoIntereses: parseFloat(formData.montoIntereses) || 0,
        montoCapital: parseFloat(formData.montoCapital) || 0,
        saldoCapital: parseFloat(formData.saldoCapital) || 0,
        cuotasPersonalizadas: formData.cuotasPersonalizadas,
        cuotasPersonalizadasList: formData.cuotasPersonalizadasList,
        cuotasGeneradas: cuotasGeneradas, // Incluir las cuotas generadas para guardar en la base de datos
        numeroOperacion: numeroOperacion, // Agregar el número de operación como campo directo
        comprobantesPago: formData.comprobantesPago.map(comp => ({
          tipo: comp.tipo,
          monto: comp.monto,
          fecha: comp.fecha,
          descripcion: comp.descripcion,
          nombreArchivo: comp.nombreArchivo,
          numeroOperacion: comp.numeroOperacion || ''
        }))
      }
      
      formDataToSend.append('ventaData', JSON.stringify(ventaData))
      
      // Agregar archivos de comprobantes
      formData.comprobantesPago.forEach((comprobante, index) => {
        if (comprobante.archivo) {
          formDataToSend.append(`comprobante_${index}`, comprobante.archivo)
          formDataToSend.append(`comprobante_${index}_data`, JSON.stringify({
            tipo: comprobante.tipo,
            monto: comprobante.monto,
            fecha: comprobante.fecha,
            descripcion: comprobante.descripcion,
            numeroOperacion: comprobante.numeroOperacion || ''
          }))
        }
      })



      const response = await fetch('/api/ventas', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Venta creada correctamente'
        })
        limpiarFormulario()
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la venta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear la venta',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const agregarCliente = () => {
    if (!formData.clienteId) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un cliente primero',
        variant: 'destructive'
      })
      return
    }
    
    if (formData.clientes.includes(formData.clienteId)) {
      toast({
        title: 'Cliente ya agregado',
        description: 'Este cliente ya está en la lista',
        variant: 'destructive'
      })
      return
    }
    
    // Buscar el cliente en la lista de clientes disponibles
    const clienteSeleccionado = clientes.find(c => c.id === formData.clienteId)
    if (!clienteSeleccionado) {
      toast({
        title: 'Error',
        description: 'Cliente no encontrado',
        variant: 'destructive'
      })
      return
    }
    
    // Agregar el cliente a ambos arrays
    setFormData(prev => ({
      ...prev,
      clientes: [...prev.clientes, formData.clienteId],
      clienteId: '' // Limpiar el selector después de agregar
    }))
    
    setClientesSeleccionados(prev => [...prev, clienteSeleccionado])
    
    // No mostrar toast de éxito - el feedback visual es suficiente
  }

  const removerCliente = (clienteId: string) => {
    setFormData(prev => ({
      ...prev,
      clientes: prev.clientes.filter(id => id !== clienteId)
    }))
    
    setClientesSeleccionados(prev => prev.filter(c => c.id !== clienteId))
    
    // No mostrar toast de confirmación - el feedback visual es suficiente
  }

  const agregarCuotaPersonalizada = () => {
    // Calcular una fecha apropiada para la nueva cuota
    const fechaVenta = new Date(formData.fechaVenta)
    const fechaPrimeraCuota = formData.fechaPrimeraCuota ? new Date(formData.fechaPrimeraCuota) : fechaVenta
    
    // Si no hay cuotas, usar la fecha de primera cuota o fecha de venta + 1 mes
    let fechaNuevaCuota = fechaVenta
    if (formData.cuotasPersonalizadasList.length === 0) {
      fechaNuevaCuota = fechaPrimeraCuota > fechaVenta ? fechaPrimeraCuota : new Date(fechaVenta.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else {
      // Si ya hay cuotas, usar la fecha de la última cuota + 1 mes
      const ultimaCuota = formData.cuotasPersonalizadasList[formData.cuotasPersonalizadasList.length - 1]
      const fechaUltimaCuota = new Date(ultimaCuota.fecha)
      fechaNuevaCuota = new Date(fechaUltimaCuota.getTime() + 30 * 24 * 60 * 60 * 1000)
    }
    
    // Asegurar que la fecha no sea anterior a la fecha de venta
    if (fechaNuevaCuota < fechaVenta) {
      fechaNuevaCuota = new Date(fechaVenta.getTime() + 30 * 24 * 60 * 60 * 1000)
    }
    
    const nuevaCuota = {
      monto: 0,
      fecha: fechaNuevaCuota.toISOString().split('T')[0],
      intereses: 0
    }
    
    setFormData(prev => ({
      ...prev,
      cuotasPersonalizadasList: [...prev.cuotasPersonalizadasList, nuevaCuota]
    }))
  }

  // Función para recalcular todos los intereses de las cuotas personalizadas
  const recalcularInteresesCuotasPersonalizadas = () => {
    setFormData(prev => {
      if (!prev.aplicarIntereses || !parseFloat(prev.tasaInteresAnual) || prev.cuotasPersonalizadasList.length === 0) {
        // Si no hay intereses, limpiar todos los intereses
        const nuevaLista = prev.cuotasPersonalizadasList.map(cuota => ({
          ...cuota,
          intereses: 0
        }))
        return { ...prev, cuotasPersonalizadasList: nuevaLista }
      }

      const tasaInteresAnual = parseFloat(prev.tasaInteresAnual)
      const fechaVenta = new Date(prev.fechaVenta)
      const tasaDiaria = tasaInteresAnual / 365 / 100

      console.log('🔍 Debug - Recalculando intereses:', {
        tasaInteresAnual,
        fechaVenta: fechaVenta.toISOString(),
        tasaDiaria
      })

      // Ordenar cuotas por fecha para calcular intereses correctamente
      const cuotasOrdenadas = [...prev.cuotasPersonalizadasList].sort((a, b) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      )
      
      let saldoPendiente = parseFloat(prev.saldoPendiente) || 0
      
      // Calcular intereses para cada cuota ordenada por fecha
      const cuotasConIntereses = cuotasOrdenadas.map((cuota, index) => {
        const fechaCuota = new Date(cuota.fecha)
        const montoCapital = typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0
        
        // Calcular días desde la fecha de venta hasta la fecha de la cuota
        const diasTranscurridos = Math.floor((fechaCuota.getTime() - fechaVenta.getTime()) / (1000 * 60 * 60 * 24))
        
        // Calcular intereses sobre el saldo pendiente al momento de la cuota
        const intereses = Math.max(0, saldoPendiente * tasaDiaria * diasTranscurridos)
        
        console.log(`🔍 Debug - Cuota ${index + 1}:`, {
          fechaCuota: fechaCuota.toISOString(),
          montoCapital,
          saldoPendiente,
          diasTranscurridos,
          interesesCalculados: intereses,
          interesesRedondeados: Math.round(intereses * 100) / 100
        })
        
        // Actualizar saldo para la siguiente cuota
        saldoPendiente = Math.max(0, saldoPendiente - montoCapital)
        
        return {
          ...cuota,
          intereses: Math.round(intereses * 100) / 100
        }
      })
      
      // Mantener el orden original de las cuotas pero con los intereses calculados
      const nuevaLista = prev.cuotasPersonalizadasList.map(cuotaOriginal => {
        const cuotaConIntereses = cuotasConIntereses.find(c => c.fecha === cuotaOriginal.fecha && c.monto === cuotaOriginal.monto)
        return cuotaConIntereses || cuotaOriginal
      })

      return { ...prev, cuotasPersonalizadasList: nuevaLista }
    })
  }

  const actualizarCuotaPersonalizada = (index: number, campo: 'monto' | 'fecha', valor: string | number) => {
    setFormData(prev => {
      const nuevaLista = [...prev.cuotasPersonalizadasList]
      
      // Validar y actualizar el campo
      nuevaLista[index] = { ...nuevaLista[index], [campo]: valor }
      
      // Calcular intereses automáticamente si están habilitados
      if (prev.aplicarIntereses && parseFloat(prev.tasaInteresAnual) > 0) {
        const tasaInteresAnual = parseFloat(prev.tasaInteresAnual)
        const fechaVenta = new Date(prev.fechaVenta)
        const fechaCuota = new Date(nuevaLista[index].fecha)
        const montoCapital = typeof nuevaLista[index].monto === 'string' ? parseFloat(nuevaLista[index].monto) : nuevaLista[index].monto || 0
        
        // Calcular días desde la fecha de venta hasta la fecha de la cuota
        const diasTranscurridos = Math.floor((fechaCuota.getTime() - fechaVenta.getTime()) / (1000 * 60 * 60 * 24))
        const tasaDiaria = tasaInteresAnual / 365 / 100
        const intereses = Math.max(0, montoCapital * tasaDiaria * diasTranscurridos)
        
        nuevaLista[index].intereses = Math.round(intereses * 100) / 100
      } else {
        // Si no hay intereses, limpiar los intereses de esta cuota
        nuevaLista[index].intereses = 0
      }
      
      return { ...prev, cuotasPersonalizadasList: nuevaLista }
    })
  }

  // Función para validar una cuota específica
  const validarCuota = (index: number) => {
    const cuota = formData.cuotasPersonalizadasList[index]
    const errores: { monto?: string; fecha?: string } = {}
    
    // Validar monto
    if (cuota.monto !== undefined) {
      const capitalTotal = parseFloat(formData.saldoPendiente) || 0
      const capitalOtros = formData.cuotasPersonalizadasList.reduce((total, cuotaOtro, i) => {
        if (i !== index) {
          return total + (typeof cuotaOtro.monto === 'string' ? parseFloat(cuotaOtro.monto) : cuotaOtro.monto || 0)
        }
        return total
      }, 0)
      
      const montoActual = typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0
      const totalConfigurado = capitalOtros + montoActual
      
      if (totalConfigurado > capitalTotal) {
        errores.monto = `Excede el límite. Máximo: ${formatCurrency(capitalTotal - capitalOtros)}`
      }
    }
    
    // Validar fecha
    if (cuota.fecha) {
      const fechaVenta = new Date(formData.fechaVenta)
      const fechaCuota = new Date(cuota.fecha)
      
      if (fechaCuota < fechaVenta) {
        errores.fecha = 'No puede ser anterior a la fecha de venta'
      }
    }
    
    return errores
  }

  const removerCuotaPersonalizada = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cuotasPersonalizadasList: prev.cuotasPersonalizadasList.filter((_, i) => i !== index)
    }))
  }

  // Funciones para manejar comprobantes de pago
  const agregarComprobantePago = (tipo: 'INICIAL' | 'CUOTA' | 'CONTADO', monto: number, fecha: string) => {
    const nuevoComprobante = {
      id: `comp-${Date.now()}-${Math.random()}`,
      tipo,
      monto,
      fecha,
      archivo: null,
      nombreArchivo: '',
      descripcion: '',
      numeroOperacion: ''
    }
    setFormData(prev => ({
      ...prev,
      comprobantesPago: [...prev.comprobantesPago, nuevoComprobante]
    }))
  }

  const actualizarComprobantePago = (id: string, campo: 'archivo' | 'nombreArchivo' | 'descripcion' | 'numeroOperacion', valor: any) => {
    setFormData(prev => ({
      ...prev,
      comprobantesPago: prev.comprobantesPago.map(comp => 
      comp.id === id ? { ...comp, [campo]: valor } : comp
      )
    }))
  }

  const removerComprobantePago = (id: string) => {
    setFormData(prev => ({
      ...prev,
      comprobantesPago: prev.comprobantesPago.filter(comp => comp.id !== id)
    }))
  }

  const handleFileUpload = (id: string, file: File) => {
    if (file) {
      // Validar tipo de archivo (PDF, JPG, PNG)
      const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!tiposPermitidos.includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Solo se permiten archivos PDF, JPG o PNG',
          variant: 'destructive'
        })
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'El archivo no puede ser mayor a 5MB',
          variant: 'destructive'
        })
        return
      }

      actualizarComprobantePago(id, 'archivo', file)
      actualizarComprobantePago(id, 'nombreArchivo', file.name)
    }
  }

  // Función para generar comprobantes automáticamente según el tipo de venta
  const generarComprobantesAutomaticos = () => {
    try {
      // Limpiar mensaje de error anterior
      setComprobantesError('')
      
      // Verificar si hay comprobantes existentes sin archivos adjuntos
      const comprobantesSinArchivo = formData.comprobantesPago.filter(comp => !comp.archivo)
      
      if (comprobantesSinArchivo.length > 0) {
        setComprobantesError(`Tienes ${comprobantesSinArchivo.length} comprobante(s) sin archivo adjunto. Completa estos primero antes de generar nuevos.`)
        return
      }
      const nuevosComprobantes: Array<{
        id: string
        tipo: 'INICIAL' | 'CUOTA' | 'CONTADO'
        monto: number
        fecha: string
        archivo: File | null
        nombreArchivo: string
        descripcion: string
        numeroOperacion: string
      }> = []

      const fechaActual = new Date()
      fechaActual.setHours(0, 0, 0, 0) // Normalizar a inicio del día

      if (formData.tipoVenta === 'CONTADO') {
        // Para venta al contado, generar un comprobante por el monto total
        const montoTotal = parseFloat(formData.precioVenta) || 0
        if (montoTotal > 0) {
          // Verificar si ya existe un comprobante de tipo CONTADO
          const yaExisteContado = formData.comprobantesPago.some(comp => comp.tipo === 'CONTADO')
          
          if (!yaExisteContado) {
          nuevosComprobantes.push({
            id: `comp-contado-${Date.now()}`,
            tipo: 'CONTADO',
            monto: montoTotal,
            fecha: formData.fechaVenta,
            archivo: null,
            nombreArchivo: '',
            descripcion: 'Pago al contado',
            numeroOperacion: ''
          })
          }
        } else {
          setComprobantesError('El precio de venta es cero, no se requieren comprobantes de pago')
          return
        }
      } else if (formData.tipoVenta === 'CUOTAS') {
        // Para venta en cuotas, generar comprobante por el monto inicial
        const montoInicial = parseFloat(formData.montoInicial) || 0
        if (montoInicial > 0) {
          // Verificar si ya existe un comprobante de tipo INICIAL
          const yaExisteInicial = formData.comprobantesPago.some(comp => comp.tipo === 'INICIAL')
          
          if (!yaExisteInicial) {
          nuevosComprobantes.push({
            id: `comp-inicial-${Date.now()}`,
            tipo: 'INICIAL',
            monto: montoInicial,
            fecha: formData.fechaVenta,
            archivo: null,
            nombreArchivo: '',
            descripcion: 'Pago inicial',
            numeroOperacion: ''
          })
          }
        }

        // Si hay cuotas personalizadas, generar comprobantes solo para cuotas vencidas o del día actual
        if (formData.cuotasPersonalizadas && formData.cuotasPersonalizadasList.length > 0) {
          let cuotasVencidas = 0
          formData.cuotasPersonalizadasList.forEach((cuota, index) => {
            const montoCuota = typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0
            if (montoCuota > 0) {
              const fechaCuota = new Date(cuota.fecha)
              fechaCuota.setHours(0, 0, 0, 0) // Normalizar a inicio del día
              
              // Solo generar comprobante si la cuota ya venció o es del día actual
              if (fechaCuota <= fechaActual) {
                // Verificar si ya existe un comprobante para esta cuota específica
                const yaExisteCuota = formData.comprobantesPago.some(comp => 
                  comp.tipo === 'CUOTA' && comp.descripcion === `Cuota ${index + 1}`
                )
                
                if (!yaExisteCuota) {
                nuevosComprobantes.push({
                  id: `comp-cuota-${index}-${Date.now()}`,
                  tipo: 'CUOTA',
                  monto: montoCuota,
                  fecha: cuota.fecha,
                  archivo: null,
                  nombreArchivo: '',
                  descripcion: `Cuota ${index + 1}`,
                  numeroOperacion: ''
                })
                cuotasVencidas++
                }
              }
            }
          })
          
          // Mostrar información sobre cuotas vencidas
          if (cuotasVencidas > 0) {
            console.log(`Se generaron comprobantes para ${cuotasVencidas} cuota(s) vencida(s)`)
          }
        } else if (!formData.cuotasPersonalizadas && cuotasGeneradas.length > 0) {
          // Si son cuotas regulares, generar comprobantes solo para cuotas vencidas
          let cuotasVencidas = 0
          cuotasGeneradas.forEach((cuota, index) => {
            if (cuota.montoCapital > 0) {
              const fechaCuota = new Date(cuota.fechaVencimiento)
              fechaCuota.setHours(0, 0, 0, 0) // Normalizar a inicio del día
              
              // Solo generar comprobante si la cuota ya venció o es del día actual
              if (fechaCuota <= fechaActual) {
                // Verificar si ya existe un comprobante para esta cuota específica
                const yaExisteCuota = formData.comprobantesPago.some(comp => 
                  comp.tipo === 'CUOTA' && comp.descripcion === `Cuota ${index + 1}`
                )
                
                if (!yaExisteCuota) {
                nuevosComprobantes.push({
                  id: `comp-cuota-${index}-${Date.now()}`,
                  tipo: 'CUOTA',
                  monto: cuota.montoCapital,
                  fecha: cuota.fechaVencimiento.toISOString().split('T')[0],
                  archivo: null,
                  nombreArchivo: '',
                  descripcion: `Cuota ${index + 1}`,
                  numeroOperacion: ''
                })
                cuotasVencidas++
                }
              }
            }
          })
          
          // Mostrar información sobre cuotas vencidas
          if (cuotasVencidas > 0) {
            console.log(`Se generaron comprobantes para ${cuotasVencidas} cuota(s) vencida(s)`)
          }
        }

        // Si no hay comprobantes para generar, mostrar mensaje
        if (nuevosComprobantes.length === 0) {
          setComprobantesError('No hay pagos iniciales ni cuotas configuradas que requieran comprobantes')
          return
        }
      }

             // Verificar si ya existen comprobantes para evitar duplicados
       const comprobantesExistentes = formData.comprobantesPago
       const comprobantesNuevos = nuevosComprobantes.filter(nuevo => {
         // Para comprobantes de cuotas, verificar que no exista uno con el mismo tipo y descripción
         if (nuevo.tipo === 'CUOTA') {
           return !comprobantesExistentes.some(existente => 
             existente.tipo === 'CUOTA' && existente.descripcion === nuevo.descripcion
           )
         }
         // Para otros tipos, verificar que no exista uno del mismo tipo
         return !comprobantesExistentes.some(existente => existente.tipo === nuevo.tipo)
       })
       
       if (comprobantesNuevos.length === 0) {
         setComprobantesError('Ya existen todos los comprobantes necesarios. Completa los archivos adjuntos antes de crear la venta.')
         return
       }
       
       // Agregar solo los comprobantes nuevos
       // Actualizar el estado inmediatamente
       const nuevoEstadoComprobantes = [...formData.comprobantesPago, ...comprobantesNuevos]
       
       setFormData(prev => ({
         ...prev,
         comprobantesPago: nuevoEstadoComprobantes
       }))
      
             if (comprobantesNuevos.length > 0) {
         // No mostrar toast de éxito - el feedback visual es suficiente
         console.log(`Se generaron ${comprobantesNuevos.length} comprobante(s) para pagos vencidos o del día actual`)
       } else {
         // No mostrar toast informativo - el feedback visual es suficiente
         console.log('Ya existen comprobantes para todos los pagos vencidos o del día actual')
       }
    } catch (error) {
      console.error('Error al generar comprobantes automáticos:', error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al generar los comprobantes automáticos',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  // Función para calcular las fechas de las cuotas regulares
  const calcularFechasCuotasRegulares = () => {
    if (!formData.fechaPrimeraCuota || !formData.numeroCuotas || !formData.frecuenciaCuota) {
      return []
    }

    const fechaInicial = new Date(formData.fechaPrimeraCuota)
    const numeroCuotas = parseInt(formData.numeroCuotas) || 0
    const fechas = []

    for (let i = 0; i < numeroCuotas; i++) {
      const fecha = new Date(fechaInicial)
      
      switch (formData.frecuenciaCuota) {
        case 'MENSUAL':
          fecha.setMonth(fecha.getMonth() + i)
          break
        case 'BIMESTRAL':
          fecha.setMonth(fecha.getMonth() + (i * 2))
          break
        case 'TRIMESTRAL':
          fecha.setMonth(fecha.getMonth() + (i * 3))
          break
        case 'SEMESTRAL':
          fecha.setMonth(fecha.getMonth() + (i * 6))
          break
        case 'ANUAL':
          fecha.setFullYear(fecha.getFullYear() + i)
          break
        case 'QUINCENAL':
          fecha.setDate(fecha.getDate() + (i * 15))
          break
        case 'SEMANAL':
          fecha.setDate(fecha.getDate() + (i * 7))
          break
        default:
          fecha.setMonth(fecha.getMonth() + i)
      }
      
      fechas.push(fecha.toISOString().split('T')[0])
    }

    return fechas
  }

  // Función para calcular los montos de las cuotas regulares
  const calcularMontosCuotasRegulares = () => {
    const saldoFinanciar = parseFloat(formData.saldoPendiente) || 0
    const numeroCuotas = parseInt(formData.numeroCuotas) || 1
    
    // Si hay intereses aplicados, usar amortización
    if (formData.aplicarIntereses && parseFloat(formData.tasaInteresAnual) > 0) {
      const tasaInteresAnual = parseFloat(formData.tasaInteresAnual)
      
      // Calcular la tasa de interés según la frecuencia
      let tasaInteresPorPeriodo = 0
      let periodosPorAno = 12 // Por defecto mensual
      
      switch (formData.frecuenciaCuota) {
        case 'MENSUAL':
          periodosPorAno = 12
          break
        case 'BIMESTRAL':
          periodosPorAno = 6
          break
        case 'TRIMESTRAL':
          periodosPorAno = 4
          break
        case 'SEMESTRAL':
          periodosPorAno = 2
          break
        case 'ANUAL':
          periodosPorAno = 1
          break
        case 'QUINCENAL':
          periodosPorAno = 24
          break
        case 'SEMANAL':
          periodosPorAno = 52
          break
        default:
          periodosPorAno = 12
      }
      
      tasaInteresPorPeriodo = tasaInteresAnual / periodosPorAno / 100
      
      // Fórmula de amortización francesa
      const cuotaPeriodo = saldoFinanciar * (tasaInteresPorPeriodo * Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas)) / (Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas) - 1)
      
      const montos = []
      let saldoRestante = saldoFinanciar
      
      for (let i = 0; i < numeroCuotas; i++) {
        const interes = saldoRestante * tasaInteresPorPeriodo
        const capital = cuotaPeriodo - interes
        saldoRestante -= capital
        
        // Para la última cuota, ajustar para que no quede saldo residual
        if (i === numeroCuotas - 1) {
          montos.push(Math.round((cuotaPeriodo + saldoRestante) * 100) / 100)
        } else {
          montos.push(Math.round(cuotaPeriodo * 100) / 100)
        }
      }
      
      return montos
    } else {
      // Cálculo sin intereses (método anterior)
      const montoCuotaDecimal = saldoFinanciar / numeroCuotas
      const cuotaEntera = Math.floor(montoCuotaDecimal)
      const diferencia = saldoFinanciar - (cuotaEntera * numeroCuotas)
      
      const montos = []
      
      for (let i = 0; i < numeroCuotas; i++) {
        if (i === numeroCuotas - 1 && diferencia > 0) {
          // Última cuota con el resto
          montos.push(cuotaEntera + diferencia)
        } else {
          montos.push(cuotaEntera)
        }
      }
      
      return montos
    }
  }

  // Función para calcular intereses en cuotas personalizadas
  const calcularInteresesCuotasPersonalizadas = () => {
    if (!formData.aplicarIntereses || !parseFloat(formData.tasaInteresAnual) || formData.cuotasPersonalizadasList.length === 0) {
      return formData.cuotasPersonalizadasList
    }

    const tasaInteresAnual = parseFloat(formData.tasaInteresAnual)
    const saldoPendiente = parseFloat(formData.saldoPendiente) || 0
    
    // Calcular la tasa de interés por día
    const tasaInteresDiaria = tasaInteresAnual / 365 / 100
    
    const cuotasConIntereses = []
    let saldoRestante = saldoPendiente
    
    // Ordenar cuotas por fecha para calcular intereses cronológicamente
    const cuotasOrdenadas = [...formData.cuotasPersonalizadasList].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )
    
    // Usar la fecha actual como fecha inicial (más realista para el cálculo de intereses)
    const fechaInicial = new Date()
    
    for (let i = 0; i < cuotasOrdenadas.length; i++) {
      const cuota = cuotasOrdenadas[i]
      const fechaCuota = new Date(cuota.fecha)
      
      // Validar que la fecha sea válida
      if (isNaN(fechaCuota.getTime())) {
        console.error(`Fecha inválida en cuota ${i + 1}:`, cuota.fecha)
        continue
      }
      
      // Calcular días desde la fecha actual hasta esta cuota
      const diasTranscurridos = Math.floor((fechaCuota.getTime() - fechaInicial.getTime()) / (1000 * 60 * 60 * 24))
      
      // Validar que los días no sean negativos (fecha en el pasado)
      if (diasTranscurridos < 0) {
        console.warn(`Cuota ${i + 1} tiene fecha en el pasado:`, cuota.fecha)
      }
      
      // Calcular intereses sobre el saldo restante (NO sobre el monto de la cuota)
      const intereses = Math.max(0, saldoRestante * tasaInteresDiaria * diasTranscurridos)
      
      // El monto con intereses es el monto original más los intereses
      const montoConIntereses = Math.max(0, cuota.monto + intereses)
      
      cuotasConIntereses.push({
        ...cuota,
        monto: Math.round(montoConIntereses * 100) / 100,
        intereses: Math.round(intereses * 100) / 100
      })
      
      // Actualizar saldo restante (restando el monto original, no el monto con intereses)
      saldoRestante -= cuota.monto
    }
    
    return cuotasConIntereses
  }

  // Actualizar precio de venta cuando cambie el descuento
  useEffect(() => {
    if (formData.precioOriginal && formData.montoDescuento) {
      const precioOriginal = parseFloat(formData.precioOriginal) || 0
      const descuento = parseFloat(formData.montoDescuento) || 0
      const precioVenta = Math.max(0, precioOriginal - descuento)
      
      setFormData(prev => ({
        ...prev,
        precioVenta: precioVenta.toFixed(2)
      }))
    }
  }, [formData.precioOriginal, formData.montoDescuento])

  // Calcular precio de venta basado en precio original y descuento

  // Función para generar cuotas regulares automáticamente usando modelos de amortización
  const generarCuotasRegulares = () => {
    if (!formData.numeroCuotas || !formData.frecuenciaCuota || !formData.fechaPrimeraCuota || !formData.saldoPendiente) {
      return
    }

    const numeroCuotas = parseInt(formData.numeroCuotas)
    const saldoPendiente = parseFloat(formData.saldoPendiente)
    const fechaPrimeraCuota = new Date(formData.fechaPrimeraCuota)
    const aplicarIntereses = formData.aplicarIntereses
    const tasaInteresAnual = parseFloat(formData.tasaInteresAnual) || 0
    const modeloAmortizacion = formData.modeloAmortizacion

    // Calcular tasa de interés por período según frecuencia
    let tasaInteresPorPeriodo = 0
    if (aplicarIntereses && tasaInteresAnual > 0) {
      switch (formData.frecuenciaCuota) {
        case 'MENSUAL':
          tasaInteresPorPeriodo = tasaInteresAnual / 12 / 100
          break
        case 'BIMESTRAL':
          tasaInteresPorPeriodo = tasaInteresAnual / 6 / 100
          break
        case 'TRIMESTRAL':
          tasaInteresPorPeriodo = tasaInteresAnual / 4 / 100
          break
        case 'SEMESTRAL':
          tasaInteresPorPeriodo = tasaInteresAnual / 2 / 100
          break
        case 'ANUAL':
          tasaInteresPorPeriodo = tasaInteresAnual / 100
          break
      }
    }

    const cuotas: Array<{
      numeroCuota: number
      fechaVencimiento: Date
      monto: number
      montoCapital: number
      montoInteres: number
      saldoCapitalAnterior: number
      saldoCapitalPosterior: number
      estado: string
      montoPagado: number
    }> = []

    let saldoAnterior = saldoPendiente

    // Calcular cuotas según el modelo de amortización
    if (aplicarIntereses && tasaInteresAnual > 0) {
      // Modelos con intereses
      switch (modeloAmortizacion) {
        case 'FRANCES':
          // Modelo Francés: Cuota fija
          const cuotaFija = saldoPendiente * (tasaInteresPorPeriodo * Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas)) / (Math.pow(1 + tasaInteresPorPeriodo, numeroCuotas) - 1)

    for (let i = 1; i <= numeroCuotas; i++) {
      let fechaVencimiento = new Date(fechaPrimeraCuota)
      
      switch (formData.frecuenciaCuota) {
        case 'MENSUAL':
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i - 1))
          break
        case 'BIMESTRAL':
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 2))
          break
        case 'TRIMESTRAL':
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 3))
          break
        case 'SEMESTRAL':
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 6))
          break
        case 'ANUAL':
          fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + (i - 1))
          break
      }

            const montoInteres = saldoAnterior * tasaInteresPorPeriodo
            const montoCapital = cuotaFija - montoInteres
            const saldoPosterior = saldoAnterior - montoCapital

            cuotas.push({
              numeroCuota: i,
              fechaVencimiento,
              monto: cuotaFija,
              montoCapital,
              montoInteres,
              saldoCapitalAnterior: saldoAnterior,
              saldoCapitalPosterior: saldoPosterior,
              estado: 'PENDIENTE',
              montoPagado: 0
            })

            saldoAnterior = saldoPosterior
          }
          break

        case 'ALEMAN':
          // Modelo Alemán: Capital fijo
          const capitalFijo = saldoPendiente / numeroCuotas
          
          for (let i = 1; i <= numeroCuotas; i++) {
            let fechaVencimiento = new Date(fechaPrimeraCuota)
            
            switch (formData.frecuenciaCuota) {
              case 'MENSUAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i - 1))
                break
              case 'BIMESTRAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 2))
                break
              case 'TRIMESTRAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 3))
                break
              case 'SEMESTRAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 6))
                break
              case 'ANUAL':
                fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + (i - 1))
                break
            }

            const montoInteres = saldoAnterior * tasaInteresPorPeriodo
            const montoTotal = capitalFijo + montoInteres
            const saldoPosterior = saldoAnterior - capitalFijo

      cuotas.push({
        numeroCuota: i,
        fechaVencimiento,
        monto: montoTotal,
              montoCapital: capitalFijo,
        montoInteres,
        saldoCapitalAnterior: saldoAnterior,
        saldoCapitalPosterior: saldoPosterior,
        estado: 'PENDIENTE',
        montoPagado: 0
      })

      saldoAnterior = saldoPosterior
          }
          break

        case 'JAPONES':
          // Modelo Japonés: Interés fijo sobre saldo inicial
          const interesFijo = saldoPendiente * tasaInteresPorPeriodo
          const capitalFijoJapones = saldoPendiente / numeroCuotas
          
          for (let i = 1; i <= numeroCuotas; i++) {
            let fechaVencimiento = new Date(fechaPrimeraCuota)
            
            switch (formData.frecuenciaCuota) {
              case 'MENSUAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i - 1))
                break
              case 'BIMESTRAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 2))
                break
              case 'TRIMESTRAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 3))
                break
              case 'SEMESTRAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 6))
                break
              case 'ANUAL':
                fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + (i - 1))
                break
            }

            const montoTotal = capitalFijoJapones + interesFijo
            const saldoPosterior = saldoAnterior - capitalFijoJapones

            cuotas.push({
              numeroCuota: i,
              fechaVencimiento,
              monto: montoTotal,
              montoCapital: capitalFijoJapones,
              montoInteres: interesFijo,
              saldoCapitalAnterior: saldoAnterior,
              saldoCapitalPosterior: saldoPosterior,
              estado: 'PENDIENTE',
              montoPagado: 0
            })

            saldoAnterior = saldoPosterior
          }
          break
      }
    } else {
      // Sin intereses: distribución simple del capital
      const montoCuotaBase = saldoPendiente / numeroCuotas
      
      for (let i = 1; i <= numeroCuotas; i++) {
        let fechaVencimiento = new Date(fechaPrimeraCuota)
        
        switch (formData.frecuenciaCuota) {
          case 'MENSUAL':
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i - 1))
            break
          case 'BIMESTRAL':
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 2))
            break
          case 'TRIMESTRAL':
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 3))
            break
          case 'SEMESTRAL':
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + ((i - 1) * 6))
            break
          case 'ANUAL':
            fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + (i - 1))
            break
        }

        const saldoPosterior = saldoAnterior - montoCuotaBase

        cuotas.push({
          numeroCuota: i,
          fechaVencimiento,
          monto: montoCuotaBase,
          montoCapital: montoCuotaBase,
          montoInteres: 0,
          saldoCapitalAnterior: saldoAnterior,
          saldoCapitalPosterior: saldoPosterior,
          estado: 'PENDIENTE',
          montoPagado: 0
        })

        saldoAnterior = saldoPosterior
      }
    }

    setCuotasGeneradas(cuotas)
    
    // Actualizar monto de cuota en el formulario
    if (cuotas.length > 0) {
      setFormData(prev => ({
        ...prev,
        montoCuota: cuotas[0].monto.toFixed(2)
      }))
    }
  }

  // Función para generar cuotas personalizadas con intereses
  const generarCuotasPersonalizadasConIntereses = () => {
    if (!formData.cuotasPersonalizadasList.length || !formData.aplicarIntereses) {
      return
    }

    const tasaInteresAnual = parseFloat(formData.tasaInteresAnual) || 0
    const fechaReferencia = new Date(formData.fechaPrimeraCuota || new Date())

    const cuotas = formData.cuotasPersonalizadasList.map((cuota, index) => {
      const fechaVencimiento = new Date(cuota.fecha)
      const montoCapital = cuota.monto

      // Calcular intereses si están habilitados
      let montoInteres = 0
      if (tasaInteresAnual > 0) {
        const diasEntreCuotas = (fechaVencimiento.getTime() - fechaReferencia.getTime()) / (1000 * 60 * 60 * 24)
        const tasaDiaria = tasaInteresAnual / 365 / 100
        montoInteres = montoCapital * tasaDiaria * Math.max(0, diasEntreCuotas)
      }

      const montoTotal = montoCapital + montoInteres

      return {
        numeroCuota: index + 1,
        fechaVencimiento,
        monto: montoTotal,
        montoCapital,
        montoInteres,
        saldoCapitalAnterior: 0, // Para cuotas personalizadas no calculamos saldo anterior
        saldoCapitalPosterior: 0, // Para cuotas personalizadas no calculamos saldo posterior
        estado: 'PENDIENTE',
        montoPagado: 0
      }
    })

    setCuotasGeneradas(cuotas)
  }

  // Efecto para recalcular intereses de cuotas personalizadas cuando cambian los parámetros de intereses
  useEffect(() => {
    if (formData.cuotasPersonalizadas && formData.cuotasPersonalizadasList.length > 0) {
      recalcularInteresesCuotasPersonalizadas()
    }
  }, [formData.aplicarIntereses, formData.tasaInteresAnual, formData.fechaVenta])



  // Efecto para generar cuotas automáticamente cuando cambian los parámetros
  useEffect(() => {
    if (formData.tipoVenta === 'CUOTAS') {
      if (formData.cuotasPersonalizadas) {
        // Generar cuotas personalizadas para la tabla
        if (formData.cuotasPersonalizadasList.length > 0) {
          // Ordenar cuotas por fecha para calcular saldos correctamente
          const cuotasOrdenadas = [...formData.cuotasPersonalizadasList].sort((a, b) => 
            new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          )
          
          let saldoAnterior = parseFloat(formData.saldoPendiente) || 0
          
          const cuotas = cuotasOrdenadas.map((cuota, index) => {
            const fechaVencimiento = new Date(cuota.fecha)
            const montoCapital = typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0
            const montoInteres = cuota.intereses || 0
            const montoTotal = montoCapital + montoInteres
            
            const saldoPosterior = saldoAnterior - montoCapital
            const saldoActual = saldoAnterior
            
            // Actualizar saldo para la siguiente cuota
            saldoAnterior = saldoPosterior

            return {
              numeroCuota: index + 1,
              fechaVencimiento,
              monto: montoTotal,
              montoCapital,
              montoInteres,
              saldoCapitalAnterior: saldoActual,
              saldoCapitalPosterior: Math.max(0, saldoPosterior),
              estado: 'PENDIENTE',
              montoPagado: 0
            }
          })
          setCuotasGeneradas(cuotas)
        } else {
          setCuotasGeneradas([])
        }
      } else {
        // Generar cuotas regulares
        generarCuotasRegulares()
      }
    }
  }, [
    formData.numeroCuotas,
    formData.frecuenciaCuota,
    formData.fechaPrimeraCuota,
    formData.fechaVenta,
    formData.saldoPendiente,
    formData.aplicarIntereses,
    formData.tasaInteresAnual,
    formData.modeloAmortizacion,
    formData.cuotasPersonalizadas,
    formData.cuotasPersonalizadasList
  ])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col p-0 bg-gray-50">
          {/* Header compacto y elegante */}
          <div className="sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                      Nueva Venta - {tipoVenta === 'LOTE' ? 'Lote' : 'Unidad de Cementerio'}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Complete el formulario paso a paso para registrar la venta
                    </p>
                  </div>
                </div>
                
                {/* Indicador de progreso compacto */}
                {(() => {
                  const progress = getFormProgress()
                  return (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {progress.porcentaje}% Completado
                        </div>
                        <div className="text-xs text-gray-500">
                          {progress.camposCompletados} de {progress.totalCampos} campos
                        </div>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            progress.porcentaje === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                          }`}
                          style={{ width: `${progress.porcentaje}%` }}
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Contenido principal con layout de dos columnas */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar con pestañas verticales */}
            <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Pasos del Formulario
                </h3>
              </div>
              
              <nav className="px-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" orientation="vertical">
                  <TabsList className="flex flex-col w-full h-auto bg-transparent border-0 p-0 space-y-1">
                    <TabsTrigger 
                      value="informacion" 
                      className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-blue-50 hover:text-blue-700 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:border-l-4 data-[state=active]:border-l-blue-600 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Información</div>
                          <div className="text-xs text-gray-500">Unidad y detalles</div>
                        </div>
                      </div>
                    </TabsTrigger>



                    <TabsTrigger 
                      value="financiero" 
                      className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-orange-50 hover:text-orange-700 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 data-[state=active]:border-l-4 data-[state=active]:border-l-orange-600 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Calculator className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Financiero</div>
                          <div className="text-xs text-gray-500">Precios y pagos</div>
                        </div>
                      </div>
                    </TabsTrigger>

                    {formData.tipoVenta === 'CUOTAS' && (
                      <TabsTrigger 
                        value="cuotas" 
                        className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-green-50 hover:text-green-700 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:border-l-4 data-[state=active]:border-l-green-600 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Cuotas</div>
                            <div className="text-xs text-gray-500">Plan de pagos</div>
                          </div>
                        </div>
                      </TabsTrigger>
                    )}

                    <TabsTrigger 
                      value="comprobantes" 
                      className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-emerald-50 hover:text-emerald-700 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 data-[state=active]:border-l-4 data-[state=active]:border-l-emerald-600 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Comprobantes</div>
                          <div className="text-xs text-gray-500">Pagos realizados</div>
                        </div>
                      </div>
                    </TabsTrigger>

                    <TabsTrigger 
                      value="documentacion" 
                      className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-indigo-50 hover:text-indigo-700 data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 data-[state=active]:border-l-4 data-[state=active]:border-l-indigo-600 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Documentación</div>
                          <div className="text-xs text-gray-500">Contratos y archivos</div>
                        </div>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </nav>
            </div>

            {/* Contenido principal con scroll */}
            <div className="flex-1 overflow-y-auto bg-gray-50 min-h-[70vh]">
              <div className="p-4 pb-32">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Tab: Información General */}
                    <TabsContent value="informacion" className="space-y-4 mt-0 min-h-[60vh]">
                        <div className="space-y-6">
                        {/* Fila 1: Selección de unidad e información de venta */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Columna 1: Selección de unidad */}
                          <div className="space-y-4">
                          <Card className="border-0 shadow-sm bg-white">
                            <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                                Selección de Unidad
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {/* Seleccionar Manzana */}
                              <div className="space-y-3">
                                      <Label className="text-sm font-medium text-gray-700">
                                        Seleccionar Manzana
                                      </Label>
                                      <Select 
                                        value={manzanaPabellonSeleccionado} 
                                        onValueChange={(value) => {
                                          setManzanaPabellonSeleccionado(value)
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      manzanaId: value,
                                      unidadId: '' // Resetear unidad cuando cambia manzana
                                    }))
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Selecciona la manzana" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {manzanasPabellones.map((mp) => (
                                            <SelectItem key={mp.id} value={mp.id}>
                                              {mp.nombre}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                              {/* Seleccionar Unidad */}
                              <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">
                                  Seleccionar Unidad
                                </Label>
                                <Select 
                                  value={formData.unidadId} 
                                  onValueChange={(value) => {
                                  // Encontrar la unidad seleccionada
                                  const unidadSeleccionada = unidadesDisponibles.find(u => u.id === value) || 
                                                           unidades.find(u => u.id === value)
                                  
                                  if (unidadSeleccionada) {
                                    // Establecer la unidad seleccionada
                                    setSelectedUnidad(unidadSeleccionada)
                                    
                                    // Establecer el precio original y calcular el precio de venta
                                    const precioOriginal = unidadSeleccionada.precio
                                    const descuento = parseFloat(formData.montoDescuento) || 0
                                    const precioVenta = Math.max(0, precioOriginal - descuento)
                                    
                                    setFormData({
                                      ...formData,
                                      unidadId: value,
                                      precioOriginal: precioOriginal.toString(),
                                      precioVenta: precioVenta.toFixed(2)
                                    })
                                  } else {
                                    setFormData({...formData, unidadId: value})
                                  }
                                  }}
                                  disabled={!manzanaPabellonSeleccionado}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder={
                                      !manzanaPabellonSeleccionado 
                                        ? "Primero selecciona una manzana" 
                                        : "Selecciona la unidad"
                                    } />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Filtrar unidades por la manzana seleccionada */}
                                    {(() => {
                                      if (!manzanaPabellonSeleccionado) return []
                                      
                                      const manzanaSeleccionada = manzanasPabellones.find(mp => mp.id === manzanaPabellonSeleccionado)
                                      if (!manzanaSeleccionada) return []
                                      
                                       // Usar unidadesDisponibles si están disponibles, sino usar las unidades de la manzana
                                       const unidadesAMostrar = unidadesDisponibles.length > 0 
                                         ? unidadesDisponibles.filter(u => {
                                           // Filtrar por nombre de manzana o pabellón
                                           const manzanaNombre = u.manzana?.nombre
                                           const pabellonNombre = u.pabellon?.nombre
                                           const manzanaSeleccionadaNombre = manzanasPabellones.find(mp => mp.id === manzanaPabellonSeleccionado)?.nombre
                                           
                                           return manzanaNombre === manzanaSeleccionadaNombre || pabellonNombre === manzanaSeleccionadaNombre
                                         })
                                         : manzanaSeleccionada.unidades || []
                                      
                                      return unidadesAMostrar.map((unidad) => (
                                      <SelectItem key={unidad.id} value={unidad.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{unidad.codigo}</span>
                                          <span className="text-gray-500 ml-4">
                                            {formatCurrency(unidad.precio)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                      ))
                                    })()}
                                  </SelectContent>
                                </Select>
                                {!manzanaPabellonSeleccionado && (
                                  <p className="text-xs text-gray-500">
                                    Primero debes seleccionar una manzana para ver las unidades disponibles
                                  </p>
                                )}
                              </div>


                            </CardContent>
                          </Card>
                        </div>

                          {/* Columna 2: Información de venta */}
                          <div className="space-y-4">
                          <Card className="border-0 shadow-sm bg-white">
                              <CardHeader className="pb-3">
                              <CardTitle className="flex items-center gap-2 text-lg">
                                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">2</div>
                                Información de Venta
                              </CardTitle>
                            </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Fecha de Venta *
                                  </Label>
                                  <Input
                                    type="date"
                                    value={formData.fechaVenta}
                                    onChange={(e) => setFormData({...formData, fechaVenta: e.target.value})}
                                    className="w-full"
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Fecha de Entrega
                                  </Label>
                                  <Input
                                    type="date"
                                    value={formData.fechaEntrega}
                                    onChange={(e) => setFormData({...formData, fechaEntrega: e.target.value})}
                                    className="w-full"
                                  />
                                </div>
                              </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Agente de Ventas
                                  </Label>
                                  <Select value={formData.vendedorId} onValueChange={(value) => setFormData({...formData, vendedorId: value})}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Selecciona el agente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {vendedores.map((vendedor) => (
                                        <SelectItem key={vendedor.id} value={vendedor.id}>
                                          {vendedor.nombre} {vendedor.apellido}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                        {/* Fila 2: Gestión de Clientes - Ancho completo */}
                        <div className="col-span-1 lg:col-span-2">
                      <Card className="border-0 shadow-sm bg-white">
                            <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                            Gestión de Clientes
                          </CardTitle>
                        </CardHeader>
                            <CardContent className="space-y-4">
                          {/* Lista de clientes agregados */}
                          {formData.clientes.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-gray-700">Clientes Agregados</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {formData.clientes.map((clienteId) => {
                                  const cliente = clientes.find(c => c.id === clienteId)
                                  return cliente ? (
                                    <div key={clienteId} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                          <User className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {cliente.nombre} {cliente.apellido}
                                          </div>
                                          <div className="text-sm text-gray-600">{cliente.email}</div>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removerCliente(clienteId)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : null
                                })}
                              </div>
                            </div>
                          )}

                          {/* Agregar nuevo cliente */}
                              <div className="border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Cliente</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Select value={formData.clienteId} onValueChange={(value) => setFormData({...formData, clienteId: value})}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un cliente existente" />
                                </SelectTrigger>
                                <SelectContent>
                                  {clientes.map((cliente) => (
                                    <SelectItem key={cliente.id} value={cliente.id}>
                                      {cliente.nombre} {cliente.apellido} - {cliente.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                onClick={agregarCliente}
                                disabled={!formData.clienteId}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Cliente
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab: Financiero */}
                    <TabsContent value="financiero" className="space-y-4 mt-0 min-h-[60vh]">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Configuración de precios */}
                        <Card className="border-0 shadow-sm bg-white">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">4</div>
                              Configuración de Precios
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Precio Original
                              </Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.precioOriginal}
                                readOnly
                                className="w-full bg-gray-50 cursor-not-allowed"
                              />
                              <p className="text-xs text-gray-500">Precio fijo de la unidad seleccionada</p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Descuento
                              </Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.montoDescuento}
                                onChange={(e) => {
                                  const descuento = parseFloat(e.target.value) || 0
                                  const precioOriginal = parseFloat(formData.precioOriginal) || 0
                                  const precioVenta = Math.max(0, precioOriginal - descuento)
                                  
                                  setFormData({
                                    ...formData,
                                    montoDescuento: e.target.value,
                                    precioVenta: precioVenta.toFixed(2)
                                  })
                                }}
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500">Monto del descuento a aplicar</p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Motivo del Descuento
                              </Label>
                              <Input
                                type="text"
                                placeholder="Ej: Cliente frecuente, Promoción especial, etc."
                                value={formData.motivoDescuento}
                                onChange={(e) => setFormData({...formData, motivoDescuento: e.target.value})}
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500">Razón por la cual se aplica el descuento</p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Precio de Venta
                              </Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.precioVenta}
                                readOnly
                                className="w-full bg-gray-50 cursor-not-allowed"
                              />
                              <p className="text-xs text-gray-500">Precio final después del descuento</p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Configuración de pagos */}
                        <Card className="border-0 shadow-sm bg-white">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">5</div>
                              Configuración de Pagos
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Tipo de Venta
                              </Label>
                              <Select value={formData.tipoVenta} onValueChange={(value) => setFormData({...formData, tipoVenta: value})}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CONTADO">Contado</SelectItem>
                                  <SelectItem value="CUOTAS">Cuotas</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Forma de Pago
                              </Label>
                              <Select value={formData.formaPago} onValueChange={(value) => setFormData({...formData, formaPago: value})}>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                  <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                                  <SelectItem value="TARJETA">Tarjeta</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Comisión del Vendedor
                              </Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.comisionVendedor}
                                onChange={(e) => {
                                  const montoComision = parseFloat(e.target.value) || 0
                                  const precioVenta = parseFloat(formData.precioVenta) || 0
                                  const porcentaje = precioVenta > 0 ? ((montoComision / precioVenta) * 100) : 0
                                  
                                  setFormData({
                                    ...formData, 
                                    comisionVendedor: e.target.value,
                                    porcentajeComision: porcentaje.toFixed(2)
                                  })
                                }}
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500">Monto de comisión para el vendedor</p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Porcentaje de Comisión (%)
                              </Label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.porcentajeComision}
                                onChange={(e) => {
                                  const porcentaje = parseFloat(e.target.value) || 0
                                  const precioVenta = parseFloat(formData.precioVenta) || 0
                                  const montoComision = (precioVenta * porcentaje) / 100
                                  
                                  setFormData({
                                    ...formData, 
                                    porcentajeComision: e.target.value,
                                    comisionVendedor: montoComision.toFixed(2)
                                  })
                                }}
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500">Porcentaje de comisión sobre el precio de venta</p>
                            </div>

                          </CardContent>
                        </Card>

                        {/* Resumen de Precios */}
                        <Card className="border-0 shadow-sm bg-white col-span-1 lg:col-span-2">
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Resumen de Precios y Comisiones
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Precio Original</span>
                                <span className="text-lg font-semibold text-gray-900 line-through text-gray-500">
                                  {formData.precioOriginal ? formatCurrency(parseFloat(formData.precioOriginal)) : 'S/ 0.00'}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Precio con Descuento</span>
                                <span className="text-lg font-semibold text-gray-900">
                                  {formData.precioVenta ? formatCurrency(parseFloat(formData.precioVenta)) : 'S/ 0.00'}
                                </span>
                              </div>
                              
                              {formData.montoDescuento && parseFloat(formData.montoDescuento) > 0 && (
                                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                  <span className="text-sm font-medium text-gray-700">Descuento</span>
                                  <span className="text-lg font-semibold text-orange-600">
                                    {formatCurrency(parseFloat(formData.montoDescuento))}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Comisión Vendedor</span>
                                <span className="text-lg font-semibold text-gray-900">
                                  {formData.comisionVendedor ? formatCurrency(parseFloat(formData.comisionVendedor)) : 'S/ 0.00'}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between py-3 bg-blue-50 rounded-lg px-4">
                                <span className="text-lg font-medium text-blue-900">Total a Recibir</span>
                                <span className="text-2xl font-bold text-blue-900">
                                  {formData.precioVenta ? formatCurrency(parseFloat(formData.precioVenta)) : 'S/ 0.00'}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 text-center">
                                El total a recibir es el precio de venta. La comisión del vendedor se registra para control interno.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Tab: Cuotas */}
                    <TabsContent value="cuotas" className="space-y-6 mt-0">
                      {formData.tipoVenta === 'CUOTAS' ? (
                        <div className="space-y-6">
                          {/* Configuración de cuotas regulares */}
                          <Card className="border-0 shadow-sm bg-white">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">{getSectionNumber('Configuración de Cuotas')}</div>
                                Configuración de Cuotas
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-2">
                                Las cuotas se generan automáticamente cuando completes todos los campos requeridos
                              </p>
                              
                              {/* Switch para activar cuotas personalizadas */}
                              <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="space-y-1">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Activar Cuotas Personalizadas
                                  </Label>
                                  <p className="text-xs text-gray-500">
                                    Define fechas y montos específicos para cada cuota
                                  </p>
                                </div>
                                <Switch
                                  checked={formData.cuotasPersonalizadas}
                                  onCheckedChange={(checked) => {
                                    setFormData({...formData, cuotasPersonalizadas: checked})
                                    // Limpiar la tabla de cuotas generadas cuando se activan cuotas personalizadas
                                    if (checked) {
                                      setCuotasGeneradas([])
                                    }
                                  }}
                                  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
                                />
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              {/* Campos COMUNES - Siempre visibles para ambos tipos de cuotas */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Monto Inicial
                                  </Label>
                                  <Input
                                    type="number"
                                    value={formData.montoInicial}
                                    onChange={(e) => setFormData(prev => ({ ...prev, montoInicial: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Pago inicial que se descuenta del precio total
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Saldo a Financiar
                                  </Label>
                                  <Input
                                    type="number"
                                    value={formData.saldoPendiente}
                                    placeholder="0.00"
                                    readOnly
                                    className="w-full bg-gray-50"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Precio de venta menos monto inicial
                                  </p>
                                </div>
                              </div>

                              {/* Configuración de intereses - DESPUÉS del saldo a financiar */}
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium text-blue-900">
                                      Aplicar Intereses a las Cuotas
                                    </Label>
                                    <p className="text-xs text-blue-700">
                                      Determina si las cuotas incluirán intereses sobre el saldo pendiente
                                    </p>
                                  </div>
                                  <Switch
                                    checked={formData.aplicarIntereses}
                                    onCheckedChange={(checked) => setFormData({...formData, aplicarIntereses: checked})}
                                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
                                  />
                                </div>

                                {formData.aplicarIntereses && (
                                  <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg">
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">
                                          Tasa de Interés Anual (%)
                                        </Label>
                                        <Input
                                          type="number"
                                          value={formData.tasaInteresAnual}
                                          onChange={(e) => setFormData({...formData, tasaInteresAnual: e.target.value})}
                                          placeholder="8.0"
                                          className={`w-full ${!validaciones.tasaInteresAnual.valido ? 'border-red-500' : ''}`}
                                        />
                                        {!validaciones.tasaInteresAnual.valido && (
                                          <p className="text-xs text-red-600">
                                            {validaciones.tasaInteresAnual.mensaje}
                                          </p>
                                        )}
                                        <p className="text-xs text-blue-600">
                                          {formData.cuotasPersonalizadas 
                                            ? 'Los intereses se calcularán automáticamente según las fechas de cada cuota personalizada'
                                            : 'La fecha de primera cuota se configura en la sección de cuotas regulares'
                                          }
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">
                                          Modelo de Amortización
                                        </Label>
                                        <Select 
                                          value={formData.modeloAmortizacion} 
                                          onValueChange={(value) => setFormData({...formData, modeloAmortizacion: value as 'FRANCES' | 'ALEMAN' | 'JAPONES'})}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="FRANCES">Francés (Cuota fija)</SelectItem>
                                            <SelectItem value="ALEMAN">Alemán (Capital fijo)</SelectItem>
                                            <SelectItem value="JAPONES">Japonés (Interés fijo)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">
                                          {formData.modeloAmortizacion === 'FRANCES' && 'Cuota fija con capital creciente e intereses decrecientes'}
                                          {formData.modeloAmortizacion === 'ALEMAN' && 'Capital fijo con cuota decreciente'}
                                          {formData.modeloAmortizacion === 'JAPONES' && 'Interés fijo sobre saldo inicial'}
                                        </p>
                                      </div>

                                                                             {/* NUEVO: Vista previa de tabla de amortización */}
                                       {formData.aplicarIntereses && 
                                        formData.tasaInteresAnual && 
                                        parseFloat(formData.tasaInteresAnual) > 0 && (
                                          <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                              ✅ Configuración de Intereses
                                            </h4>
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                              <p className="text-xs text-blue-700">
                                                {formData.cuotasPersonalizadas ? 'Intereses configurados para cuotas personalizadas' : 'Amortización configurada correctamente'}
                                              </p>
                                              <p className="text-xs text-gray-600 mt-1">
                                                • Tasa: {formData.tasaInteresAnual}% anual
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                • Modelo: {formData.modeloAmortizacion === 'FRANCES' ? 'Francés' : formData.modeloAmortizacion === 'ALEMAN' ? 'Alemán' : 'Japonés'}
                                              </p>
                                              {formData.cuotasPersonalizadas ? (
                                                <>
                                                  <p className="text-xs text-gray-600">
                                                    • Tipo: Cuotas personalizadas con intereses
                                                  </p>
                                                  <p className="text-xs text-gray-600">
                                                    • Cuotas configuradas: {formData.cuotasPersonalizadasList.length}
                                                  </p>
                                                </>
                                              ) : (
                                                <>
                                                  <p className="text-xs text-gray-600">
                                                    • Cuotas: {formData.numeroCuotas} ({formData.frecuenciaCuota.toLowerCase()})
                                                  </p>
                                                  <p className="text-xs text-gray-600">
                                                    • Saldo a financiar: {formatCurrency(parseFloat(formData.saldoPendiente) || 0)}
                                                  </p>
                                                </>
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                              * {formData.cuotasPersonalizadas ? 'Los intereses se calcularán automáticamente según las fechas de cada cuota.' : 'La tabla de amortización completa se calculará al crear la venta.'}
                                            </p>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Campos ESPECÍFICOS de cuotas regulares - Solo visibles cuando NO están activas las cuotas personalizadas */}
                              {!formData.cuotasPersonalizadas && (
                                <>
                                  {/* Título de Cuotas Regulares */}
                                  <div className="border-t pt-4">
                                    <div className="flex items-center gap-2 mb-4">
                                      <CreditCard className="h-5 w-5 text-blue-600" />
                                      <h3 className="text-lg font-semibold text-gray-900">Cuotas Regulares</h3>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-700">
                                        Número de Cuotas
                                      </Label>
                                      <Input
                                        type="number"
                                        value={formData.numeroCuotas}
                                        onChange={(e) => setFormData(prev => ({ ...prev, numeroCuotas: e.target.value }))}
                                        placeholder="12"
                                        className="w-full"
                                      />
                                      <p className="text-xs text-gray-500">
                                        Cantidad de cuotas para financiar
                                      </p>
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-700">
                                        Frecuencia de Cuotas
                                      </Label>
                                      <Select value={formData.frecuenciaCuota} onValueChange={(value) => setFormData(prev => ({ ...prev, frecuenciaCuota: value }))}>
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="MENSUAL">Mensual</SelectItem>
                                          <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
                                          <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                                          <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                                          <SelectItem value="ANUAL">Anual</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <p className="text-xs text-gray-500">
                                        Intervalo entre cada cuota
                                      </p>
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-700">
                                        Fecha de Primera Cuota
                                      </Label>
                                      <Input
                                        type="date"
                                        value={formData.fechaPrimeraCuota}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fechaPrimeraCuota: e.target.value }))}
                                        className="w-full"
                                      />
                                      <p className="text-xs text-gray-500">
                                        Fecha desde la cual se calcularán las cuotas
                                      </p>
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-700">
                                        Monto de Cuota
                                      </Label>
                                      <Input
                                        type="number"
                                        value={formData.montoCuota}
                                        placeholder="0.00"
                                        readOnly
                                        className="w-full bg-gray-50"
                                      />
                                      <p className="text-xs text-gray-500">
                                        Cuota calculada automáticamente
                                      </p>
                                    </div>
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>

                          {/* Cuotas personalizadas */}
                          {formData.cuotasPersonalizadas && (
                          <Card className="border-0 shadow-sm bg-white">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Clock className="h-5 w-5 text-green-600" />
                                Cuotas Personalizadas
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                      <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                        <span className="text-xs font-bold text-blue-600">💡</span>
                                      </div>
                                      <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Configuración de Cuotas Personalizadas</p>
                                        <p>Ingresa el capital de cada cuota. Los intereses se calcularán automáticamente según la fecha de vencimiento.</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Lista de cuotas personalizadas */}
                                  <div className="space-y-3">
                                    {formData.cuotasPersonalizadasList.map((cuota, index) => {
                                      const errores = validarCuota(index)
                                      return (
                                        <div key={index} className={`p-4 border rounded-lg ${
                                          Object.keys(errores).length > 0 
                                            ? 'border-red-300 bg-red-50' 
                                            : 'border-gray-200 bg-gray-50'
                                        }`}>
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {/* Columna 1: Capital e información financiera */}
                                            <div className="space-y-3">
                                              <div className="space-y-2">
                                                <Label className={`text-sm font-medium ${
                                                  errores.monto ? 'text-red-700' : 'text-gray-700'
                                                }`}>
                                                  Cuota {index + 1} - Capital
                                                </Label>
                                                <Input
                                                  type="number"
                                                  value={cuota.monto}
                                                  onChange={(e) => actualizarCuotaPersonalizada(index, 'monto', parseFloat(e.target.value) || 0)}
                                                  placeholder="0.00"
                                                  className={`w-full ${
                                                    errores.monto 
                                                      ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                                                      : ''
                                                  }`}
                                                />
                                                {errores.monto && (
                                                  <p className="text-xs text-red-600 mt-1">
                                                    {errores.monto}
                                                  </p>
                                                )}
                                              </div>
                                              
                                              <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">
                                                  Intereses: <span className="font-medium text-green-600">+{formatCurrency(cuota.intereses || 0)}</span>
                                                </span>
                                                <span className="text-gray-600">
                                                  Total: <span className="font-medium text-blue-600">{formatCurrency((cuota.monto || 0) + (cuota.intereses || 0))}</span>
                                                </span>
                                              </div>
                                            </div>

                                            {/* Columna 2: Fecha */}
                                            <div className="space-y-2">
                                              <Label className={`text-sm font-medium ${
                                                errores.fecha ? 'text-red-700' : 'text-gray-700'
                                              }`}>
                                                Fecha de Vencimiento
                                              </Label>
                                              <Input
                                                type="date"
                                                value={cuota.fecha}
                                                onChange={(e) => actualizarCuotaPersonalizada(index, 'fecha', e.target.value)}
                                                className={`w-full ${
                                                  errores.fecha 
                                                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' 
                                                    : ''
                                                }`}
                                              />
                                              {errores.fecha && (
                                                <p className="text-xs text-red-600 mt-1">
                                                  {errores.fecha}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <div className="mt-3 flex justify-end">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removerCuotaPersonalizada(index)}
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <X className="h-4 w-4 mr-1" />
                                              Eliminar
                                            </Button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>

                                  {/* Botón agregar cuota */}
                                  <div className="pt-2">
                                    <Button
                                      type="button"
                                      onClick={agregarCuotaPersonalizada}
                                      variant="outline"
                                      disabled={(() => {
                                        const capitalConfigurado = formData.cuotasPersonalizadasList.reduce((total, cuota) => total + (typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0), 0)
                                        const capitalTotal = parseFloat(formData.saldoPendiente) || 0
                                        return capitalConfigurado >= capitalTotal && capitalTotal > 0
                                      })()}
                                      className={`w-full border-dashed border-2 ${
                                        (() => {
                                          const capitalConfigurado = formData.cuotasPersonalizadasList.reduce((total, cuota) => total + (typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0), 0)
                                          const capitalTotal = parseFloat(formData.saldoPendiente) || 0
                                          const estaCompleto = capitalConfigurado >= capitalTotal && capitalTotal > 0
                                          
                                          if (estaCompleto) {
                                            return 'border-green-300 bg-green-50 text-green-700 cursor-not-allowed'
                                          } else {
                                            return 'border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-600 hover:text-green-700'
                                          }
                                        })()
                                      }`}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      {(() => {
                                        const capitalConfigurado = formData.cuotasPersonalizadasList.reduce((total, cuota) => total + (typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0), 0)
                                        const capitalTotal = parseFloat(formData.saldoPendiente) || 0
                                        const estaCompleto = capitalConfigurado >= capitalTotal && capitalTotal > 0
                                        
                                        if (estaCompleto) {
                                          return 'Configuración Completa ✓'
                                        } else {
                                          return 'Agregar Cuota'
                                        }
                                      })()}
                                    </Button>
                                  </div>

                                  {/* Progreso y validación de cuotas personalizadas */}
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="space-y-3">
                                      {/* Progreso de configuración */}
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-blue-800">Progreso de configuración:</span>
                                        <span className="text-sm font-bold text-blue-900">
                                          {(() => {
                                            const capitalConfigurado = formData.cuotasPersonalizadasList.reduce((total, cuota) => total + (typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0), 0)
                                            const capitalTotal = parseFloat(formData.saldoPendiente) || 0
                                            const porcentaje = capitalTotal > 0 ? Math.round((capitalConfigurado / capitalTotal) * 100) : 0
                                            return `${porcentaje}%`
                                          })()}
                                        </span>
                                      </div>
                                      
                                      {/* Barra de progreso */}
                                      <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                          style={{
                                            width: `${(() => {
                                              const capitalConfigurado = formData.cuotasPersonalizadasList.reduce((total, cuota) => total + (typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0), 0)
                                              const capitalTotal = parseFloat(formData.saldoPendiente) || 0
                                              return capitalTotal > 0 ? Math.min((capitalConfigurado / capitalTotal) * 100, 100) : 0
                                            })()}%`
                                          }}
                                        ></div>
                                      </div>
                                      
                                      {/* Información detallada */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-blue-700">Capital configurado:</span>
                                          <span className="font-medium text-blue-900">
                                            {formatCurrency(formData.cuotasPersonalizadasList.reduce((total, cuota) => total + (typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0), 0))}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-blue-700">Falta configurar:</span>
                                          <span className="font-medium text-blue-900">
                                            {formatCurrency(Math.max(0, (parseFloat(formData.saldoPendiente) || 0) - formData.cuotasPersonalizadasList.reduce((total, cuota) => total + (typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0), 0)))}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Mensaje de estado */}
                                      {(() => {
                                        const capitalConfigurado = formData.cuotasPersonalizadasList.reduce((total, cuota) => total + (typeof cuota.monto === 'string' ? parseFloat(cuota.monto) : cuota.monto || 0), 0)
                                        const capitalTotal = parseFloat(formData.saldoPendiente) || 0
                                        const falta = capitalTotal - capitalConfigurado
                                        
                                        if (falta <= 0 && capitalTotal > 0) {
                                          return (
                                            <div className="p-2 bg-green-100 border border-green-300 rounded text-green-800 text-sm">
                                              ✅ Configuración completa. Capital total configurado.
                                            </div>
                                          )
                                        } else if (falta > 0) {
                                          return (
                                            <div className="p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                                              ⚠️ Falta configurar {formatCurrency(falta)} para completar el capital total.
                                            </div>
                                          )
                                        } else {
                                          return (
                                            <div className="p-2 bg-blue-100 border border-blue-300 rounded text-blue-800 text-sm">
                                              ℹ️ El resumen completo se muestra en la tarjeta de abajo.
                                            </div>
                                          )
                                        }
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Resumen de Financiación */}
                          {cuotasGeneradas.length > 0 && (
                            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
                                  <TrendingUp className="h-5 w-5 text-blue-600" />
                                  Resumen de Financiación
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {/* Tiempo total de financiación */}
                                  <div className="text-center p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                                    <div className="text-2xl font-bold text-blue-600 mb-1">
                                      {(() => {
                                        if (cuotasGeneradas.length === 0) return '0 días'
                                        
                                        // Calcular desde la fecha de venta hasta la última cuota
                                        const fechaVenta = new Date(formData.fechaVenta)
                                        const ultimaCuota = cuotasGeneradas[cuotasGeneradas.length - 1]
                                        const dias = Math.floor((ultimaCuota.fechaVencimiento.getTime() - fechaVenta.getTime()) / (1000 * 60 * 60 * 24))
                                        
                                        const meses = Math.floor(dias / 30)
                                        const diasRestantes = dias % 30
                                        
                                        if (meses > 0) {
                                          return `${meses} mes${meses !== 1 ? 'es' : ''}${diasRestantes > 0 ? ` ${diasRestantes} días` : ''}`
                                        }
                                        return `${dias} días`
                                      })()}
                                    </div>
                                    <div className="text-sm text-blue-700 font-medium">Duración Total</div>
                                  </div>

                                  {/* Monto total de intereses */}
                                  <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                                    <div className="text-2xl font-bold text-green-600 mb-1">
                                      {formatCurrency(cuotasGeneradas.reduce((total, cuota) => total + cuota.montoInteres, 0))}
                                    </div>
                                    <div className="text-sm text-green-700 font-medium">Total Intereses</div>
                                  </div>

                                  {/* Número de cuotas */}
                                  <div className="text-center p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
                                    <div className="text-2xl font-bold text-purple-600 mb-1">
                                      {cuotasGeneradas.length}
                                    </div>
                                    <div className="text-sm text-purple-700 font-medium">Número de Cuotas</div>
                                  </div>

                                  {/* Monto total a pagar */}
                                  <div className="text-center p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
                                    <div className="text-2xl font-bold text-indigo-600 mb-1">
                                      {formatCurrency(cuotasGeneradas.reduce((total, cuota) => total + cuota.monto, 0))}
                                    </div>
                                    <div className="text-sm text-indigo-700 font-medium">Total a Pagar</div>
                                  </div>
                                </div>

                                {/* Información adicional */}
                                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-4">
                                      <span className="text-blue-700">
                                        <span className="font-medium">Tasa de Interés:</span> {formData.aplicarIntereses ? (formData.tasaInteresAnual || 0) : 0}% anual
                                      </span>
                                      <span className="text-blue-700">
                                        <span className="font-medium">Saldo a Financiar:</span> {formatCurrency(parseFloat(formData.saldoPendiente) || 0)}
                                      </span>
                                    </div>
                                    <div className="text-blue-700 font-medium">
                                      {formData.cuotasPersonalizadas ? 'Cuotas Personalizadas' : 'Cuotas Regulares'}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Lista de Cuotas Generadas - Se guardará en la base de datos */}
                          {cuotasGeneradas.length > 0 && (
                            <Card className="border-0 shadow-sm bg-white">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                  <FileText className="h-5 w-5 text-emerald-600" />
                                  Lista de Cuotas Generadas
                                  <Badge variant="secondary" className="ml-2">
                                    {cuotasGeneradas.length} cuota{cuotasGeneradas.length !== 1 ? 's' : ''}
                                  </Badge>
                                </CardTitle>
                                <p className="text-sm text-gray-600 mt-2">
                                  Esta lista se guardará automáticamente en la base de datos al crear la venta
                                </p>
                              </CardHeader>
                              <CardContent>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">#</th>
                                        <th className="text-left py-2 px-3 font-medium text-gray-700">Fecha Vencimiento</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-700">Monto</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-700">Capital</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-700">Interés</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-700">Saldo Anterior</th>
                                        <th className="text-right py-2 px-3 font-medium text-gray-700">Saldo Posterior</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cuotasGeneradas.map((cuota, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                          <td className="py-2 px-3 text-gray-900 font-medium">{cuota.numeroCuota}</td>
                                          <td className="py-2 px-3 text-gray-700">
                                            {cuota.fechaVencimiento.toLocaleDateString('es-ES')}
                                          </td>
                                          <td className="py-2 px-3 text-right text-gray-900 font-medium">
                                            {formatCurrency(cuota.monto)}
                                          </td>
                                          <td className="py-2 px-3 text-right text-gray-700">
                                            {formatCurrency(cuota.montoCapital)}
                                          </td>
                                          <td className="py-2 px-3 text-right text-green-600">
                                            {formatCurrency(cuota.montoInteres)}
                                          </td>
                                          <td className="py-2 px-3 text-right text-gray-600">
                                            {formatCurrency(cuota.saldoCapitalAnterior)}
                                          </td>
                                          <td className="py-2 px-3 text-right text-gray-600">
                                            {formatCurrency(cuota.saldoCapitalPosterior)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                            </CardContent>
                          </Card>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Cuotas no habilitadas</h3>
                          <p className="text-gray-500 mb-4">
                            Para configurar cuotas, primero selecciona "Cuotas" como tipo de venta en la pestaña Financiero.
                          </p>
                          <Button
                            onClick={() => setActiveTab('financiero')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Ir a Financiero
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab: Comprobantes */}
                    <TabsContent value="comprobantes" className="space-y-4 mt-0 min-h-[60vh]">
                      <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">{getSectionNumber('Comprobantes de Pago')}</div>
                            Comprobantes de Pago
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Generar comprobantes automáticamente */}
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium text-emerald-900">Generar Comprobantes de Pago</h4>
                                <p className="text-sm text-emerald-700">
                                  Crea comprobantes para pagos vencidos o del día actual
                                </p>
                              </div>
                              <Button
                                type="button"
                                onClick={generarComprobantesAutomaticos}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                Generar
                              </Button>
                            </div>
                            
                            {/* Mensaje de error de comprobantes pendientes */}
                            {comprobantesError && (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                  <p className="text-sm text-red-700 font-medium">Comprobantes pendientes</p>
                                </div>
                                <p className="text-sm text-red-600 mt-1">{comprobantesError}</p>
                              </div>
                            )}
                          </div>

                          {/* Lista de comprobantes */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">Comprobantes Registrados</h4>
                            {formData.comprobantesPago.length > 0 ? (
                              <div className="space-y-3">
                                {formData.comprobantesPago.map((comprobante, index) => (
                                  <div key={comprobante.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                      {/* Información básica */}
                                      <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-700">Tipo</Label>
                                            <div className="text-sm font-medium text-gray-900">{comprobante.tipo}</div>
                                      </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-700">Monto</Label>
                                        <div className="text-sm font-medium text-gray-900">{formatCurrency(comprobante.monto)}</div>
                                      </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-700">Fecha</Label>
                                        <div className="text-sm text-gray-900">{comprobante.fecha}</div>
                                          </div>
                                        </div>
                                        
                                        {/* Campo de descripción */}
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-gray-700">Descripción</Label>
                                          <Input
                                            type="text"
                                            placeholder="Descripción del comprobante..."
                                            value={comprobante.descripcion}
                                            onChange={(e) => actualizarComprobantePago(comprobante.id, 'descripcion', e.target.value)}
                                            className="w-full text-sm"
                                          />
                                        </div>
                                        
                                        {/* Campo de número de operación */}
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-gray-700">Número de Operación</Label>
                                          <Input
                                            type="text"
                                            placeholder="Número de operación bancaria..."
                                            value={comprobante.numeroOperacion || ''}
                                            onChange={(e) => actualizarComprobantePago(comprobante.id, 'numeroOperacion', e.target.value)}
                                            className="w-full text-sm"
                                          />
                                          <p className="text-xs text-gray-500">Ej: 6619, 12345, etc.</p>
                                        </div>
                                      </div>
                                      
                                      {/* Campo de archivo */}
                                      <div className="space-y-3">
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-gray-700">Archivo Adjunto *</Label>
                                          <Input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (file) handleFileUpload(comprobante.id, file)
                                            }}
                                            className="w-full"
                                          />
                                          <p className="text-xs text-gray-500">PDF, JPG o PNG (máx. 5MB)</p>
                                        </div>
                                        
                                        {/* Mostrar archivo seleccionado */}
                                        {comprobante.archivo && (
                                          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                                            ✓ {comprobante.nombreArchivo}
                                          </div>
                                        )}
                                        
                                        {/* Botón para remover */}
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removerComprobantePago(comprobante.id)}
                                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Remover
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No hay comprobantes registrados</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Tab: Documentación */}
                    <TabsContent value="documentacion" className="space-y-4 mt-0 min-h-[60vh]">
                      <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">{getSectionNumber('Documentación')}</div>
                            Documentación de la Venta
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-6">
                            {/* Documentos opcionales */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-gray-700">Documentos Adicionales (Opcional)</h4>
                              <p className="text-sm text-gray-500">
                                El contrato de venta se generará automáticamente. Aquí puedes agregar documentos adicionales si lo deseas.
                              </p>
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Documentos Adicionales
                                  </Label>
                                  <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                    multiple
                                    className="w-full"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Puedes subir múltiples archivos. Este campo es completamente opcional.
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">
                                    Notas Adicionales
                                  </Label>
                                  <Textarea
                                    placeholder="Notas sobre la documentación adicional..."
                                    rows={3}
                                    className="w-full"
                                  />
                                  <p className="text-xs text-gray-500">
                                    Notas opcionales sobre los documentos adicionales.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </form>
              </div>
            </div>
          </div>

          {/* Footer con botones de acción */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarFormulario}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  Limpiar Formulario
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  {(() => {
                    const progress = getFormProgress()
                    return `${progress.camposCompletados} de ${progress.totalCampos} grupos completados`
                  })()}
                </div>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !isFormValid()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Registrar Venta
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </>
  )
} 