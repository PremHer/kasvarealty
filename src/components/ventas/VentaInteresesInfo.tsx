import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FiPercent, FiDollarSign, FiTrendingUp } from 'react-icons/fi'
import { Calculator } from 'lucide-react'

interface VentaInteresesInfoProps {
  venta: {
    tasaInteres?: number | null
    montoIntereses?: number | null
    montoCapital?: number | null
    saldoCapital?: number | null
    precioVenta: number
    saldoPendiente?: number | null
  }
  onVerAmortizacion?: () => void
}

export default function VentaInteresesInfo({ venta, onVerAmortizacion }: VentaInteresesInfoProps) {
  const tieneIntereses = venta.tasaInteres && venta.tasaInteres > 0

  if (!tieneIntereses) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <FiTrendingUp className="h-5 w-5" />
          Información de Intereses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <FiPercent className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-sm text-gray-600">Tasa Anual</div>
              <div className="font-semibold text-purple-700">
                {formatPercent(venta.tasaInteres || 0)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FiDollarSign className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-sm text-gray-600">Capital</div>
              <div className="font-semibold text-green-700">
                {formatCurrency(venta.montoCapital || 0)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FiPercent className="h-4 w-4 text-orange-600" />
            <div>
              <div className="text-sm text-gray-600">Intereses</div>
              <div className="font-semibold text-orange-700">
                {formatCurrency(venta.montoIntereses || 0)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Total a Pagar</div>
              <div className="font-semibold text-blue-700">
                {formatCurrency((venta.montoCapital || 0) + (venta.montoIntereses || 0))}
              </div>
            </div>
          </div>
        </div>

        {onVerAmortizacion && (
          <div className="flex justify-center pt-2">
            <Button 
              onClick={onVerAmortizacion}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Ver Tabla de Amortización
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 