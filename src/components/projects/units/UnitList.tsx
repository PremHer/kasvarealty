'use client'

import { useState } from 'react'
import { UnidadInmobiliaria } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FiPlus, FiEdit2, FiTrash2, FiHome, FiDollarSign, FiMapPin } from 'react-icons/fi'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface UnitListProps {
  units: UnidadInmobiliaria[]
  onEdit: (unit: UnidadInmobiliaria) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { color: string; label: string }> = {
    'DISPONIBLE': {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      label: 'Disponible'
    },
    'RESERVADO': {
      color: 'bg-amber-50 text-amber-700 border-amber-100',
      label: 'Reservado'
    },
    'VENDIDO': {
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      label: 'Vendido'
    },
    'ENTREGADO': {
      color: 'bg-slate-50 text-slate-600 border-slate-200',
      label: 'Entregado'
    }
  }
  return configs[status] || { color: 'bg-gray-50 text-gray-600 border-gray-200', label: status }
}

export default function UnitList({ units, onEdit, onDelete, onAdd }: UnitListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta unidad?')) {
      setIsDeleting(id)
      try {
        await onDelete(id)
      } finally {
        setIsDeleting(null)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAdd} className="flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Nueva Unidad
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((unit) => {
          const statusConfig = getStatusConfig(unit.estado)
          return (
            <Card key={unit.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{unit.codigo}</CardTitle>
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <FiHome className="w-4 h-4 mr-2 text-primary-500" />
                    <span className="text-sm">{unit.tipo}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiMapPin className="w-4 h-4 mr-2 text-primary-500" />
                    <span className="text-sm">Área: {unit.area} m²</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiDollarSign className="w-4 h-4 mr-2 text-primary-500" />
                    <span className="text-sm">{formatCurrency(unit.precio)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(unit)}
                    className="flex items-center gap-1"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(unit.id)}
                    disabled={isDeleting === unit.id}
                    className="flex items-center gap-1"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {units.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay unidades inmobiliarias registradas
        </div>
      )}
    </div>
  )
} 