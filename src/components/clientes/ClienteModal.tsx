'use client'

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Cliente, TIPO_CLIENTE, ClienteFormData, CreateClienteData, TipoDireccion, EstadoCivil, Sexo } from '@/types/cliente'
import { FiUser, FiHome, FiInfo, FiTrash2, FiPlus } from 'react-icons/fi'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import React from 'react'

const formSchema = z.object({
  tipo: z.nativeEnum(TIPO_CLIENTE),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  sexo: z.nativeEnum(Sexo).nullable().optional(),
  dni: z.string().optional(),
  fechaNacimiento: z.date().nullable().optional(),
  estadoCivil: z.nativeEnum(EstadoCivil).nullable().optional(),
  ocupacion: z.string().optional(),
  // Campos para empresa
  razonSocial: z.string().optional(),
  ruc: z.string().optional().refine((val) => {
    if (!val) return true; // Permitir vacío
    if (val.length !== 11) return false; // Debe tener 11 dígitos
    return /^(10|20)/.test(val); // Debe comenzar con 10 o 20
  }, {
    message: "El RUC debe tener 11 dígitos y comenzar con 10 (personas naturales) o 20 (empresas)"
  }),
  representanteLegal: z.string().optional(),
  cargoRepresentante: z.string().optional(),
  direcciones: z.array(z.object({
    tipo: z.nativeEnum(TipoDireccion),
    pais: z.string().min(1, "El país es obligatorio"),
    ciudad: z.string().min(1, "La ciudad es obligatoria"),
    direccion: z.string().min(1, "La dirección es obligatoria"),
    referencia: z.string().optional()
  })).min(1, "Debe agregar al menos una dirección")
}).refine((data) => {
  // Validaciones específicas por tipo de cliente
  if (data.tipo === TIPO_CLIENTE.EMPRESA) {
    return !!data.ruc && data.ruc.length === 11 && /^(10|20)/.test(data.ruc);
  }
  return true;
}, {
  message: "El RUC es obligatorio para empresas y debe tener 11 dígitos comenzando con 10 o 20",
  path: ["ruc"]
}).refine((data) => {
  // Validaciones para clientes individuales
  if (data.tipo === TIPO_CLIENTE.INDIVIDUAL) {
    return !!data.nombre && !!data.apellido && !!data.dni;
  }
  return true;
}, {
  message: "Para clientes individuales, nombre, apellido y DNI son obligatorios",
  path: ["nombre"]
});

type FormValues = z.infer<typeof formSchema>

interface ClienteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Cliente
  onSubmit: (data: CreateClienteData) => Promise<void>
  submitLabel?: string
}

