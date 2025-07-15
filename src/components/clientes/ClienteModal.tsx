'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { FiUser, FiBriefcase } from 'react-icons/fi'
import { Cliente, TIPO_CLIENTE } from '@/types/cliente'

interface ClienteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  initialData?: Cliente
  submitLabel?: string
}

export default function ClienteModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData, 
  submitLabel = 'Crear Cliente' 
}: ClienteModalProps) {
  const [tipoCliente, setTipoCliente] = useState<'INDIVIDUAL' | 'EMPRESA'>('INDIVIDUAL')
  const [loading, setLoading] = useState(false)
  
  console.log('Estado inicial tipoCliente:', tipoCliente)
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
      email: '',
      telefono: '',
      dni: '',
      razonSocial: '',
      ruc: '',
      representanteLegal: '',
      cargoRepresentante: '',
    sexo: '',
    fechaNacimiento: '',
    estadoCivil: '',
  })
  const { toast } = useToast()

  // Debug: Monitorear cambios en tipoCliente
  useEffect(() => {
    console.log('tipoCliente cambió a:', tipoCliente)
  }, [tipoCliente])

  // Cargar datos iniciales si se está editando
  useEffect(() => {
    if (initialData) {
      setTipoCliente(initialData.tipoCliente)
      setFormData({
        nombre: initialData.nombre || '',
        apellido: initialData.apellido || '',
        email: initialData.email || '',
        telefono: initialData.telefono || '',
        dni: initialData.dni || '',
        razonSocial: initialData.razonSocial || '',
        ruc: initialData.ruc || '',
        representanteLegal: initialData.representanteLegal || '',
        cargoRepresentante: initialData.cargoRepresentante || '',
        sexo: initialData.sexo || '',
        fechaNacimiento: initialData.fechaNacimiento ? (typeof initialData.fechaNacimiento === 'string' ? initialData.fechaNacimiento : initialData.fechaNacimiento.toISOString().substring(0, 10)) : '',
        estadoCivil: initialData.estadoCivil || '',
      })
    } else {
      // Resetear formulario si es nuevo cliente
      setTipoCliente('INDIVIDUAL')
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        dni: '',
        razonSocial: '',
        ruc: '',
        representanteLegal: '',
        cargoRepresentante: '',
        sexo: '',
        fechaNacimiento: '',
        estadoCivil: '',
      })
    }
  }, [initialData, open])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const data = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        dni: formData.dni,
        razonSocial: formData.razonSocial,
        ruc: formData.ruc,
        representanteLegal: formData.representanteLegal,
        cargoRepresentante: formData.cargoRepresentante,
        tipoCliente: tipoCliente,
        direcciones: initialData?.direcciones || [{
          tipo: 'NACIONAL',
          pais: 'Peru',
          ciudad: 'Lima',
          direccion: 'Direccion temporal',
          referencia: ''
        }],
        sexo: formData.sexo,
        fechaNacimiento: formData.fechaNacimiento,
        estadoCivil: formData.estadoCivil,
      }
      
      console.log('Datos a enviar:', data)
      console.log('Tipo de cliente seleccionado:', tipoCliente)
      
      await onSubmit(data)

      onOpenChange(false)
      if (!initialData) {
        // Solo resetear si es nuevo cliente
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          dni: '',
          razonSocial: '',
          ruc: '',
          representanteLegal: '',
          cargoRepresentante: '',
          sexo: '',
          fechaNacimiento: '',
          estadoCivil: '',
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al procesar cliente',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiUser className="w-5 h-5" />
            {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Cliente */}
          <div className="space-y-2">
            <Label>Tipo de Cliente *</Label>
            <Select
              value={tipoCliente}
              onValueChange={(value: 'INDIVIDUAL' | 'EMPRESA') => setTipoCliente(value)}
              disabled={!!initialData} // Deshabilitar si se está editando
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">
                      <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    Persona Natural
                        </div>
                </SelectItem>
                <SelectItem value="EMPRESA">
                  <div className="flex items-center gap-2">
                    <FiBriefcase className="w-4 h-4" />
                    Empresa
                      </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {initialData && (
              <p className="text-sm text-gray-500">
                Para cambiar el tipo de cliente, debe eliminar y recrear el cliente.
              </p>
                  )}
                </div>

          {/* Campos especificos segun tipo */}
          {tipoCliente === 'INDIVIDUAL' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  placeholder="Nombre"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Apellido *</Label>
                          <Input
                  value={formData.apellido}
                  onChange={(e) => handleInputChange('apellido', e.target.value)}
                  placeholder="Apellido"
                  required
                  />
                </div>

              <div className="space-y-2">
                <Label>DNI</Label>
                <Input
                  value={formData.dni}
                  onChange={(e) => handleInputChange('dni', e.target.value)}
                  placeholder="12345678"
                  maxLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label>Sexo</Label>
                          <Select
                  value={formData.sexo || ''}
                  onValueChange={(value) => handleInputChange('sexo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sexo" />
                              </SelectTrigger>
                            <SelectContent>
                    <SelectItem value="MASCULINO">Masculino</SelectItem>
                    <SelectItem value="FEMENINO">Femenino</SelectItem>
                            </SelectContent>
                          </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                            <Input
                              type="date"
                  value={formData.fechaNacimiento ? String(formData.fechaNacimiento).substring(0, 10) : ''}
                  onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Estado civil</Label>
                          <Select
                  value={formData.estadoCivil || ''}
                  onValueChange={(value) => handleInputChange('estadoCivil', value)}
                          >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estado civil" />
                              </SelectTrigger>
                            <SelectContent>
                    <SelectItem value="SOLTERO">Soltero</SelectItem>
                    <SelectItem value="CASADO">Casado</SelectItem>
                    <SelectItem value="DIVORCIADO">Divorciado</SelectItem>
                    <SelectItem value="VIUDO">Viudo</SelectItem>
                            </SelectContent>
                          </Select>
                  </div>
                </div>
              ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razon Social *</Label>
                <Input
                  value={formData.razonSocial}
                  onChange={(e) => handleInputChange('razonSocial', e.target.value)}
                  placeholder="Nombre de la empresa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>RUC</Label>
                            <Input
                  value={formData.ruc}
                  onChange={(e) => handleInputChange('ruc', e.target.value)}
                  placeholder="12345678901"
                  maxLength={11}
                />
              </div>

              <div className="space-y-2">
                <Label>Representante Legal *</Label>
                <Input
                  value={formData.representanteLegal}
                  onChange={(e) => handleInputChange('representanteLegal', e.target.value)}
                  placeholder="Nombre del representante"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Cargo del Representante</Label>
                <Input
                  value={formData.cargoRepresentante}
                  onChange={(e) => handleInputChange('cargoRepresentante', e.target.value)}
                  placeholder="Gerente General, Director, etc."
                    />
                  </div>
                </div>
              )}

          {/* Campos comunes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                type="email"
                placeholder="cliente@ejemplo.com"
              />
                          </div>

            <div className="space-y-2">
              <Label>Telefono</Label>
                                  <Input
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="+51 999 999 999"
              />
                </div>
              </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Procesando...' : submitLabel}
                </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  )
} 