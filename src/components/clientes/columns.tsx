'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Cliente, TIPO_CLIENTE, EstadoCliente } from '@/types/cliente'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FiEye, FiEdit, FiTrash2, FiUser, FiChevronDown } from 'react-icons/fi'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'react-hot-toast'
import { Switch } from '@/components/ui/switch'

export const columns: ColumnDef<Cliente>[] = [
  {
    accessorKey: 'nombre',
    header: 'Cliente',
    cell: ({ row }) => {
      const cliente = row.original
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <FiUser className="h-5 w-5 text-primary-600" />
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900 truncate" title={`${cliente.nombre} ${cliente.apellido}`}>
              {cliente.nombre} {cliente.apellido}
            </div>
            <div className="text-sm text-gray-500 truncate" title={cliente.email}>
              {cliente.email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.original.tipoCliente
      return (
        <Badge variant={tipo === 'INDIVIDUAL' ? 'default' : 'secondary'} className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          {tipo === 'INDIVIDUAL' ? 'Persona Natural' : 'Empresa'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => {
      const cliente = row.original
      const isActive = cliente.isActive
      const estado = isActive ? 'ACTIVO' : 'INACTIVO'
      const variant = isActive ? 'success' : 'destructive'

      const handleEstadoChange = async (newEstado: 'ACTIVO' | 'INACTIVO') => {
        try {
          const response = await fetch(`/api/clientes/${cliente.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isActive: newEstado === 'ACTIVO' }),
          })

          if (!response.ok) {
            throw new Error('Error al actualizar el estado')
          }

          toast.success('Estado actualizado correctamente')
          // Actualizar la UI
          row.original.isActive = newEstado === 'ACTIVO'
        } catch (error) {
          toast.error('Error al actualizar el estado')
          console.error('Error:', error)
        }
      }

      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => {
              handleEstadoChange(checked ? 'ACTIVO' : 'INACTIVO')
            }}
            className="data-[state=checked]:bg-green-500"
          />
          <Badge variant={variant}>
            {estado}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 px-2 py-1">
                <FiChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleEstadoChange('ACTIVO')}>
                <Badge variant="success" className="mr-2">ACTIVO</Badge>
                Activo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEstadoChange('INACTIVO')}>
                <Badge variant="destructive" className="mr-2">INACTIVO</Badge>
                Inactivo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
  {
    accessorKey: 'telefono',
    header: 'Teléfono',
    cell: ({ row }) => row.original.telefono || '-',
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha de Registro',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'PPP', { locale: es }),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const cliente = row.original
      const router = useRouter()

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/dashboard/clientes/${cliente.id}`)
            }}
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <FiEye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/dashboard/clientes/${cliente.id}/editar`)
            }}
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <FiEdit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Implementar eliminación
            }}
            className="text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <FiTrash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
] 