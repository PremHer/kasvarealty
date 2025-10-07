'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { FiChevronDown, FiChevronRight, FiCalendar, FiUser, FiDollarSign, FiEdit2, FiPercent } from 'react-icons/fi'

interface Reprogramacion {
  id: string
  motivo: string
  cambiosPlan: any
  createdAt: string
  creadoPorUsuario?: {
    nombre: string
  }
  descuentos: DescuentoCuota[]
  modificaciones: ModificacionCuota[]
}

interface DescuentoCuota {
  id: string
  montoDescuento: number
  motivo: string
  createdAt: string
  cuota: {
    numeroCuota: number
  }
}

interface ModificacionCuota {
  id: string
  montoAnterior: number
  montoNuevo: number
  fechaVencimientoAnterior: string
  fechaVencimientoNueva: string
  createdAt: string
  cuota: {
    numeroCuota: number
  }
}

interface HistorialReprogramacionesProps {
  reprogramaciones: Reprogramacion[]
}

export default function HistorialReprogramaciones({ reprogramaciones }: HistorialReprogramacionesProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  if (reprogramaciones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiEdit2 className="h-4 w-4" />
            Historial de Reprogramaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FiEdit2 className="h-12 w-12 mx-auto mb-2" />
            <p>No hay reprogramaciones registradas</p>
            <p className="text-sm">Las reprogramaciones aparecerán aquí cuando se realicen cambios</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FiEdit2 className="h-4 w-4" />
          Historial de Reprogramaciones ({reprogramaciones.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reprogramaciones.map((reprogramacion) => {
            const isOpen = openItems.has(reprogramacion.id)
            const hasChanges = reprogramacion.descuentos.length > 0 || 
                              reprogramacion.modificaciones.length > 0 ||
                              Object.keys(reprogramacion.cambiosPlan || {}).length > 0

            return (
              <Collapsible key={reprogramacion.id} open={isOpen} onOpenChange={() => toggleItem(reprogramacion.id)}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isOpen ? <FiChevronDown className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
                        <FiCalendar className="h-4 w-4" />
                        <span className="font-medium">
                          {formatDate(reprogramacion.createdAt)}
                        </span>
                      </div>
                      {hasChanges && (
                        <Badge variant="outline" className="text-xs">
                          {reprogramacion.descuentos.length + reprogramacion.modificaciones.length} cambios
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FiUser className="h-3 w-3" />
                      {reprogramacion.creadoPorUsuario?.nombre || 'Usuario'}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Motivo */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium mb-1">Motivo:</h4>
                      <p className="text-sm text-gray-700">{reprogramacion.motivo}</p>
                    </div>

                    {/* Cambios de Plan */}
                    {reprogramacion.cambiosPlan && Object.keys(reprogramacion.cambiosPlan).length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FiPercent className="h-4 w-4" />
                          Cambios de Plan
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {reprogramacion.cambiosPlan.modeloAmortizacion && (
                            <div>
                              <span className="font-medium">Modelo:</span> {reprogramacion.cambiosPlan.modeloAmortizacion}
                            </div>
                          )}
                          {reprogramacion.cambiosPlan.tasaInteres && (
                            <div>
                              <span className="font-medium">Tasa de Interés:</span> {reprogramacion.cambiosPlan.tasaInteres}%
                            </div>
                          )}
                          {reprogramacion.cambiosPlan.frecuenciaCuota && (
                            <div>
                              <span className="font-medium">Frecuencia:</span> {reprogramacion.cambiosPlan.frecuenciaCuota}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Descuentos */}
                    {reprogramacion.descuentos.length > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FiDollarSign className="h-4 w-4" />
                          Descuentos Aplicados ({reprogramacion.descuentos.length})
                        </h4>
                        <div className="space-y-2">
                          {reprogramacion.descuentos.map((descuento) => (
                            <div key={descuento.id} className="flex justify-between items-center text-sm">
                              <div>
                                <span className="font-medium">Cuota {descuento.cuota.numeroCuota}:</span>
                                <span className="text-green-600 ml-2">
                                  -{formatCurrency(descuento.montoDescuento)}
                                </span>
                              </div>
                              <span className="text-gray-500 text-xs">{descuento.motivo}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modificaciones */}
                    {reprogramacion.modificaciones.length > 0 && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <FiEdit2 className="h-4 w-4" />
                          Cuotas Modificadas ({reprogramacion.modificaciones.length})
                        </h4>
                        <div className="space-y-3">
                          {reprogramacion.modificaciones.map((modificacion) => (
                            <div key={modificacion.id} className="border-l-2 border-orange-300 pl-3">
                              <div className="font-medium text-sm">Cuota {modificacion.cuota.numeroCuota}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-1">
                                <div>
                                  <span className="text-gray-600">Monto:</span>
                                  <span className="ml-2">
                                    {formatCurrency(modificacion.montoAnterior)} → {formatCurrency(modificacion.montoNuevo)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Fecha:</span>
                                  <span className="ml-2">
                                    {new Date(modificacion.fechaVencimientoAnterior).toLocaleDateString()} → {new Date(modificacion.fechaVencimientoNueva).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resumen */}
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Total de cambios:</span>
                        <span>
                          {reprogramacion.descuentos.length + reprogramacion.modificaciones.length + 
                           (Object.keys(reprogramacion.cambiosPlan || {}).length > 0 ? 1 : 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="font-medium">Total descuentos:</span>
                        <span className="text-green-600">
                          {formatCurrency(reprogramacion.descuentos.reduce((sum, d) => sum + d.montoDescuento, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
