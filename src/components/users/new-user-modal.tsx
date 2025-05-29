'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { FiUser, FiMail, FiLock, FiShield, FiInfo, FiEye, FiEyeOff } from 'react-icons/fi'
import { useSession } from 'next-auth/react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import type { Rol } from '@prisma/client'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string()
    .email('Email inválido')
    .min(5, 'El email debe tener al menos 5 caracteres')
    .max(100, 'El email no puede tener más de 100 caracteres'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  rol: z.string().min(1, 'Debe seleccionar un rol'),
})

type FormValues = z.infer<typeof formSchema>

interface NewUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}

// Definir grupos de roles
const ROLE_GROUPS: Record<string, Rol[]> = {
  ADMINISTRACION: ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'DEVELOPER'],
  VENTAS: ['SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR'],
  PROYECTOS: ['PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT'],
  FINANZAS: ['FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT'],
  OTROS: ['INVESTOR', 'GUEST']
}

export default function NewUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: NewUserModalProps) {
  const { data: session } = useSession()
  const currentUserRole = session?.user?.role as Rol
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const ROLE_HIERARCHY: Record<Rol, Rol[]> = {
    SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'GERENTE_GENERAL', 'DEVELOPER', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
    ADMIN: ['ADMIN', 'GERENTE_GENERAL', 'DEVELOPER', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'PROJECT_MANAGER', 'CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_ASSISTANT', 'INVESTOR', 'GUEST'],
    GERENTE_GENERAL: ['SALES_MANAGER', 'PROJECT_MANAGER', 'FINANCE_MANAGER', 'INVESTOR', 'GUEST'],
    SALES_MANAGER: ['SALES_REP', 'SALES_ASSISTANT', 'SALES_COORDINATOR', 'GUEST'],
    PROJECT_MANAGER: ['CONSTRUCTION_SUPERVISOR', 'QUALITY_CONTROL', 'PROJECT_ASSISTANT', 'GUEST'],
    FINANCE_MANAGER: ['ACCOUNTANT', 'FINANCE_ASSISTANT', 'GUEST'],
    DEVELOPER: ['GUEST'],
    SALES_REP: ['GUEST'],
    SALES_ASSISTANT: ['GUEST'],
    SALES_COORDINATOR: ['GUEST'],
    CONSTRUCTION_SUPERVISOR: ['GUEST'],
    QUALITY_CONTROL: ['GUEST'],
    PROJECT_ASSISTANT: ['GUEST'],
    ACCOUNTANT: ['GUEST'],
    FINANCE_ASSISTANT: ['GUEST'],
    INVESTOR: ['GUEST'],
    GUEST: []
  }

  const ROLE_LABELS: Record<Rol, string> = {
    SUPER_ADMIN: 'Super Administrador',
    ADMIN: 'Administrador',
    GERENTE_GENERAL: 'Gerente General',
    DEVELOPER: 'Desarrollador',
    SALES_MANAGER: 'Gerente de Ventas',
    SALES_REP: 'Representante de Ventas',
    SALES_ASSISTANT: 'Asistente de Ventas',
    SALES_COORDINATOR: 'Coordinador de Ventas',
    PROJECT_MANAGER: 'Gerente de Proyectos',
    CONSTRUCTION_SUPERVISOR: 'Supervisor de Construcción',
    QUALITY_CONTROL: 'Control de Calidad',
    PROJECT_ASSISTANT: 'Asistente de Proyectos',
    FINANCE_MANAGER: 'Gerente Financiero',
    ACCOUNTANT: 'Contador',
    FINANCE_ASSISTANT: 'Asistente Financiero',
    INVESTOR: 'Inversionista',
    GUEST: 'Invitado'
  }

  const getAvailableRoles = () => {
    if (!currentUserRole) return []
    return ROLE_HIERARCHY[currentUserRole] || []
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      rol: ''
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
  
      if (!response.ok) {
        const error = await response.json()
        
        // Manejar errores específicos
        if (error.code === 'EMAIL_DUPLICATE') {
          setFormError('El correo electrónico ya está registrado en el sistema. Por favor, utilice un email diferente o contacte al administrador si necesita recuperar el acceso a esta cuenta.')
        } else if (error.error) {
          setFormError(error.error)
        } else {
          setFormError('Error al crear el usuario')
        }
        return
      }
  
      toast.success('Usuario creado exitosamente')
      onClose()
      onUserCreated()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Error al crear el usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderRoleGroups = () => {
    const availableRoles = getAvailableRoles()

    return Object.entries(ROLE_GROUPS).map(([groupName, roles]) => {
      const availableRolesInGroup = roles.filter(role => availableRoles.includes(role))

      if (availableRolesInGroup.length === 0) return null

      return (
        <SelectGroup key={groupName}>
          <SelectLabel>{groupName}</SelectLabel>
          {availableRolesInGroup.map((role) => (
            <SelectItem key={role} value={role}>
              {ROLE_LABELS[role as Rol]}
            </SelectItem>
          ))}
        </SelectGroup>
      )
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle className="text-2xl font-bold text-gray-900">Crear Nuevo Usuario</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Complete el formulario para crear un nuevo usuario en el sistema.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          {formError && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-red-600">
          <FiInfo className="h-5 w-5" />
          <p className="text-sm font-medium">{formError}</p>
        </div>
      </div>
    )}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <FiUser className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Información Personal</h3>
                </div>

                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-gray-900">Nombre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FiUser className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            {...field}
                            placeholder="Nombre completo"
                            className={cn(
                              "pl-10 h-11 text-base",
                              form.formState.errors.nombre && "border-red-500 focus-visible:ring-red-500"
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm text-gray-500">
                        Ingrese el nombre completo del usuario (solo letras y espacios)
                      </FormDescription>
                      {form.formState.errors.nombre && (
                        <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                          <FiInfo className="h-4 w-4" />
                          <span>{form.formState.errors.nombre.message}</span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-gray-900">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FiMail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="correo@ejemplo.com"
                            className={cn(
                              "pl-10 h-11 text-base",
                              form.formState.errors.email && "border-red-500 focus-visible:ring-red-500"
                            )}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm text-gray-500">
                        Ingrese un email válido que será usado para el inicio de sesión
                      </FormDescription>
                      {form.formState.errors.email && (
                        <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                          <FiInfo className="h-4 w-4" />
                          <span>{form.formState.errors.email.message}</span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-gray-900">Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FiLock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={cn(
                              "pl-10 h-11 text-base",
                              form.formState.errors.password && "border-red-500 focus-visible:ring-red-500"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <FiEyeOff className="h-5 w-5" />
                            ) : (
                              <FiEye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm text-gray-500">
                        La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
                      </FormDescription>
                      {form.formState.errors.password && (
                        <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                          <FiInfo className="h-4 w-4" />
                          <span>{form.formState.errors.password.message}</span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <FiShield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Permisos y Roles</h3>
                </div>

                <FormField
                  control={form.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-gray-900">Rol</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-11 text-base",
                            form.formState.errors.rol && "border-red-500 focus-visible:ring-red-500"
                          )}>
                            <SelectValue placeholder="Seleccione un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {renderRoleGroups()}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-sm text-gray-500">
                        Seleccione el rol que tendrá el usuario en el sistema
                      </FormDescription>
                      {form.formState.errors.rol && (
                        <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                          <FiInfo className="h-4 w-4" />
                          <span>{form.formState.errors.rol.message}</span>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            </div>
            </div>
            <DialogFooter className="flex-none pt-4 border-t">
              <Button
                type="submit"
                className="h-11 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}