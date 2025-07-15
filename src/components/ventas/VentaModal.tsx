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
  X
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
    observaciones: ''
  })
  const { toast } = useToast()

  // Estado para múltiples clientes
  const [clientesSeleccionados, setClientesSeleccionados] = useState<Cliente[]>([])
  const [clienteTemporal, setClienteTemporal] = useState<string>('')

  // Estado para vendedores
  const [vendedores, setVendedores] = useState<Array<{
    id: string
    nombre: string
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
  const [cuotasPersonalizadas, setCuotasPersonalizadas] = useState<Array<{monto: number, fecha: string}>>([])

  // Estado para comprobantes de pago
  const [comprobantesPago, setComprobantesPago] = useState<Array<{
    id: string
    tipo: 'INICIAL' | 'CUOTA' | 'CONTADO'
    monto: number
    fecha: string
    archivo: File | null
    nombreArchivo: string
    descripcion: string
  }>>([])

  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('informacion')

  // Estado para validaciones
  const [validaciones, setValidaciones] = useState({
    precioVenta: { valido: true, mensaje: '' },
    montoInicial: { valido: true, mensaje: '' },
    saldoPendiente: { valido: true, mensaje: '' },
    numeroCuotas: { valido: true, mensaje: '' },
    montoCuota: { valido: true, mensaje: '' },
    fechaPrimeraCuota: { valido: true, mensaje: '' },
    cuotas: { valido: true, mensaje: '' }
  })

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      limpiarFormulario()
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
        }
      } catch (error) {
        console.error('Error al cargar clientes:', error)
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
        
        const response = await fetch(endpoint)
        
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
          
          setManzanasPabellones(Array.from(manzanasPabellonesMap.values()))
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
      setUnidadesDisponibles([])
    }
    // Limpiar unidad seleccionada cuando cambia la manzana/pabellón
    setFormData(prev => ({ ...prev, unidadId: '' }))
    setSelectedUnidad(null)
  }, [manzanaPabellonSeleccionado, manzanasPabellones])

  // Cargar vendedores
  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        console.log('Llamando endpoint de vendedores...')
        const response = await fetch('/api/vendedores')
        console.log('Respuesta del endpoint:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('Datos recibidos de vendedores:', data)
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
        const montoDescuento = 0
        
        setFormData(prev => ({ 
          ...prev, 
          precioOriginal: precioOriginal.toString(),
          precioVenta: precioVenta.toString(),
          montoDescuento: montoDescuento.toString()
        }))
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
      
      // Calcular monto por cuota con números enteros
      let montoCuota = 0
      if (numeroCuotas > 0) {
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
      
      setFormData(prev => ({ 
        ...prev, 
        montoCuota: montoCuota.toFixed(2),
        saldoPendiente: saldoFinanciar.toFixed(2)
      }))
    }
  }, [formData.tipoVenta, formData.precioVenta, formData.montoInicial, formData.numeroCuotas])

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

  // Función para validar si el formulario está completo
  const isFormValid = () => {
    // Campos básicos obligatorios
    if (!formData.unidadId || clientesSeleccionados.length === 0) {
      return false
    }

    // Validar precios
    if (!formData.precioVenta || parseFloat(formData.precioVenta) <= 0) {
      return false
    }

    if (!formData.precioOriginal || parseFloat(formData.precioOriginal) <= 0) {
      return false
    }

    // Validar vendedor
    if (!vendedorSeleccionado) {
      return false
    }

    // Validar comprobantes de pago solo si hay pagos que justifiquen comprobantes
    const hayPagosQueRequierenComprobantes = (() => {
      if (formData.tipoVenta === 'CONTADO') {
        const montoTotal = parseFloat(formData.precioVenta) || 0
        return montoTotal > 0
      } else if (formData.tipoVenta === 'CUOTAS') {
        const montoInicial = parseFloat(formData.montoInicial) || 0
        if (montoInicial > 0) return true
        
        // Verificar si hay cuotas personalizadas vencidas con montos > 0
        if (modoCuotasPersonalizadas && cuotasPersonalizadas.length > 0) {
          const fechaActual = new Date()
          fechaActual.setHours(0, 0, 0, 0)
          return cuotasPersonalizadas.some(cuota => {
            if (cuota.monto > 0) {
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

    if (hayPagosQueRequierenComprobantes) {
      if (comprobantesPago.length === 0) {
        return false
      }

      // Verificar que todos los comprobantes tengan archivo adjunto
      const comprobantesSinArchivo = comprobantesPago.filter(comp => !comp.archivo)
      if (comprobantesSinArchivo.length > 0) {
        return false
      }
    }

    // Validaciones específicas para ventas en cuotas
    if (formData.tipoVenta === 'CUOTAS') {
      if (!formData.numeroCuotas || parseInt(formData.numeroCuotas) <= 0) {
        return false
      }

      // Para cuotas personalizadas, usar la fecha de la primera cuota
      if (modoCuotasPersonalizadas) {
        if (cuotasPersonalizadas.length === 0) {
          return false
        }
        // La fecha de la primera cuota personalizada se considera como fechaPrimeraCuota
      } else {
        // Para cuotas regulares, validar fechaPrimeraCuota del formulario
        if (!formData.fechaPrimeraCuota) {
          return false
        }
      }

      // Para cuotas regulares, validar que el saldo pendiente sea mayor a 0
      if (!modoCuotasPersonalizadas) {
        if (!formData.saldoPendiente || parseFloat(formData.saldoPendiente) <= 0) {
          return false
        }
      }
    }

    // Verificar que no hay errores de validación
    const hayErrores = Object.values(validaciones).some(v => !v.valido)
    if (hayErrores) {
      return false
    }

    return true
  }

  // Función para obtener el progreso del formulario
  const getFormProgress = () => {
    // Determinar si se requieren comprobantes
    const hayPagosQueRequierenComprobantes = (() => {
      if (formData.tipoVenta === 'CONTADO') {
        const montoTotal = parseFloat(formData.precioVenta) || 0
        return montoTotal > 0
      } else if (formData.tipoVenta === 'CUOTAS') {
        const montoInicial = parseFloat(formData.montoInicial) || 0
        if (montoInicial > 0) return true
        
        // Verificar si hay cuotas personalizadas vencidas con montos > 0
        if (modoCuotasPersonalizadas && cuotasPersonalizadas.length > 0) {
          const fechaActual = new Date()
          fechaActual.setHours(0, 0, 0, 0)
          return cuotasPersonalizadas.some(cuota => {
            if (cuota.monto > 0) {
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

    const camposObligatorios = [
      { nombre: 'Unidad', valido: !!formData.unidadId },
      { nombre: 'Clientes', valido: clientesSeleccionados.length > 0 },
      { nombre: 'Precio Original', valido: !!(formData.precioOriginal && parseFloat(formData.precioOriginal) > 0) },
      { nombre: 'Precio Venta', valido: !!(formData.precioVenta && parseFloat(formData.precioVenta) > 0) },
      { nombre: 'Vendedor', valido: !!vendedorSeleccionado }
    ]

    // Solo agregar comprobantes como campo obligatorio si hay pagos que los requieren
    if (hayPagosQueRequierenComprobantes) {
      camposObligatorios.push({ 
        nombre: 'Comprobantes', 
        valido: comprobantesPago.length > 0 && comprobantesPago.every(comp => comp.archivo) 
      })
    }

    // Agregar campos específicos para cuotas
    if (formData.tipoVenta === 'CUOTAS') {
      camposObligatorios.push(
        { nombre: 'Número Cuotas', valido: !!(formData.numeroCuotas && parseInt(formData.numeroCuotas) > 0) },
        { nombre: 'Cuotas Personalizadas', valido: cuotasPersonalizadas.length > 0 },
        { nombre: 'Fecha Primera Cuota', valido: cuotasPersonalizadas.length > 0 },
        { nombre: 'Saldo Pendiente', valido: !!(formData.saldoPendiente && parseFloat(formData.saldoPendiente) > 0) }
      )
    } else {
      camposObligatorios.push(
        { nombre: 'Fecha Primera Cuota', valido: !!formData.fechaPrimeraCuota },
        { nombre: 'Saldo Pendiente', valido: !!(formData.saldoPendiente && parseFloat(formData.saldoPendiente) > 0) }
      )
    }

    const camposCompletados = camposObligatorios.filter(campo => campo.valido).length
    const totalCampos = camposObligatorios.length
    const porcentaje = Math.round((camposCompletados / totalCampos) * 100)

    return {
      porcentaje,
      camposCompletados,
      totalCampos,
      camposFaltantes: camposObligatorios.filter(campo => !campo.valido).map(campo => campo.nombre)
    }
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
      observaciones: ''
    })
    setClientesSeleccionados([])
    setClienteTemporal('')
    setVendedorSeleccionado('')
    setManzanaPabellonSeleccionado('')
    setUnidadesDisponibles([])
    setSelectedUnidad(null)
    setModoCuotasPersonalizadas(false)
    setCuotasPersonalizadas([])
    setComprobantesPago([])
    setActiveTab('informacion')
    setValidaciones({
      precioVenta: { valido: true, mensaje: '' },
      montoInicial: { valido: true, mensaje: '' },
      saldoPendiente: { valido: true, mensaje: '' },
      numeroCuotas: { valido: true, mensaje: '' },
      montoCuota: { valido: true, mensaje: '' },
      fechaPrimeraCuota: { valido: true, mensaje: '' },
      cuotas: { valido: true, mensaje: '' }
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

    // Validar comprobantes de pago solo si hay pagos que los justifiquen
    const hayPagosQueRequierenComprobantes = (() => {
      if (formData.tipoVenta === 'CONTADO') {
        const montoTotal = parseFloat(formData.precioVenta) || 0
        return montoTotal > 0
      } else if (formData.tipoVenta === 'CUOTAS') {
        const montoInicial = parseFloat(formData.montoInicial) || 0
        if (montoInicial > 0) return true
        
        // Verificar si hay cuotas personalizadas vencidas con montos > 0
        if (modoCuotasPersonalizadas && cuotasPersonalizadas.length > 0) {
          const fechaActual = new Date()
          fechaActual.setHours(0, 0, 0, 0)
          return cuotasPersonalizadas.some(cuota => {
            if (cuota.monto > 0) {
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

    if (hayPagosQueRequierenComprobantes) {
      if (comprobantesPago.length === 0) {
        toast({
          title: 'Error',
          description: 'Debes generar y completar los comprobantes de pago en la pestaña "Comprobantes"',
          variant: 'destructive'
        })
        return
      }

      // Verificar que todos los comprobantes tengan archivo adjunto
      const comprobantesSinArchivo = comprobantesPago.filter(comp => !comp.archivo)
      if (comprobantesSinArchivo.length > 0) {
        toast({
          title: 'Error',
          description: `Faltan ${comprobantesSinArchivo.length} comprobante(s) sin archivo adjunto`,
          variant: 'destructive'
        })
        return
      }
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
      if (modoCuotasPersonalizadas) {
        if (cuotasPersonalizadas.length === 0) {
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
      const ventaData = {
        ...formData,
        clienteIds: clientesSeleccionados.map(c => c.id),
        vendedorId: vendedorSeleccionado,
        cuotasPersonalizadas: modoCuotasPersonalizadas ? cuotasPersonalizadas : undefined
      }
      
      formDataToSend.append('ventaData', JSON.stringify(ventaData))
      
      // Agregar archivos de comprobantes
      comprobantesPago.forEach((comprobante, index) => {
        if (comprobante.archivo) {
          formDataToSend.append(`comprobante_${index}`, comprobante.archivo)
          formDataToSend.append(`comprobante_${index}_data`, JSON.stringify({
            tipo: comprobante.tipo,
            monto: comprobante.monto,
            fecha: comprobante.fecha,
            descripcion: comprobante.descripcion
          }))
        }
      })

      console.log('Datos a enviar:', ventaData)
      console.log('Comprobantes:', comprobantesPago.length)

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
    if (clienteTemporal && !clientesSeleccionados.find(c => c.id === clienteTemporal)) {
      const cliente = clientes.find(c => c.id === clienteTemporal)
      if (cliente) {
        setClientesSeleccionados(prev => [...prev, cliente])
        setClienteTemporal('')
      }
    }
  }

  const removerCliente = (clienteId: string) => {
    setClientesSeleccionados(prev => prev.filter(c => c.id !== clienteId))
  }

  const agregarCuotaPersonalizada = () => {
    const nuevaCuota = {
      monto: 0,
      fecha: new Date().toISOString().split('T')[0]
    }
    setCuotasPersonalizadas(prev => [...prev, nuevaCuota])
  }

  const actualizarCuotaPersonalizada = (index: number, campo: 'monto' | 'fecha', valor: string | number) => {
    setCuotasPersonalizadas(prev => prev.map((cuota, i) => 
      i === index ? { ...cuota, [campo]: valor } : cuota
    ))
  }

  const removerCuotaPersonalizada = (index: number) => {
    setCuotasPersonalizadas(prev => prev.filter((_, i) => i !== index))
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
      descripcion: ''
    }
    setComprobantesPago(prev => [...prev, nuevoComprobante])
  }

  const actualizarComprobantePago = (id: string, campo: 'archivo' | 'nombreArchivo' | 'descripcion', valor: any) => {
    setComprobantesPago(prev => prev.map(comp => 
      comp.id === id ? { ...comp, [campo]: valor } : comp
    ))
  }

  const removerComprobantePago = (id: string) => {
    setComprobantesPago(prev => prev.filter(comp => comp.id !== id))
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
    const nuevosComprobantes: Array<{
      id: string
      tipo: 'INICIAL' | 'CUOTA' | 'CONTADO'
      monto: number
      fecha: string
      archivo: File | null
      nombreArchivo: string
      descripcion: string
    }> = []

    const fechaActual = new Date()
    fechaActual.setHours(0, 0, 0, 0) // Normalizar a inicio del día

    if (formData.tipoVenta === 'CONTADO') {
      // Para venta al contado, generar un comprobante por el monto total
      const montoTotal = parseFloat(formData.precioVenta) || 0
      if (montoTotal > 0) {
        nuevosComprobantes.push({
          id: `comp-contado-${Date.now()}`,
          tipo: 'CONTADO',
          monto: montoTotal,
          fecha: formData.fechaVenta,
          archivo: null,
          nombreArchivo: '',
          descripcion: 'Pago al contado'
        })
      } else {
        toast({
          title: 'Sin comprobantes para generar',
          description: 'El precio de venta es cero, no se requieren comprobantes de pago',
          variant: 'default'
        })
        return
      }
    } else if (formData.tipoVenta === 'CUOTAS') {
      // Para venta en cuotas, generar comprobante por el monto inicial
      const montoInicial = parseFloat(formData.montoInicial) || 0
      if (montoInicial > 0) {
        nuevosComprobantes.push({
          id: `comp-inicial-${Date.now()}`,
          tipo: 'INICIAL',
          monto: montoInicial,
          fecha: formData.fechaVenta,
          archivo: null,
          nombreArchivo: '',
          descripcion: 'Pago inicial'
        })
      }

      // Si hay cuotas personalizadas, generar comprobantes solo para cuotas vencidas o del día actual
      if (modoCuotasPersonalizadas && cuotasPersonalizadas.length > 0) {
        let cuotasVencidas = 0
        cuotasPersonalizadas.forEach((cuota, index) => {
          if (cuota.monto > 0) {
            const fechaCuota = new Date(cuota.fecha)
            fechaCuota.setHours(0, 0, 0, 0) // Normalizar a inicio del día
            
            // Solo generar comprobante si la cuota ya venció o es del día actual
            if (fechaCuota <= fechaActual) {
              nuevosComprobantes.push({
                id: `comp-cuota-${index}-${Date.now()}`,
                tipo: 'CUOTA',
                monto: cuota.monto,
                fecha: cuota.fecha,
                archivo: null,
                nombreArchivo: '',
                descripcion: `Cuota ${index + 1}`
              })
              cuotasVencidas++
            }
          }
        })

        // Si no hay cuotas vencidas, mostrar mensaje informativo
        if (cuotasVencidas === 0 && montoInicial === 0) {
          toast({
            title: 'Sin comprobantes para generar',
            description: 'No hay pagos iniciales ni cuotas vencidas. Los comprobantes se generarán automáticamente cuando las cuotas venzan.',
            variant: 'default'
          })
          return
        } else if (cuotasVencidas > 0) {
          toast({
            title: 'Comprobantes generados',
            description: `Se generaron comprobantes para ${cuotasVencidas} cuota(s) vencida(s)`,
            variant: 'default'
          })
        }
      }

      // Si no hay comprobantes para generar, mostrar mensaje
      if (nuevosComprobantes.length === 0) {
        toast({
          title: 'Sin comprobantes para generar',
          description: 'No hay pagos iniciales ni cuotas vencidas que requieran comprobantes',
          variant: 'default'
        })
        return
      }
    }

    setComprobantesPago(nuevosComprobantes)
    
    if (nuevosComprobantes.length > 0) {
      toast({
        title: 'Comprobantes generados',
        description: `Se generaron ${nuevosComprobantes.length} comprobante(s) automáticamente`,
        variant: 'default'
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col p-0">
        {/* Header fijo */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Nueva Venta - {tipoVenta === 'LOTE' ? 'Lote' : 'Unidad de Cementerio'}
            </DialogTitle>
          </DialogHeader>

          {/* Indicador de progreso */}
          {(() => {
            const progress = getFormProgress()
            return (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progreso del formulario
                  </span>
                  <span className="text-sm text-gray-600">
                    {progress.camposCompletados} de {progress.totalCampos} campos completados
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.porcentaje === 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress.porcentaje}%` }}
                  ></div>
                </div>
                {progress.camposFaltantes.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Campos faltantes:</span> {progress.camposFaltantes.join(', ')}
                  </div>
                )}
                {progress.porcentaje === 100 && (
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Formulario completo - Puedes crear la venta
                  </div>
                )}
              </div>
            )
          })()}

          {/* Tabs fijos */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="flex w-full flex-wrap gap-1 p-1">
              <TabsTrigger value="informacion" className="flex items-center gap-2 flex-1 min-w-0">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Información</span>
              </TabsTrigger>
              <TabsTrigger value="clientes" className="flex items-center gap-2 flex-1 min-w-0">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Clientes</span>
              </TabsTrigger>
              <TabsTrigger value="financiero" className="flex items-center gap-2 flex-1 min-w-0">
                <Calculator className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Financiero</span>
              </TabsTrigger>
              {formData.tipoVenta === 'CUOTAS' && (
                <TabsTrigger value="cuotas" className="relative flex items-center gap-2 bg-blue-100 text-blue-700 border-blue-300 shadow-sm flex-1 min-w-0">
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Cuotas</span>
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse flex-shrink-0"></div>
                  <Badge variant="outline" className="absolute -top-1 -right-1 text-[10px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
                    Req
                  </Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="comprobantes" className="relative flex items-center gap-2 bg-green-100 text-green-700 border-green-300 shadow-sm flex-1 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Comprobantes</span>
                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse flex-shrink-0"></div>
                <Badge variant="outline" className="absolute -top-1 -right-1 text-[10px] px-1 py-0 bg-green-50 text-green-700 border-green-200">
                  Req
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="documentacion" className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Documentación</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab: Información General */}
              <TabsContent value="informacion" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Selección de unidad */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Selección de Unidad
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Información del Proyecto */}
                      {manzanasPabellones.length > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium mb-2 text-blue-900">Información del Proyecto</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">Tipo de Venta:</span>
                              <Badge variant="outline" className="text-blue-600">
                                {tipoVenta === 'LOTE' ? 'Lote' : 'Unidad de Cementerio'}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Proyecto:</span>
                              <span className="font-medium text-blue-900">
                                {manzanasPabellones[0]?.proyecto.nombre}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">Unidades Disponibles:</span>
                              <span className="font-medium text-blue-900">
                                {manzanasPabellones.reduce((total, mp) => total + mp.unidades.length, 0)} unidades
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Paso 1: Seleccionar Manzana/Pabellón */}
                      <div>
                        <Label htmlFor="manzanaPabellon" className="text-sm font-medium">
                          Paso 1: Seleccionar {tipoVenta === 'LOTE' ? 'Manzana' : 'Pabellón'}
                        </Label>
                        <Select
                          value={manzanaPabellonSeleccionado}
                          onValueChange={setManzanaPabellonSeleccionado}
                          disabled={loadingUnidades}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingUnidades ? "Cargando..." : `Seleccionar ${tipoVenta === 'LOTE' ? 'manzana' : 'pabellón'}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {manzanasPabellones.map((manzanaPabellon) => (
                              <SelectItem key={manzanaPabellon.id} value={manzanaPabellon.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{manzanaPabellon.nombre}</span>
                                  <span className="text-sm text-gray-500">
                                    {manzanaPabellon.unidades.length} unidades disponibles
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Selecciona la {tipoVenta === 'LOTE' ? 'manzana' : 'pabellón'} donde se encuentra la unidad
                        </p>
                      </div>

                      {/* Paso 2: Seleccionar Unidad */}
                      {manzanaPabellonSeleccionado && (
                        <div>
                          <Label htmlFor="unidadId" className="text-sm font-medium">
                            Paso 2: Seleccionar Unidad
                          </Label>
                          <Select
                            value={formData.unidadId}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, unidadId: value }))}
                            disabled={unidadesDisponibles.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={unidadesDisponibles.length === 0 ? "No hay unidades disponibles" : "Seleccionar unidad"} />
                            </SelectTrigger>
                            <SelectContent>
                              {unidadesDisponibles.map((unidad) => (
                                <SelectItem key={unidad.id} value={unidad.id}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{unidad.codigo}</span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      {formatCurrency(unidad.precio)}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Selecciona la unidad específica que deseas vender
                          </p>
                        </div>
                      )}

                      {/* Información de la Unidad Seleccionada */}
                      {selectedUnidad && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium mb-3 text-green-900">Unidad Seleccionada</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Código:</span>
                              <span className="font-medium">{selectedUnidad.codigo}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Precio:</span>
                              <span className="font-medium">{formatCurrency(selectedUnidad.precio)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Estado:</span>
                              <Badge variant={selectedUnidad.estado === 'DISPONIBLE' ? 'default' : 'secondary'}>
                                {selectedUnidad.estado}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Ubicación:</span>
                              <span className="font-medium">
                                {tipoVenta === 'LOTE' 
                                  ? `${selectedUnidad.manzana?.proyecto.nombre} - ${selectedUnidad.manzana?.nombre}`
                                  : `${selectedUnidad.pabellon?.proyecto.nombre} - ${selectedUnidad.pabellon?.nombre}`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Información de venta */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Información de Venta
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fechaVenta">Fecha de Venta *</Label>
                          <Input
                            type="date"
                            value={formData.fechaVenta}
                            onChange={(e) => setFormData(prev => ({ ...prev, fechaVenta: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="fechaEntrega">Fecha de Entrega</Label>
                          <Input
                            type="date"
                            value={formData.fechaEntrega}
                            onChange={(e) => setFormData(prev => ({ ...prev, fechaEntrega: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="vendedorSeleccionado">Agente de Ventas (Comisión)</Label>
                        <Select value={vendedorSeleccionado} onValueChange={setVendedorSeleccionado}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar agente para comisión" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(vendedores) && vendedores.length > 0 ? (
                              vendedores.map((vendedor) => (
                                <SelectItem key={vendedor.id} value={vendedor.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{vendedor.nombre}</span>
                                    <span className="text-sm text-gray-500">{vendedor.email}</span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-gray-500">
                                No hay agentes de ventas disponibles
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Selecciona el agente de ventas que recibirá la comisión por esta venta
                        </p>
                      </div>


                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Clientes */}
              <TabsContent value="clientes" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Gestión de Clientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select value={clienteTemporal} onValueChange={setClienteTemporal}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientes.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{cliente.nombre} {cliente.apellido}</span>
                                  <span className="text-sm text-gray-500">{cliente.email}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" onClick={agregarCliente} disabled={!clienteTemporal}>
                        Agregar
                      </Button>
                    </div>

                    {clientesSeleccionados.length > 0 && (
                      <div className="space-y-3">
                        <Label>Clientes seleccionados ({clientesSeleccionados.length})</Label>
                        <div className="space-y-2">
                          {clientesSeleccionados.map((cliente) => (
                            <div key={cliente.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <User className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <div className="font-medium">{cliente.nombre} {cliente.apellido}</div>
                                  <div className="text-sm text-gray-600">{cliente.email}</div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removerCliente(cliente.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Financiero */}
              <TabsContent value="financiero" className="space-y-6">
                <div className="space-y-6">
                  {/* Paso 1: Información de Precios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                        Información de Precios
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Define el precio original y aplica descuentos si es necesario
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="precioOriginal" className="text-sm font-medium">Precio Original</Label>
                          <Input
                            type="number"
                            value={formData.precioOriginal}
                            placeholder="0.00"
                            className="bg-gray-100 text-gray-600 cursor-not-allowed"
                            disabled
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Precio registrado de la unidad (no modificable)
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="montoDescuento" className="text-sm font-medium">Descuento a Aplicar</Label>
                          <Input
                            type="number"
                            value={formData.montoDescuento}
                            onChange={(e) => setFormData(prev => ({ ...prev, montoDescuento: e.target.value }))}
                            placeholder="0.00"
                            className={!validaciones.precioVenta.valido ? 'border-red-500' : ''}
                          />
                          {!validaciones.precioVenta.valido && (
                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {validaciones.precioVenta.mensaje}
                            </p>
                          )}
                          {validaciones.precioVenta.valido && parseFloat(formData.montoDescuento) > 0 && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Descuento aplicado correctamente
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Monto del descuento a aplicar
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-900">Precio Final de Venta</h4>
                            <p className="text-sm text-green-700">Calculado automáticamente</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-900">
                              {formatCurrency(parseFloat(formData.precioVenta) || 0)}
                            </div>
                            <div className="text-sm text-green-600">
                              {parseFloat(formData.montoDescuento) > 0 && (
                                <span className="line-through text-gray-500">
                                  {formatCurrency(parseFloat(formData.precioOriginal) || 0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Paso 2: Forma de Pago */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">2</div>
                        Forma de Pago
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Selecciona el tipo de venta y método de pago
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tipoVenta" className="text-sm font-medium">Tipo de Venta</Label>
                          <Select
                            value={formData.tipoVenta}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, tipoVenta: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CONTADO">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Contado
                                </div>
                              </SelectItem>
                              <SelectItem value="CUOTAS">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  Cuotas
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Define si la venta será al contado o en cuotas
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="formaPago" className="text-sm font-medium">Método de Pago</Label>
                          <Select
                            value={formData.formaPago}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, formaPago: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                              <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                              <SelectItem value="CHEQUE">Cheque</SelectItem>
                              <SelectItem value="TARJETA">Tarjeta</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Método de pago preferido del cliente
                          </p>
                        </div>
                      </div>

                      {/* Mensaje indicativo cuando se selecciona cuotas */}
                      {formData.tipoVenta === 'CUOTAS' && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-900">Configuración de Cuotas Requerida</h4>
                              <p className="text-sm text-blue-700">
                                Has seleccionado venta en cuotas. La pestaña <strong>"Cuotas"</strong> ahora está disponible para configurar el plan de pagos. 
                                Completa la configuración financiera y luego ve a la pestaña de cuotas.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Paso 3: Comisiones del Vendedor */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                        Comisiones del Vendedor
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Configura la comisión para el vendedor asignado
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="comisionVendedor" className="text-sm font-medium">Monto de Comisión</Label>
                          <Input
                            type="number"
                            value={formData.comisionVendedor}
                            onChange={(e) => {
                              const valor = e.target.value
                              setFormData(prev => ({ ...prev, comisionVendedor: valor }))
                              calcularPorcentajeDesdeMonto(valor)
                            }}
                            placeholder="0.00"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Ingresa el monto de comisión o usa el porcentaje
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="porcentajeComision" className="text-sm font-medium">Porcentaje de Comisión</Label>
                          <Input
                            type="number"
                            value={formData.porcentajeComision}
                            onChange={(e) => {
                              const valor = e.target.value
                              setFormData(prev => ({ ...prev, porcentajeComision: valor }))
                              calcularMontoDesdePorcentaje(valor)
                            }}
                            placeholder="0.00"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Ingresa el porcentaje o usa el monto de comisión
                          </p>
                        </div>
                      </div>
                      
                      {(parseFloat(formData.comisionVendedor) > 0 || parseFloat(formData.porcentajeComision) > 0) && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-blue-900">Comisión Configurada</h4>
                              <p className="text-sm text-blue-700">
                                {parseFloat(formData.comisionVendedor) > 0 && (
                                  <span>{formatCurrency(parseFloat(formData.comisionVendedor))}</span>
                                )}
                                {parseFloat(formData.comisionVendedor) > 0 && parseFloat(formData.porcentajeComision) > 0 && (
                                  <span> • </span>
                                )}
                                {parseFloat(formData.porcentajeComision) > 0 && (
                                  <span>{formData.porcentajeComision}%</span>
                                )}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Paso 4: Información Adicional */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">4</div>
                        Información Adicional
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Documenta motivos de descuento y condiciones especiales
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="motivoDescuento" className="text-sm font-medium">Motivo del Descuento</Label>
                        <Input
                          value={formData.motivoDescuento}
                          onChange={(e) => setFormData(prev => ({ ...prev, motivoDescuento: e.target.value }))}
                          placeholder="Ej: Descuento por pago al contado, cliente frecuente, etc."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Documenta el motivo del descuento aplicado
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Resumen Financiero */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Resumen Financiero
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-600">Precio Original:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(formData.precioOriginal) || 0)}</span>
                        </div>
                        {parseFloat(formData.montoDescuento) > 0 && (
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-600">Descuento:</span>
                            <span className="font-medium text-red-600">-{formatCurrency(parseFloat(formData.montoDescuento) || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm font-medium">Precio de Venta:</span>
                          <span className="font-bold text-lg">{formatCurrency(parseFloat(formData.precioVenta) || 0)}</span>
                        </div>
                        {parseFloat(formData.comisionVendedor) > 0 && (
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-gray-600">Comisión Vendedor:</span>
                            <span className="font-medium text-blue-600">{formatCurrency(parseFloat(formData.comisionVendedor) || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
                          <span className="text-sm font-medium">Tipo de Venta:</span>
                          <Badge variant={formData.tipoVenta === 'CONTADO' ? 'default' : 'secondary'}>
                            {formData.tipoVenta === 'CONTADO' ? 'Al Contado' : 'En Cuotas'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Cuotas */}
              <TabsContent value="cuotas" className="space-y-6">
                {formData.tipoVenta === 'CUOTAS' ? (
                  <div className="space-y-6">
                    {/* Paso 1: Configuración básica */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                          Configuración Básica
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="montoInicial" className="text-sm font-medium">Monto Inicial</Label>
                            <Input
                              type="number"
                              value={formData.montoInicial}
                              onChange={(e) => setFormData(prev => ({ ...prev, montoInicial: e.target.value }))}
                              placeholder="0.00"
                              className={!validaciones.montoInicial.valido ? 'border-red-500' : ''}
                            />
                            {!validaciones.montoInicial.valido && (
                              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {validaciones.montoInicial.mensaje}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Pago inicial que se descuenta del precio total
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="saldoPendiente" className="text-sm font-medium">Saldo a Financiar</Label>
                            <Input
                              type="number"
                              value={formData.saldoPendiente}
                              placeholder="0.00"
                              readOnly
                              className={`bg-gray-50 ${!validaciones.saldoPendiente.valido ? 'border-red-500' : ''}`}
                            />
                            {!validaciones.saldoPendiente.valido && (
                              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {validaciones.saldoPendiente.mensaje}
                              </p>
                            )}
                            {validaciones.saldoPendiente.valido && parseFloat(formData.saldoPendiente) > 0 && (
                              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Saldo calculado correctamente
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Monto restante que se pagará en cuotas
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Paso 2: Tipo de cuotas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">2</div>
                          Tipo de Cuotas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={modoCuotasPersonalizadas}
                              onCheckedChange={setModoCuotasPersonalizadas}
                              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
                            />
                            <div>
                              <Label className="text-sm font-medium">Cuotas Personalizadas</Label>
                              <p className="text-xs text-gray-500">
                                Define montos y fechas específicas para cada cuota
                              </p>
                            </div>
                          </div>
                          {modoCuotasPersonalizadas ? (
                            <Button type="button" onClick={agregarCuotaPersonalizada} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar Cuota
                            </Button>
                          ) : (
                            <Button type="button" size="sm" disabled className="bg-gray-600 text-gray-300 cursor-not-allowed">
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar Cuota
                            </Button>
                          )}
                        </div>

                        {modoCuotasPersonalizadas && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Cuotas Personalizadas</Label>
                              <Badge variant="secondary">{cuotasPersonalizadas.length} cuotas</Badge>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {cuotasPersonalizadas.map((cuota, index) => (
                                <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex-1">
                                    <Label className="text-xs text-gray-600">Cuota {index + 1}</Label>
                                    <Input
                                      type="number"
                                      placeholder="Monto"
                                      value={cuota.monto}
                                      onChange={(e) => actualizarCuotaPersonalizada(index, 'monto', parseFloat(e.target.value) || 0)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label className="text-xs text-gray-600">Fecha</Label>
                                    <Input
                                      type="date"
                                      value={cuota.fecha}
                                      onChange={(e) => actualizarCuotaPersonalizada(index, 'fecha', e.target.value)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removerCuotaPersonalizada(index)}
                                    className="mt-6"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Paso 3: Configuración de cuotas regulares */}
                    {!modoCuotasPersonalizadas && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">3</div>
                            Configuración de Cuotas Regulares
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="numeroCuotas" className="text-sm font-medium">Número de Cuotas</Label>
                              <Input
                                type="number"
                                value={formData.numeroCuotas}
                                onChange={(e) => setFormData(prev => ({ ...prev, numeroCuotas: e.target.value }))}
                                placeholder="12"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Cantidad de cuotas a pagar
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="frecuenciaCuota" className="text-sm font-medium">Frecuencia</Label>
                              <Select
                                value={formData.frecuenciaCuota}
                                onValueChange={(value) => {
                                  setFormData(prev => ({ ...prev, frecuenciaCuota: value }))
                                  // Si se selecciona PERSONALIZADA, activar modo de cuotas personalizadas
                                  if (value === 'PERSONALIZADA') {
                                    setModoCuotasPersonalizadas(true)
                                  } else {
                                    setModoCuotasPersonalizadas(false)
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MENSUAL">Mensual</SelectItem>
                                  <SelectItem value="BIMESTRAL">Bimestral</SelectItem>
                                  <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                                  <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                                  <SelectItem value="ANUAL">Anual</SelectItem>
                                  <SelectItem value="PERSONALIZADA">Personalizada</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500 mt-1">
                                Intervalo entre cuotas
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="fechaPrimeraCuota" className="text-sm font-medium">Fecha Primera Cuota</Label>
                              <Input
                                type="date"
                                value={formData.fechaPrimeraCuota}
                                onChange={(e) => setFormData(prev => ({ ...prev, fechaPrimeraCuota: e.target.value }))}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Fecha de vencimiento inicial
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Paso 4: Resumen de cuotas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">4</div>
                          Resumen de Cuotas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {modoCuotasPersonalizadas ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-blue-900">Cuotas Personalizadas</p>
                                <p className="text-xs text-blue-700">{cuotasPersonalizadas.length} cuotas configuradas</p>
                              </div>
                              <Badge variant="outline" className="text-blue-600">
                                Personalizado
                              </Badge>
                            </div>
                            
                            {/* Resumen financiero de cuotas personalizadas */}
                            {(() => {
                              const saldoPendiente = parseFloat(formData.saldoPendiente) || 0
                              const totalCuotas = cuotasPersonalizadas.reduce((sum, cuota) => sum + cuota.monto, 0)
                              const diferencia = saldoPendiente - totalCuotas
                              const porcentajeCompletado = saldoPendiente > 0 ? (totalCuotas / saldoPendiente) * 100 : 0
                              
                              return (
                                <div className="space-y-3">
                                  {/* Barra de progreso */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Progreso del plan de pagos:</span>
                                      <span className="font-medium">{porcentajeCompletado.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                          porcentajeCompletado >= 100 ? 'bg-green-500' : 
                                          porcentajeCompletado >= 80 ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${Math.min(porcentajeCompletado, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  {/* Resumen de montos */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="p-3 bg-gray-50 border rounded-lg">
                                      <p className="text-xs text-gray-600">Saldo a Financiar</p>
                                      <p className="text-lg font-bold text-gray-900">{formatCurrency(saldoPendiente)}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <p className="text-xs text-blue-600">Total Cuotas</p>
                                      <p className="text-lg font-bold text-blue-900">{formatCurrency(totalCuotas)}</p>
                                    </div>
                                    <div className={`p-3 border rounded-lg ${
                                      diferencia === 0 ? 'bg-green-50 border-green-200' :
                                      diferencia > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
                                    }`}>
                                      <p className={`text-xs ${
                                        diferencia === 0 ? 'text-green-600' :
                                        diferencia > 0 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {diferencia === 0 ? 'Balance Perfecto' :
                                         diferencia > 0 ? 'Falta por Asignar' : 'Exceso en Cuotas'}
                                      </p>
                                      <p className={`text-lg font-bold ${
                                        diferencia === 0 ? 'text-green-900' :
                                        diferencia > 0 ? 'text-yellow-900' : 'text-red-900'
                                      }`}>
                                        {formatCurrency(Math.abs(diferencia))}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Mensaje de estado */}
                                  {diferencia !== 0 && (
                                    <div className={`p-3 rounded-lg border ${
                                      diferencia > 0 
                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                                        : 'bg-red-50 border-red-200 text-red-800'
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        {diferencia > 0 ? (
                                          <AlertCircle className="h-4 w-4" />
                                        ) : (
                                          <X className="h-4 w-4" />
                                        )}
                                        <span className="text-sm font-medium">
                                          {diferencia > 0 
                                            ? `Faltan ${formatCurrency(diferencia)} para completar el plan de pagos`
                                            : `Las cuotas exceden el saldo pendiente en ${formatCurrency(Math.abs(diferencia))}`
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {diferencia === 0 && cuotasPersonalizadas.length > 0 && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">
                                          Plan de pagos completo y balanceado
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                            
                            {/* Lista de cuotas */}
                            {cuotasPersonalizadas.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Detalle de Cuotas</Label>
                                  <Badge variant="outline" className="text-xs">
                                    {cuotasPersonalizadas.length} cuotas
                                  </Badge>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                  {cuotasPersonalizadas.map((cuota, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Cuota {index + 1}</span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(cuota.fecha).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <span className="text-sm font-bold text-gray-900">{formatCurrency(cuota.monto)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-green-900">Cuotas Regulares</p>
                                <p className="text-xs text-green-700">{formData.numeroCuotas} cuotas {formData.frecuenciaCuota.toLowerCase()}es</p>
                              </div>
                              <Badge variant="outline" className="text-green-600">
                                Automático
                              </Badge>
                            </div>
                            
                            {/* Resumen financiero de cuotas regulares */}
                            {(() => {
                              const saldoPendiente = parseFloat(formData.saldoPendiente) || 0
                              const montosCuotas = calcularMontosCuotasRegulares()
                              const totalCuotas = montosCuotas.reduce((sum, monto) => sum + monto, 0)
                              const diferencia = saldoPendiente - totalCuotas
                              const porcentajeCompletado = saldoPendiente > 0 ? (totalCuotas / saldoPendiente) * 100 : 0
                              
                              return (
                                <div className="space-y-3">
                                  {/* Barra de progreso */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Progreso del plan de pagos:</span>
                                      <span className="font-medium">{porcentajeCompletado.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="h-2 rounded-full transition-all duration-300 bg-green-500"
                                        style={{ width: `${Math.min(porcentajeCompletado, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  {/* Resumen de montos */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="p-3 bg-gray-50 border rounded-lg">
                                      <p className="text-xs text-gray-600">Saldo a Financiar</p>
                                      <p className="text-lg font-bold text-gray-900">{formatCurrency(saldoPendiente)}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <p className="text-xs text-green-600">Total Cuotas</p>
                                      <p className="text-lg font-bold text-green-900">{formatCurrency(totalCuotas)}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <p className="text-xs text-green-600">Detalle de Cuotas</p>
                                      <p className="text-sm font-medium text-green-900 leading-tight">
                                        {(() => {
                                          const saldoFinanciar = parseFloat(formData.saldoPendiente) || 0
                                          const numeroCuotas = parseInt(formData.numeroCuotas) || 1
                                          const montoCuotaDecimal = saldoFinanciar / numeroCuotas
                                          const cuotaEntera = Math.floor(montoCuotaDecimal)
                                          const diferencia = saldoFinanciar - (cuotaEntera * numeroCuotas)
                                          if (diferencia > 0) {
                                            const ultimaCuota = cuotaEntera + diferencia
                                            return `${numeroCuotas - 1} cuotas de ${formatCurrency(cuotaEntera)} + 1 cuota de ${formatCurrency(ultimaCuota)}`
                                          } else {
                                            return `${numeroCuotas} cuotas de ${formatCurrency(cuotaEntera)}`
                                          }
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {diferencia === 0 && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-800">
                                          Plan de pagos completo y balanceado
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                            
                            {/* Configuración de monto por cuota */}
                           
                            {/* Lista de cuotas regulares */}
                            {formData.numeroCuotas && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium">Lista de Cuotas</Label>
                                  <Badge variant="outline" className="text-xs">
                                    {formData.numeroCuotas} cuotas
                                  </Badge>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                  {(() => {
                                    const fechas = calcularFechasCuotasRegulares()
                                    const montos = calcularMontosCuotasRegulares()
                                    
                                    // Debug: mostrar información si no hay fechas
                                    if (fechas.length === 0) {
                                      return (
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                          <p className="text-sm text-yellow-800">
                                            Para ver la lista de cuotas, selecciona una fecha de primera cuota.
                                          </p>
                                          <p className="text-xs text-yellow-600 mt-1">
                                            Fecha primera cuota: {formData.fechaPrimeraCuota || 'No seleccionada'}
                                          </p>
                                        </div>
                                      )
                                    }
                                    
                                    return fechas.map((fecha, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">Cuota {index + 1}</span>
                                          <span className="text-xs text-gray-500">
                                            {new Date(fecha).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(montos[index] || 0)}</span>
                                      </div>
                                    ))
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Venta al Contado</h3>
                      <p className="text-gray-600">
                        Esta venta se realizará al contado. No se requieren configuraciones de cuotas.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab: Comprobantes */}
              <TabsContent value="comprobantes" className="space-y-6">
                <div className="max-h-[50vh] overflow-y-auto pr-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Comprobantes de Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium mb-2 text-blue-900">Información Importante</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          Para cada pago realizado, es obligatorio adjuntar un comprobante de pago (voucher, transferencia, etc.).
                        </p>
                        <div className="space-y-2 text-sm text-blue-700">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Venta al contado: 1 comprobante por el monto total</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Venta en cuotas: 1 comprobante por el pago inicial + 1 por cada cuota vencida</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Formatos permitidos: PDF, JPG, PNG (máximo 5MB)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <Label className="text-sm font-medium">Generar Comprobantes Automáticamente</Label>
                            <p className="text-xs text-gray-500">
                              Crea automáticamente los comprobantes necesarios según el tipo de venta
                            </p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          onClick={generarComprobantesAutomaticos} 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Generar Comprobantes
                        </Button>
                      </div>

                      {comprobantesPago.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2 text-gray-600">No hay comprobantes</h3>
                          <p className="text-gray-500 mb-4">
                            Haz clic en "Generar Comprobantes" para crear los comprobantes necesarios automáticamente.
                          </p>
                          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium mb-1">Nota importante:</p>
                            <p>Si tu venta no tiene pagos iniciales o cuotas vencidas con montos mayores a cero, no se requieren comprobantes de pago. Los comprobantes para cuotas futuras se generarán automáticamente cuando venzan.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Comprobantes de Pago</Label>
                            <Badge variant="secondary">{comprobantesPago.length} comprobantes</Badge>
                          </div>
                          
                          {comprobantesPago.map((comprobante) => (
                            <div key={comprobante.id} className="p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <Badge variant="outline" className="text-xs">
                                    {comprobante.tipo}
                                  </Badge>
                                  <span className="ml-2 text-sm font-medium">
                                    {formatCurrency(comprobante.monto)}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removerComprobantePago(comprobante.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">Comprobante de Pago</Label>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleFileUpload(comprobante.id, file)
                                    }
                                  }}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Documentación */}
              <TabsContent value="documentacion" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Estado de Documentación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="estadoDocumentacion">Estado de Documentación</Label>
                        <Select
                          value={formData.estadoDocumentacion}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, estadoDocumentacion: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                            <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                            <SelectItem value="COMPLETA">Completa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="documentosRequeridos">Documentos Requeridos</Label>
                        <Textarea
                          value={formData.documentosRequeridos}
                          onChange={(e) => setFormData(prev => ({ ...prev, documentosRequeridos: e.target.value }))}
                          placeholder="Lista de documentos requeridos"
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Observaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="condicionesEspeciales">Condiciones Especiales</Label>
                        <Textarea
                          value={formData.condicionesEspeciales}
                          onChange={(e) => setFormData(prev => ({ ...prev, condicionesEspeciales: e.target.value }))}
                          placeholder="Condiciones especiales de la venta"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="observaciones">Observaciones Generales</Label>
                        <Textarea
                          value={formData.observaciones}
                          onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                          placeholder="Observaciones adicionales"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Botones de acción fijos en la parte inferior */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 -mx-6 px-6">
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="px-6">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || !isFormValid()} className="px-6">
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Crear Venta
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 