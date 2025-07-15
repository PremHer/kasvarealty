import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FiPlus, FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle, FiXCircle, FiEye, FiCalendar, FiCreditCard, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi'
import { useToast } from '@/components/ui/use-toast'
import VentaModal from '@/components/ventas/VentaModal'
import CuotasModal from '@/components/ventas/CuotasModal'
import { ApproveVentaAlert } from '@/components/ventas/ApproveVentaAlert'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const handleApproveVenta = async (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
  const tipoUnidad = tipoVenta === 'LOTE' ? 'lote' : 'unidad de cementerio'
  
  if (!confirm(`¿Estás seguro de que quieres aprobar esta venta?\n\nEsta acción:\n• Cambiará el estado de la venta a APROBADA\n• Marcará el ${tipoUnidad} como VENDIDO\n• Ya no se podrá revertir fácilmente`)) {
    return
  }

  try {
    const response = await fetch(`/api/ventas/${ventaId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accion: 'APROBAR',
        observaciones: 'Venta aprobada desde el panel de proyecto'
      })
    })

    if (response.ok) {
      toast({
        title: 'Venta aprobada exitosamente',
        description: `La venta ha sido aprobada y el ${tipoUnidad} marcado como vendido`,
        variant: 'default'
      })
      fetchVentas()
      fetchStats()
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al aprobar la venta')
    }
  } catch (error) {
    console.error('Error:', error)
    toast({
      title: 'Error al aprobar',
      description: error instanceof Error ? error.message : 'No se pudo aprobar la venta',
      variant: 'destructive'
    })
  }
}

export default function ProjectVentas({ proyectoId, tipoProyecto }: ProjectVentasProps) {
  const { data: session } = useSession()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [stats, setStats] = useState({
    totalVentas: 0,
    ventasPendientes: 0,
    ventasAprobadas: 0,
    montoTotal: 0,
    ventasContado: 0,
    ventasCuotas: 0,
    cuotasPendientes: 0,
    cuotasVencidas: 0
  })
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCuotasModalOpen, setIsCuotasModalOpen] = useState(false)
  const [modalTipoVenta, setModalTipoVenta] = useState<'LOTE' | 'UNIDAD_CEMENTERIO'>('LOTE')
  const [selectedVentaForCuotas, setSelectedVentaForCuotas] = useState<{id: string, tipo: 'LOTE' | 'UNIDAD_CEMENTERIO'} | null>(null)
  const [approveAlertOpen, setApproveAlertOpen] = useState(false)
  const [selectedVentaForApprove, setSelectedVentaForApprove] = useState<Venta | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const { toast } = useToast()

  const handleApproveVenta = async (ventaId: string, tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    // Buscar la venta seleccionada
    const venta = ventas.find(v => v.id === ventaId)
    if (!venta) {
      toast({
        title: 'Error',
        description: 'No se encontró la venta seleccionada',
        variant: 'destructive'
      })
      return
    }

    // Configurar la venta para la alerta
    setSelectedVentaForApprove(venta)
    setApproveAlertOpen(true)
  }

  const handleConfirmApprove = async () => {
    if (!selectedVentaForApprove) return

    setIsApproving(true)
    try {
      const response = await fetch(`/api/ventas/${selectedVentaForApprove.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion: 'APROBAR',
          observaciones: 'Venta aprobada desde el panel de proyecto'
        })
      })

      if (response.ok) {
        const tipoUnidad = selectedVentaForApprove.tipoVenta === 'LOTE' ? 'lote' : 'unidad de cementerio'
        toast({
          title: 'Venta aprobada exitosamente',
          description: `La venta ha sido aprobada y el ${tipoUnidad} marcado como vendido`,
          variant: 'default'
        })
        fetchVentas()
        fetchStats()
        setApproveAlertOpen(false)
        setSelectedVentaForApprove(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al aprobar la venta')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error al aprobar',
        description: error instanceof Error ? error.message : 'No se pudo aprobar la venta',
        variant: 'destructive'
      })
    } finally {
      setIsApproving(false)
    }
  }
} 