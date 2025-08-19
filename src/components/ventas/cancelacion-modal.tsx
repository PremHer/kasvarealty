'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FiX, FiAlertTriangle, FiDollarSign, FiFileText, FiInfo } from 'react-icons/fi'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { TipoCancelacion, TipoDevolucion } from '@prisma/client'

const formSchema = z.object({
  tipoCancelacion: z.string().min(1, 'Debe seleccionar un tipo de cancelación'),
  motivoCancelacion: z.string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo no puede tener más de 500 caracteres'),
  tipoDevolucion: z.string().min(1, 'Debe seleccionar un tipo de devolución'),
  montoDevolucion: z.string().optional(),
  porcentajeDevolucion: z.string().optional(),
  motivoDevolucion: z.string().optional(),
  observaciones: z.string().optional(),
  documentosRequeridos: z.string().optional(),
  condicionesEspeciales: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CancelacionModalProps {
  isOpen: boolean
  onClose: () => void
  onCancelacionCreated: () => void
  ventaLoteId?: string
  ventaUnidadCementerioId?: string
  ventaInfo?: {
    cliente: string
    producto: string
    precioVenta: number
    montoPagado: number
  }
}

const TIPO_CANCELACION_LABELS: Record<TipoCancelacion, string> = {
  SOLICITUD_CLIENTE: 'Solicitud del Cliente',
  INCUMPLIMIENTO_CLIENTE: 'Incumplimiento del Cliente',
  PROBLEMAS_FINANCIEROS: 'Problemas Financieros',
  CAMBIO_PLANES: 'Cambio de Planes',
  PROBLEMAS_LEGALES: 'Problemas Legales',
  OTRO: 'Otro'
}

const TIPO_DEVOLUCION_LABELS: Record<TipoDevolucion, string> = {
  DEVOLUCION_COMPLETA: 'Devolución Completa',
  DEVOLUCION_PARCIAL: 'Devolución Parcial',
  SIN_DEVOLUCION: 'Sin Devolución',
  CREDITO_FUTURO: 'Crédito para Futura Compra',
  CAMBIO_PRODUCTO: 'Cambio por Otro Producto'
}

export default function CancelacionModal({
  isOpen,
  onClose,
  onCancelacionCreated,
  ventaLoteId,
  ventaUnidadCementerioId,
  ventaInfo
}: CancelacionModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipoCancelacion: '',
      motivoCancelacion: '',
      tipoDevolucion: '',
      montoDevolucion: '',
      porcentajeDevolucion: '',
      motivoDevolucion: '',
      observaciones: '',
      documentosRequeridos: '',
      condicionesEspeciales: '',
    }
  })

  // Limpiar formulario cuando se abra el modal
  const resetForm = () => {
    form.reset()
    setFormError(null)
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      const response = await fetch('/api/cancelaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ventaLoteId,
          ventaUnidadCementerioId,
          tipoCancelacion: data.tipoCancelacion as TipoCancelacion,
          motivoCancelacion: data.motivoCancelacion,
          tipoDevolucion: data.tipoDevolucion as TipoDevolucion,
          montoDevolucion: data.montoDevolucion ? parseFloat(data.montoDevolucion) : undefined,
          porcentajeDevolucion: data.porcentajeDevolucion ? parseFloat(data.porcentajeDevolucion) : undefined,
          motivoDevolucion: data.motivoDevolucion,
          observaciones: data.observaciones,
          documentosRequeridos: data.documentosRequeridos,
          condicionesEspeciales: data.condicionesEspeciales,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setFormError(error.error || 'Error al crear la cancelación')
        return
      }

      toast({
        title: '¡Solicitud Creada!',
        description: 'La solicitud de cancelación ha sido creada exitosamente',
        variant: 'success',
        duration: 3000
      })
      
      resetForm()
      onClose()
      onCancelacionCreated()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Error al crear la cancelación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiAlertTriangle className="h-6 w-6 text-orange-500" />
            Solicitar Cancelación
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Complete el formulario para solicitar la cancelación de la venta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {ventaInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <FiInfo className="h-5 w-5" />
                <h3 className="font-semibold">Información de la Venta</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span> {ventaInfo.cliente}
                </div>
                <div>
                  <span className="font-medium">Producto:</span> {ventaInfo.producto}
                </div>
                <div>
                  <span className="font-medium">Precio de Venta:</span> S/. {ventaInfo.precioVenta.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Monto Pagado:</span> S/. {ventaInfo.montoPagado.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <FiAlertTriangle className="h-5 w-5" />
                    <p className="text-sm font-medium">{formError}</p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Tipo de Cancelación */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FiAlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-gray-900">Tipo de Cancelación</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="tipoCancelacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">Tipo de Cancelación *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(
                              "h-11 text-base",
                              form.formState.errors.tipoCancelacion && "border-red-500 focus-visible:ring-red-500"
                            )}>
                              <SelectValue placeholder="Seleccione el tipo de cancelación" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(TIPO_CANCELACION_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-sm text-gray-500">
                          Seleccione el motivo principal de la cancelación
                        </FormDescription>
                        {form.formState.errors.tipoCancelacion && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                            <FiInfo className="h-4 w-4" />
                            <span>{form.formState.errors.tipoCancelacion.message}</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="motivoCancelacion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">Motivo Detallado *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describa detalladamente el motivo de la cancelación..."
                            className={cn(
                              "min-h-[100px] text-base",
                              form.formState.errors.motivoCancelacion && "border-red-500 focus-visible:ring-red-500"
                            )}
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-gray-500">
                          Proporcione una explicación detallada del motivo de la cancelación
                        </FormDescription>
                        {form.formState.errors.motivoCancelacion && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                            <FiInfo className="h-4 w-4" />
                            <span>{form.formState.errors.motivoCancelacion.message}</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tipo de Devolución */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FiDollarSign className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Política de Devolución</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="tipoDevolucion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">Tipo de Devolución *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(
                              "h-11 text-base",
                              form.formState.errors.tipoDevolucion && "border-red-500 focus-visible:ring-red-500"
                            )}>
                              <SelectValue placeholder="Seleccione el tipo de devolución" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(TIPO_DEVOLUCION_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-sm text-gray-500">
                          Seleccione cómo se manejará la devolución del dinero
                        </FormDescription>
                        {form.formState.errors.tipoDevolucion && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                            <FiInfo className="h-4 w-4" />
                            <span>{form.formState.errors.tipoDevolucion.message}</span>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="montoDevolucion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-gray-900">Monto a Devolver (S/.)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className={cn(
                                "h-11 text-base",
                                form.formState.errors.montoDevolucion && "border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                          <FormDescription className="text-sm text-gray-500">
                            Monto específico a devolver
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="porcentajeDevolucion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-gray-900">Porcentaje (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className={cn(
                                "h-11 text-base",
                                form.formState.errors.porcentajeDevolucion && "border-red-500 focus-visible:ring-red-500"
                              )}
                            />
                          </FormControl>
                          <FormDescription className="text-sm text-gray-500">
                            Porcentaje del total a devolver
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="motivoDevolucion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">Motivo de Devolución</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Explique el motivo de la devolución..."
                            className="min-h-[80px] text-base"
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-gray-500">
                          Explique por qué se aplica esta política de devolución
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Información Adicional */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <FiFileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Información Adicional</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">Observaciones</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Observaciones adicionales sobre la cancelación..."
                            className="min-h-[80px] text-base"
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-gray-500">
                          Información adicional relevante para la cancelación
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="documentosRequeridos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">Documentos Requeridos</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Lista de documentos requeridos para procesar la cancelación..."
                            className="min-h-[80px] text-base"
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-gray-500">
                          Documentos que el cliente debe presentar
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condicionesEspeciales"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">Condiciones Especiales</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Condiciones especiales o términos adicionales..."
                            className="min-h-[80px] text-base"
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-gray-500">
                          Términos o condiciones especiales para esta cancelación
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="flex-none pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-11 text-base"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="h-11 text-base font-semibold bg-red-600 hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Solicitar Cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 