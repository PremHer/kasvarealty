'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
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

const clienteSchema = z.object({
  tipo: z.enum(['INDIVIDUAL', 'EMPRESA']),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'POTENCIAL']).default('ACTIVO'),
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

interface ClienteFormProps {
  initialData?: Cliente
  onSubmit: (data: Partial<Cliente>) => void
  submitLabel?: string
}

export function ClienteForm({ initialData, onSubmit, submitLabel = 'Crear Cliente' }: ClienteFormProps) {
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
      estado: initialData?.estado || 'ACTIVO',
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

  const handleSubmit = (data: z.infer<typeof clienteSchema>) => {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="EMPRESA">Empresa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    <SelectItem value="POTENCIAL">Potencial</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {tipo === 'INDIVIDUAL' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input {...field} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <SelectValue placeholder="Seleccione el estado civil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SOLTERO">Soltero</SelectItem>
                        <SelectItem value="CASADO">Casado</SelectItem>
                        <SelectItem value="DIVORCIADO">Divorciado</SelectItem>
                        <SelectItem value="VIUDO">Viudo</SelectItem>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="razonSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>RUC</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="representanteLegal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Representante Legal</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Cargo del Representante</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
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
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  )
} 