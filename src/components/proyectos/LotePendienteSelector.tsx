'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Home, AlertTriangle } from 'lucide-react'
import { LotePendiente } from '@/lib/services/loteService'

interface LotePendienteSelectorProps {
  lotesPendientes: LotePendiente[]
  isOpen: boolean
  onClose: () => void
  onLoteSeleccionado: (lotePendiente: LotePendiente) => void
  onContinuarNormal: () => void
}

export default function LotePendienteSelector({
  lotesPendientes,
  isOpen,
  onClose,
  onLoteSeleccionado,
  onContinuarNormal
}: LotePendienteSelectorProps) {
  const [loteSeleccionado, setLoteSeleccionado] = useState<LotePendiente | null>(null)

  const handleConfirmar = () => {
    if (loteSeleccionado) {
      onLoteSeleccionado(loteSeleccionado)
      setLoteSeleccionado(null)
      onClose()
    }
  }

  const handleCancelar = () => {
    setLoteSeleccionado(null)
    onClose()
  }

  const handleContinuarNormal = () => {
    setLoteSeleccionado(null)
    onContinuarNormal()
    onClose()
  }

  const lotesIniciales = lotesPendientes.filter(lote => lote.tipo === 'inicial')
  const lotesIntermedios = lotesPendientes.filter(lote => lote.tipo === 'intermedio')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <span>Lotes Pendientes de Crear</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="text-gray-600">
            Se han detectado lotes que fueron eliminados anteriormente. 
            Puedes elegir entre rellenar estos huecos con sus códigos originales 
            o continuar con la creación normal de lotes.
          </div>

          {/* Lotes iniciales */}
          {lotesIniciales.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Lotes Iniciales
                </Badge>
                <span className="text-sm text-gray-600">
                  Lotes que faltan desde el inicio de la secuencia
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {lotesIniciales.map((lote) => (
                  <Card
                    key={lote.codigo}
                    className={`cursor-pointer transition-colors ${
                      loteSeleccionado?.codigo === lote.codigo
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setLoteSeleccionado(lote)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{lote.codigo}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Lotes intermedios */}
          {lotesIntermedios.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Lotes Intermedios
                </Badge>
                <span className="text-sm text-gray-600">
                  Lotes que faltan entre lotes existentes
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {lotesIntermedios.map((lote) => (
                  <Card
                    key={lote.codigo}
                    className={`cursor-pointer transition-colors ${
                      loteSeleccionado?.codigo === lote.codigo
                        ? 'border-orange-500 bg-orange-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setLoteSeleccionado(lote)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">{lote.codigo}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {loteSeleccionado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    Lote seleccionado: {loteSeleccionado.codigo}
                  </div>
                  <div className="text-sm text-blue-700">
                    Se creará con el código {loteSeleccionado.codigo} y número {loteSeleccionado.numero}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Opción para continuar normal */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="font-medium text-gray-900">O continuar con creación normal</span>
            </div>
            <p className="text-sm text-gray-700">
              Si prefieres ignorar los huecos y crear el siguiente lote en secuencia normal.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelar}
            className="mr-2"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleContinuarNormal}
            className="mr-2"
          >
            Continuar Normal
          </Button>
          {loteSeleccionado && (
            <Button
              type="button"
              onClick={handleConfirmar}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Crear Lote {loteSeleccionado.codigo}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 