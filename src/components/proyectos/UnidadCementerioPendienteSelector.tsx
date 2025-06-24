'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { FiMapPin, FiHome, FiGrid, FiPlus, FiX } from 'react-icons/fi'

export interface UnidadCementerioPendiente {
  codigo: string;
  tipoUnidad: 'PARCELA' | 'NICHO' | 'MAUSOLEO';
  tipo: 'inicial' | 'intermedio';
}

interface UnidadCementerioPendienteSelectorProps {
  huecos: {
    PARCELA: string[];
    NICHO: string[];
    MAUSOLEO: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  onUnidadSeleccionada: (unidadPendiente: UnidadCementerioPendiente) => void;
  onContinuarNormal: () => void;
}

export default function UnidadCementerioPendienteSelector({
  huecos,
  isOpen,
  onClose,
  onUnidadSeleccionada,
  onContinuarNormal
}: UnidadCementerioPendienteSelectorProps) {
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadCementerioPendiente | null>(null)
  const { toast } = useToast()

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

  const handleUnidadSeleccionada = (codigo: string, tipoUnidad: 'PARCELA' | 'NICHO' | 'MAUSOLEO') => {
    const unidadPendiente: UnidadCementerioPendiente = {
      codigo,
      tipoUnidad,
      tipo: 'intermedio'
    }
    setSelectedUnidad(unidadPendiente)
  }

  const handleConfirmarSeleccion = () => {
    if (selectedUnidad) {
      onUnidadSeleccionada(selectedUnidad)
      setSelectedUnidad(null)
    }
  }

  const handleContinuarNormal = () => {
    onContinuarNormal()
    setSelectedUnidad(null)
  }

  if (!isOpen) return null

  const totalHuecos = huecos.PARCELA.length + huecos.NICHO.length + huecos.MAUSOLEO.length

  return (
    <>
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FiPlus className="w-5 h-5" />
              Detectar Huecos en Unidades
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se han detectado {totalHuecos} huecos en la secuencia de unidades. 
              Puedes crear las unidades faltantes para llenar los huecos o continuar con la secuencia normal.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Huecos de Parcelas */}
            {huecos.PARCELA.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FiMapPin className="w-5 h-5" />
                    Parcelas Pendientes ({huecos.PARCELA.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {huecos.PARCELA.map((codigo) => (
                      <Button
                        key={codigo}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => handleUnidadSeleccionada(codigo, 'PARCELA')}
                      >
                        <FiMapPin className="w-3 h-3 mr-2" />
                        {codigo}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Huecos de Nichos */}
            {huecos.NICHO.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FiHome className="w-5 h-5" />
                    Nichos Pendientes ({huecos.NICHO.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {huecos.NICHO.map((codigo) => (
                      <Button
                        key={codigo}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => handleUnidadSeleccionada(codigo, 'NICHO')}
                      >
                        <FiHome className="w-3 h-3 mr-2" />
                        {codigo}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Huecos de Mausoleos */}
            {huecos.MAUSOLEO.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FiGrid className="w-5 h-5" />
                    Mausoleos Pendientes ({huecos.MAUSOLEO.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {huecos.MAUSOLEO.map((codigo) => (
                      <Button
                        key={codigo}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                        onClick={() => handleUnidadSeleccionada(codigo, 'MAUSOLEO')}
                      >
                        <FiGrid className="w-3 h-3 mr-2" />
                        {codigo}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {totalHuecos === 0 && (
              <div className="text-center py-8">
                <FiX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay huecos detectados
                </h3>
                <p className="text-gray-500">
                  La secuencia de unidades está completa. Puedes continuar con la creación normal.
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleContinuarNormal}>
              Continuar Normal
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para unidad seleccionada */}
      <AlertDialog open={!!selectedUnidad} onOpenChange={() => setSelectedUnidad(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Crear Unidad Pendiente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres crear la unidad <strong>{selectedUnidad?.codigo}</strong>?
              <br /><br />
              <strong>Tipo:</strong> {selectedUnidad ? getTipoLabel(selectedUnidad.tipoUnidad) : ''}<br />
              <strong>Código:</strong> {selectedUnidad?.codigo}
              <br /><br />
              Esta unidad se creará para llenar el hueco en la secuencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarSeleccion}>
              Crear Unidad
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 