export function ClienteModal({ open, onOpenChange, initialData, onSubmit, submitLabel = "Crear" }: ClienteModalProps) {
  const [isMounted, setIsMounted] = React.useState(false)
  const [tipo, setTipo] = useState<TIPO_CLIENTE>(initialData?.tipo || TIPO_CLIENTE.INDIVIDUAL)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      tipo: initialData.tipo,
      email: initialData.email || '',
      telefono: initialData.telefono || '',
      nombre: initialData.nombre || '',
      apellido: initialData.apellido || '',
      sexo: initialData.sexo,
      dni: initialData.dni || '',
      fechaNacimiento: initialData.fechaNacimiento ? new Date(initialData.fechaNacimiento) : undefined,
      estadoCivil: initialData.estadoCivil,
      ocupacion: initialData.ocupacion || '',
      razonSocial: initialData.razonSocial || '',
      ruc: initialData.ruc || '',
      representanteLegal: initialData.representanteLegal || '',
      cargoRepresentante: initialData.cargoRepresentante || '',
      direcciones: initialData.direcciones?.length ? initialData.direcciones.map(dir => ({
        tipo: dir.tipo,
        pais: dir.pais || 'Perú',
        ciudad: dir.ciudad || '',
        direccion: dir.direccion || '',
        referencia: dir.referencia || ''
      })) : [{
        tipo: TipoDireccion.NACIONAL,
        pais: 'Perú',
        ciudad: '',
        direccion: '',
        referencia: ''
      }]
    } : {
      tipo: TIPO_CLIENTE.INDIVIDUAL,
      email: '',
      telefono: '',
      nombre: '',
      apellido: '',
      sexo: undefined,
      dni: '',
      fechaNacimiento: undefined,
      estadoCivil: undefined,
      ocupacion: '',
      razonSocial: '',
      ruc: '',
      representanteLegal: '',
      cargoRepresentante: '',
      direcciones: [{
        tipo: TipoDireccion.NACIONAL,
        pais: 'Perú',
        ciudad: '',
        direccion: '',
        referencia: ''
      }]
    }
  })

  useEffect(() => {
    if (open && initialData) {
      console.log('Cargando datos del cliente:', initialData);
      
      // Asegurarnos de que todos los campos tengan valores por defecto
      const formData = {
        tipo: initialData.tipo,
        email: initialData.email || '',
        telefono: initialData.telefono || '',
        nombre: initialData.nombre || '',
        apellido: initialData.apellido || '',
        sexo: initialData.sexo,
        dni: initialData.dni || '',
        fechaNacimiento: initialData.fechaNacimiento ? new Date(initialData.fechaNacimiento) : undefined,
        estadoCivil: initialData.estadoCivil,
        ocupacion: initialData.ocupacion || '',
        razonSocial: initialData.razonSocial || '',
        ruc: initialData.ruc || '',
        representanteLegal: initialData.representanteLegal || '',
        cargoRepresentante: initialData.cargoRepresentante || '',
        direcciones: initialData.direcciones?.length ? initialData.direcciones.map(dir => ({
          tipo: dir.tipo,
          pais: dir.pais || 'Perú',
          ciudad: dir.ciudad || '',
          direccion: dir.direccion || '',
          referencia: dir.referencia || ''
        })) : [{
          tipo: TipoDireccion.NACIONAL,
          pais: 'Perú',
          ciudad: '',
          direccion: '',
          referencia: ''
        }]
      };

      console.log('Datos formateados para el formulario:', formData);
      
      // Resetear el formulario con los datos
      form.reset(formData);

      // Forzar la actualización de los campos
      Object.keys(formData).forEach(key => {
        form.setValue(key as keyof FormValues, formData[key as keyof typeof formData], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
      });
    }
  }, [open, initialData, form])

  const handleSubmit = async (data: FormValues) => {
    try {
      console.log('Datos a enviar:', data);
      
      // Limpiar campos no utilizados según el tipo de cliente
      const formData = {
        ...data,
        sexo: data.tipo === TIPO_CLIENTE.INDIVIDUAL ? data.sexo : null,
        estadoCivil: data.tipo === TIPO_CLIENTE.INDIVIDUAL ? data.estadoCivil : null,
        fechaNacimiento: data.tipo === TIPO_CLIENTE.INDIVIDUAL ? data.fechaNacimiento : null,
        nombre: data.tipo === TIPO_CLIENTE.INDIVIDUAL ? data.nombre : '',
        apellido: data.tipo === TIPO_CLIENTE.INDIVIDUAL ? data.apellido : '',
        dni: data.tipo === TIPO_CLIENTE.INDIVIDUAL ? data.dni : '',
        ocupacion: data.tipo === TIPO_CLIENTE.INDIVIDUAL ? data.ocupacion : '',
        razonSocial: data.tipo === TIPO_CLIENTE.EMPRESA ? data.razonSocial : '',
        ruc: data.tipo === TIPO_CLIENTE.EMPRESA ? data.ruc : '',
        representanteLegal: data.tipo === TIPO_CLIENTE.EMPRESA ? data.representanteLegal : '',
        cargoRepresentante: data.tipo === TIPO_CLIENTE.EMPRESA ? data.cargoRepresentante : ''
      };

      console.log('Datos formateados para enviar:', formData);
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      toast.error('Error al guardar el cliente');
    }
  }

  const handleTipoChange = (value: TIPO_CLIENTE) => {
    const currentValues = form.getValues()
    const newValues = {
      tipo: value,
      email: currentValues.email,
      telefono: currentValues.telefono,
      nombre: value === TIPO_CLIENTE.INDIVIDUAL ? currentValues.nombre : '',
      apellido: value === TIPO_CLIENTE.INDIVIDUAL ? currentValues.apellido : '',
      sexo: value === TIPO_CLIENTE.INDIVIDUAL ? currentValues.sexo : undefined,
      dni: value === TIPO_CLIENTE.INDIVIDUAL ? currentValues.dni : '',
      fechaNacimiento: value === TIPO_CLIENTE.INDIVIDUAL ? currentValues.fechaNacimiento : undefined,
      estadoCivil: value === TIPO_CLIENTE.INDIVIDUAL ? currentValues.estadoCivil : undefined,
      ocupacion: value === TIPO_CLIENTE.INDIVIDUAL ? currentValues.ocupacion : '',
      razonSocial: value === TIPO_CLIENTE.EMPRESA ? currentValues.razonSocial : '',
      ruc: value === TIPO_CLIENTE.EMPRESA ? currentValues.ruc : '',
      representanteLegal: value === TIPO_CLIENTE.EMPRESA ? currentValues.representanteLegal : '',
      cargoRepresentante: value === TIPO_CLIENTE.EMPRESA ? currentValues.cargoRepresentante : '',
      direcciones: currentValues.direcciones
    }
    form.reset(newValues)
    setTipo(value)
  }

  // Agregar un efecto para monitorear los errores del formulario
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        const fieldValue = name.includes('.') 
          ? name.split('.').reduce((obj, key) => obj?.[key], value)
          : value[name as keyof typeof value];
        console.log('Campo cambiado:', name, 'Valor:', fieldValue);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Mantener solo el efecto que actualiza el tipo cuando cambia
  useEffect(() => {
    if (open && initialData) {
      setTipo(initialData.tipo);
    }
  }, [open, initialData]);

  const addDireccion = () => {
    const currentDirecciones = form.getValues('direcciones') || [];
    const newDireccion = {
      tipo: TipoDireccion.NACIONAL,
      pais: 'Perú',
      ciudad: '',
      direccion: '',
      referencia: ''
    };
    
    form.setValue('direcciones', [...currentDirecciones, newDireccion], {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  if (!isMounted) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-blue-600">
            {initialData ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {initialData 
              ? 'Modifique los datos del cliente según sea necesario.'
              : 'Complete el formulario para registrar un nuevo cliente.'}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form 
            onSubmit={(e) => {
              console.log('Form submit iniciado');
              console.log('Errores del formulario:', form.formState.errors);
              form.handleSubmit(handleSubmit)(e);
            }} 
            className="space-y-6"
          >
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <div className="space-y-4">
                  {initialData ? (
                    <div className="space-y-2">
                      <FormLabel className="text-base font-medium text-blue-700">Tipo de Cliente</FormLabel>
                      <div className="flex items-center gap-2">
                        <Badge variant={tipo === TIPO_CLIENTE.INDIVIDUAL ? 'default' : 'secondary'} className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                          {tipo === TIPO_CLIENTE.INDIVIDUAL ? 'Persona Natural' : 'Empresa'}
                        </Badge>
                        <div className="text-sm text-gray-500">
                          (El tipo de cliente no puede ser modificado)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-base font-medium text-blue-700">Tipo de Cliente</Label>
                      <RadioGroup
                        value={tipo}
                        onValueChange={handleTipoChange}
                        className="flex flex-row space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={TIPO_CLIENTE.INDIVIDUAL} id="individual" className="text-blue-600" />
                          <Label htmlFor="individual" className="text-base text-gray-700">Persona Natural</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value={TIPO_CLIENTE.EMPRESA} id="empresa" className="text-blue-600" />
                          <Label htmlFor="empresa" className="text-base text-gray-700">Empresa</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  {!initialData && (
                    <div className="flex items-start gap-2 mt-2 text-sm text-gray-600 bg-white p-4 rounded-md border border-blue-100">
                      <FiInfo className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                      <div>
                        <p className="font-medium mb-1 text-blue-700">Información sobre tipos de cliente:</p>
                        <p><strong>Persona Natural:</strong> Persona física que compra/vende propiedades por su cuenta.</p>
                        <p><strong>Empresa:</strong> Compañía o negocio que compra/vende propiedades (ej: constructora, inmobiliaria).</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-base font-medium mb-4 text-blue-700">Información de Contacto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-700">Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-700">Teléfono</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Permitir + al inicio y números
                              if (/^\+?\d*$/.test(value)) {
                                field.onChange(value);
                              }
                            }}
                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {tipo === TIPO_CLIENTE.INDIVIDUAL ? (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <h3 className="text-base font-medium mb-4 text-blue-700">Información Personal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="apellido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Apellido</FormLabel>
                          <FormControl>
                            <Input {...field} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sexo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Sexo</FormLabel>
                          <Select
                            onValueChange={(value: Sexo) => {
                              console.log('Selected sexo:', value) // Para depuración
                              field.onChange(value)
                            }}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Seleccione sexo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={Sexo.MASCULINO}>Masculino</SelectItem>
                              <SelectItem value={Sexo.FEMENINO}>Femenino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dni"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">DNI</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Solo permitir números y máximo 8 dígitos
                                if (/^\d{0,8}$/.test(value)) {
                                  field.onChange(value);
                                }
                              }}
                              className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fechaNacimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Nacimiento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value instanceof Date && !isNaN(field.value.getTime()) 
                                ? field.value.toISOString().split('T')[0] 
                                : ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value) {
                                  const date = new Date(value);
                                  if (!isNaN(date.getTime())) {
                                    field.onChange(date);
                                  }
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estadoCivil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Estado Civil</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                            defaultValue={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Seleccione estado civil" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={EstadoCivil.SOLTERO}>Soltero</SelectItem>
                              <SelectItem value={EstadoCivil.CASADO}>Casado</SelectItem>
                              <SelectItem value={EstadoCivil.DIVORCIADO}>Divorciado</SelectItem>
                              <SelectItem value={EstadoCivil.VIUDO}>Viudo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ocupacion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Ocupación</FormLabel>
                          <FormControl>
                            <Input {...field} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <h3 className="text-base font-medium mb-4 text-blue-700">Información Empresarial</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="razonSocial"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-blue-700">Razón Social</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ruc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">RUC</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Solo permitir números y máximo 11 dígitos
                                if (/^\d{0,11}$/.test(value)) {
                                  field.onChange(value);
                                }
                              }}
                              className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="representanteLegal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Representante Legal</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargoRepresentante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-700">Cargo del Representante</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-base font-medium mb-4 text-blue-700">Direcciones</h3>
                <div className="space-y-4">
                  {form.watch('direcciones').map((_, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-blue-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Dirección {index + 1}</h4>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const direcciones = form.getValues('direcciones')
                              form.setValue('direcciones', direcciones.filter((_, i) => i !== index))
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <FiTrash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`direcciones.${index}.tipo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-700">Tipo de Dirección</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  if (value === TipoDireccion.NACIONAL) {
                                    form.setValue(`direcciones.${index}.pais`, 'Perú');
                                  } else {
                                    form.setValue(`direcciones.${index}.pais`, '');
                                  }
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                                    <SelectValue placeholder="Seleccione el tipo de dirección" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={TipoDireccion.NACIONAL}>Nacional</SelectItem>
                                  <SelectItem value={TipoDireccion.EXTRANJERA}>Extranjera</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {form.watch(`direcciones.${index}.tipo`) === TipoDireccion.NACIONAL ? (
                          <div className="text-sm text-gray-500 mt-2">
                            Para direcciones nacionales, el país se establecerá automáticamente como Perú.
                          </div>
                        ) : (
                          <FormField
                            control={form.control}
                            name={`direcciones.${index}.pais`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-blue-700">País</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ''}
                                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={form.control}
                          name={`direcciones.${index}.ciudad`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-700">Ciudad</FormLabel>
                              <FormControl>
                                <Input {...field} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`direcciones.${index}.direccion`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-700">Dirección</FormLabel>
                              <FormControl>
                                <Input {...field} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`direcciones.${index}.referencia`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-blue-700">Referencia (opcional)</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} className="border-blue-200 focus:border-blue-500 focus:ring-blue-500" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addDireccion}
                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <FiPlus className="h-4 w-4 mr-2" />
                    Agregar Dirección
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    console.log('Botón crear clickeado');
                    console.log('Valores actuales del formulario:', form.getValues());
                  }}
                >
                  {initialData ? 'Guardar Cambios' : 'Crear Cliente'}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
} 