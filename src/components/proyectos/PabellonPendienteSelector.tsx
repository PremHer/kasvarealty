'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Building, AlertTriangle } from 'lucide-react'
import { PabellonPendiente } from '@/lib/services/pabellonService'

interface PabellonPendienteSelectorProps {
  pabellonesPendientes: PabellonPendiente[]
  isOpen: boolean
  onClose: () => void
  onPabellonSeleccionado: (pabellonPendiente: PabellonPendiente) => void
  onContinuarNormal: () => void
}

export default function PabellonPendienteSelector({
  pabellonesPendientes,
  isOpen,
  onClose,
  onPabellonSeleccionado,
  onContinuarNormal
}: PabellonPendienteSelectorProps) {
  const [pabellonSeleccionado, setPabellonSeleccionado] = useState<PabellonPendiente | null>(null)

  const handleConfirmar = () => {
    if (pabellonSeleccionado) {
      onPabellonSeleccionado(pabellonSeleccionado)
      setPabellonSeleccionado(null)
      onClose()
    }
  }

  const handleCancelar = () => {
    setPabellonSeleccionado(null)
    onClose()
  }

  const handleContinuarNormal = () => {
    setPabellonSeleccionado(null)
    onContinuarNormal()
    onClose()
  }

  const pabellonesIniciales = pabellonesPendientes.filter(pabellon => pabellon.tipo === 'inicial')
  const pabellonesIntermedios = pabellonesPendientes.filter(pabellon => pabellon.tipo === 'intermedio')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <span>Pabellones Pendientes de Crear</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="text-gray-600">
            Se han detectado pabellones que fueron eliminados anteriormente. 
            Puedes elegir entre rellenar estos huecos con sus códigos originales 
            o continuar con la creación normal de pabellones.
          </div>

          {/* Pabellones iniciales */}
          {pabellonesIniciales.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Pabellones Iniciales
                </Badge>
                <span className="text-sm text-gray-600">
                  Pabellones que faltan desde el inicio de la secuencia
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pabellonesIniciales.map((pabellon) => (
                  <Card
                    key={pabellon.codigo}
                    className={`cursor-pointer transition-colors ${
                      pabellonSeleccionado?.codigo === pabellon.codigo
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setPabellonSeleccionado(pabellon)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{pabellon.codigo}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pabellones intermedios */}
          {pabellonesIntermedios.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Pabellones Intermedios
                </Badge>
                <span className="text-sm text-gray-600">
                  Pabellones que faltan entre pabellones existentes
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {pabellonesIntermedios.map((pabellon) => (
                  <Card
                    key={pabellon.codigo}
                    className={`cursor-pointer transition-colors ${
                      pabellonSeleccionado?.codigo === pabellon.codigo
                        ? 'border-orange-500 bg-orange-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setPabellonSeleccionado(pabellon)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">{pabellon.codigo}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pabellonSeleccionado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    Pabellón seleccionado: {pabellonSeleccionado.codigo}
                  </div>
                  <div className="text-sm text-blue-700">
                    Se creará con el código {pabellonSeleccionado.codigo} y nombre {pabellonSeleccionado.nombre}
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
              Si prefieres ignorar los huecos y crear el siguiente pabellón en secuencia normal.
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
          {pabellonSeleccionado && (
            <Button
              type="button"
              onClick={handleConfirmar}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Crear Pabellón {pabellonSeleccionado.codigo}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 