'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { Cliente } from '@/types/cliente'
import { FiUser, FiHome, FiInfo } from 'react-icons/fi'
import { Badge } from '@/components/ui/badge'

const clienteSchema = z.object({
  tipo: z.enum(['INDIVIDUAL', 'EMPRESA']),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  // Campos para cliente individual
  dni: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  estadoCivil: z.enum(['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO']).optional(),
  ocupacion: z.string().optional(),
  // Campos para empresa
  razonSocial: z.string().optional(),
  ruc: z.string().optional(),
  representanteLegal: z.string().optional(),
  cargoRepresentante: z.string().optional(),
}).refine((data) => {
  if (data.tipo === 'INDIVIDUAL') {
    return !!data.nombre && !!data.apellido && !!data.dni
  }
  return !!data.razonSocial && !!data.ruc
}, {
  message: 'Por favor complete todos los campos requeridos según el tipo de cliente',
})

interface ClienteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Cliente
  onSubmit: (data: Partial<Cliente>) => Promise<void>
  submitLabel?: string
}

export function ClienteModal({ 
  open, 
  onOpenChange, 
  initialData, 
  onSubmit,
  submitLabel = 'Crear Cliente'
}: ClienteModalProps) {
  const [tipo, setTipo] = useState<'INDIVIDUAL' | 'EMPRESA'>(initialData?.tipo || 'INDIVIDUAL')

  const form = useForm<z.infer<typeof clienteSchema>>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo: initialData?.tipo || 'INDIVIDUAL',
      nombre: initialData?.nombre || '',
      apellido: initialData?.apellido || '',
      email: initialData?.email || '',
      telefono: initialData?.telefono || '',
      direccion: initialData?.direccion || '',
      dni: initialData?.dni || '',
      fechaNacimiento: initialData?.fechaNacimiento ? new Date(initialData.fechaNacimiento).toISOString().split('T')[0] : '',
      estadoCivil: initialData?.estadoCivil || undefined,
      ocupacion: initialData?.ocupacion || '',
      razonSocial: initialData?.razonSocial || '',
      ruc: initialData?.ruc || '',
      representanteLegal: initialData?.representanteLegal || '',
      cargoRepresentante: initialData?.cargoRepresentante || '',
    },
  })

  const handleSubmit = async (data: z.infer<typeof clienteSchema>) => {
    await onSubmit(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Modifique los datos del cliente según sea necesario.'
              : 'Complete el formulario para registrar un nuevo cliente.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                {initialData ? (
                  <div className="space-y-2">
                    <FormLabel>Tipo de Cliente</FormLabel>
                    <div className="flex items-center gap-2">
                      <Badge variant={tipo === 'INDIVIDUAL' ? 'default' : 'secondary'} className="bg-blue-50 text-blue-700">
                        {tipo === 'INDIVIDUAL' ? 'Persona Natural' : 'Empresa'}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        (El tipo de cliente no puede ser modificado)
                      </div>
                    </div>
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cliente</FormLabel>
                        <Select
                          onValueChange={(value: 'INDIVIDUAL' | 'EMPRESA') => {
                            field.onChange(value)
                            setTipo(value)
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione el tipo de cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INDIVIDUAL">
                              <div className="flex items-center gap-2">
                                <FiUser className="h-4 w-4" />
                                <span>Persona Natural</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="EMPRESA">
                              <div className="flex items-center gap-2">
                                <FiHome className="h-4 w-4" />
                                <span>Empresa</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {!initialData && (
                  <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
                    <FiInfo className="h-4 w-4 mt-0.5" />
                    <p>
                      <strong>Persona Natural:</strong> Persona física que compra/vende propiedades por su cuenta.
                      <br />
                      <strong>Empresa:</strong> Compañía o negocio que compra/vende propiedades (ej: constructora, inmobiliaria).
                    </p>
                  </div>
                )}
              </div>

              {tipo === 'INDIVIDUAL' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre del cliente" />
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
                          <FormLabel>Apellido *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Apellido del cliente" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dni"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DNI *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número de DNI" />
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
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="estadoCivil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado Civil</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione estado civil" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SOLTERO">Soltero(a)</SelectItem>
                              <SelectItem value="CASADO">Casado(a)</SelectItem>
                              <SelectItem value="DIVORCIADO">Divorciado(a)</SelectItem>
                              <SelectItem value="VIUDO">Viudo(a)</SelectItem>
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
                          <FormLabel>Ocupación</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ocupación del cliente" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="razonSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razón Social *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Razón social de la empresa" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ruc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RUC *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número de RUC" />
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
                          <FormLabel>Representante Legal</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre del representante legal" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="cargoRepresentante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo del Representante</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Cargo del representante legal" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="Email del cliente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Número de teléfono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Dirección del cliente" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 