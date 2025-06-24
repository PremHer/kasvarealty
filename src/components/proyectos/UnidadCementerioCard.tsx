'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { UnidadCementerioWithRelations } from '@/types/cementerio'
import { FiMapPin, FiHome, FiGrid, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi'
import { Power, PowerOff } from 'lucide-react'
import UnidadCementerioModal from './UnidadCementerioModal'
import ToggleUnidadCementerioStatusAlert from './toggle-unidad-cementerio-status-alert'

interface UnidadCementerioCardProps {
  unidad: UnidadCementerioWithRelations
  proyectoId: string
  onUnidadChanged?: () => void
}

export default function UnidadCementerioCard({ unidad, proyectoId, onUnidadChanged }: UnidadCementerioCardProps) {
  const [loading, setLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toggleStatusAlertOpen, setToggleStatusAlertOpen] = useState(false)
  const { toast } = useToast()
  const session = useSession()

  const canManageUnidades = [
    'SUPER_ADMIN',
    'GERENTE_GENERAL',
    'PROJECT_MANAGER'
  ].includes(session.data?.user?.role || '')

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800'
      case 'RESERVADO':
        return 'bg-yellow-100 text-yellow-800'
      case 'VENDIDO':
        return 'bg-blue-100 text-blue-800'
      case 'OCUPADO':
        return 'bg-red-100 text-red-800'
      case 'INACTIVO':
        return 'bg-gray-100 text-gray-800'
      case 'RETIRADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return 'Disponible'
      case 'RESERVADO':
        return 'Reservado'
      case 'VENDIDO':
        return 'Vendido'
      case 'OCUPADO':
        return 'Ocupado'
      case 'INACTIVO':
        return 'Inactivo'
      case 'RETIRADO':
        return 'Retirado'
      default:
        return estado
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'PARCELA':
        return <FiMapPin className="w-4 h-4" />
      case 'NICHO':
        return <FiHome className="w-4 h-4" />
      case 'MAUSOLEO':
        return <FiGrid className="w-4 h-4" />
      default:
        return <FiHome className="w-4 h-4" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'PARCELA':
        return 'Parcela'
      case 'NICHO':
        return 'Nicho'
      case 'MAUSOLEO':
        return 'Mausoleo'
      default:
        return tipo
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'PARCELA':
        return 'bg-blue-100 text-blue-800'
      case 'NICHO':
        return 'bg-green-100 text-green-800'
      case 'MAUSOLEO':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const renderDetallesEspecificos = () => {
    if (unidad.parcela) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Dimensiones:</span> {unidad.parcela.dimensionLargo}m × {unidad.parcela.dimensionAncho}m
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Capacidad:</span> {unidad.parcela.capacidad} personas
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Tipo de terreno:</span> {unidad.parcela.tipoTerreno}
          </p>
        </div>
      )
    }

    if (unidad.nicho) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Nivel:</span> {unidad.nicho.nivelVertical}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Capacidad:</span> {unidad.nicho.capacidadUrnas} urnas
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Material:</span> {unidad.nicho.material}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Medidas:</span> {unidad.nicho.medidaAlto}×{unidad.nicho.medidaAncho}×{unidad.nicho.medidaProfundidad}cm
          </p>
        </div>
      )
    }

    if (unidad.mausoleo) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Dimensiones:</span> {unidad.mausoleo.dimensionLargo}m × {unidad.mausoleo.dimensionAncho}m
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Capacidad:</span> {unidad.mausoleo.capacidadPersonas} personas
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Tipo:</span> {unidad.mausoleo.tipoConstruccion}
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Material:</span> {unidad.mausoleo.material} • {unidad.mausoleo.niveles} niveles
          </p>
        </div>
      )
    }

    return null
  }

  const handleDeleteUnidad = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/proyectos/${proyectoId}/unidades-cementerio/${unidad.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData)
      }

      toast({
        title: "Unidad eliminada",
        description: "La unidad se ha eliminado permanentemente de la base de datos",
      })

      onUnidadChanged?.()
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error al eliminar unidad:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la unidad",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCambiarEstadoInactivo = () => {
    setToggleStatusAlertOpen(true)
  }

  const handleReactivarUnidad = () => {
    setToggleStatusAlertOpen(true)
  }

  const isUnidadInactiva = unidad.estado === 'INACTIVO' || unidad.estado === 'RETIRADO'

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${
        isUnidadInactiva ? 'opacity-60 bg-gray-50' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {getTipoIcon(unidad.tipoUnidad)}
                {unidad.codigo}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getTipoColor(unidad.tipoUnidad)}>
                  {getTipoLabel(unidad.tipoUnidad)}
                </Badge>
                <Badge className={getEstadoColor(unidad.estado)}>
                  {getEstadoLabel(unidad.estado)}
                </Badge>
              </div>
            </div>
            
            {canManageUnidades && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setEditModalOpen(true)}
                >
                  <FiEdit2 className="w-3 h-3" />
                </Button>
                {!isUnidadInactiva && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700"
                    onClick={handleCambiarEstadoInactivo}
                  >
                    <PowerOff className="w-3 h-3" />
                  </Button>
                )}
                {isUnidadInactiva && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                    onClick={handleReactivarUnidad}
                  >
                    <Power className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <FiTrash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Precio</span>
              <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                <FiDollarSign className="w-3 h-3" />
                {formatCurrency(unidad.precio)}
              </span>
            </div>

            {renderDetallesEspecificos()}

            {(unidad.descripcion || unidad.observaciones) && (
              <div className="pt-2 border-t border-gray-100">
                {unidad.descripcion && (
                  <p className="text-xs text-gray-600 mb-1">{unidad.descripcion}</p>
                )}
                {unidad.observaciones && (
                  <p className="text-xs text-gray-500 italic">{unidad.observaciones}</p>
                )}
              </div>
            )}

            {unidad.latitud && unidad.longitud && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Ubicación:</span> {unidad.latitud.toFixed(6)}, {unidad.longitud.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <UnidadCementerioModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        proyectoId={proyectoId}
        pabellonId={unidad.pabellonId}
        unidad={unidad}
        onUnidadCreated={() => {
          onUnidadChanged?.()
          setEditModalOpen(false)
        }}
      />

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar unidad permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar permanentemente la unidad <strong>{unidad.codigo}</strong>?
              <br /><br />
              <strong>Tipo:</strong> {getTipoLabel(unidad.tipoUnidad)}<br />
              <strong>Estado:</strong> {getEstadoLabel(unidad.estado)}<br />
              <strong>Precio:</strong> {formatCurrency(unidad.precio)}
              <br /><br />
              <span className="text-red-600 font-medium">
                ⚠️ Esta acción eliminará permanentemente la unidad de la base de datos. 
                Esta operación no se puede deshacer.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUnidad}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Eliminando...' : 'Eliminar Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alerta para toggle de estado */}
      <ToggleUnidadCementerioStatusAlert
        isOpen={toggleStatusAlertOpen}
        onClose={() => setToggleStatusAlertOpen(false)}
        unidad={unidad}
        proyectoId={proyectoId}
        onStatusChanged={() => {
          onUnidadChanged?.()
          setToggleStatusAlertOpen(false)
        }}
      />
    </>
  )
} 