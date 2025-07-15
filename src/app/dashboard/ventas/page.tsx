'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, DollarSign, TrendingUp, Users, Clock, BarChart3 } from 'lucide-react'
import VentaList from '@/components/ventas/VentaList'
import VentaModal from '@/components/ventas/VentaModal'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface Stats {
  totalVentas: number
  ventasPendientes: number
  ventasAprobadas: number
  montoTotal: number
}

export default function VentasPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    totalVentas: 0,
    ventasPendientes: 0,
    ventasAprobadas: 0,
    montoTotal: 0
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTipoVenta, setModalTipoVenta] = useState<'LOTE' | 'UNIDAD_CEMENTERIO'>('LOTE')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const userRole = session?.user?.role || ''
  const userId = session?.user?.id || ''

  // Verificar permisos
  const canCreateSales = ['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP'].includes(userRole)
  const canViewSales = ['SUPER_ADMIN', 'SALES_MANAGER', 'SALES_REP', 'SALES_ASSISTANT'].includes(userRole)

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/ventas/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canViewSales) {
      fetchStats()
    }
  }, [canViewSales])

  const handleCreateVenta = (tipoVenta: 'LOTE' | 'UNIDAD_CEMENTERIO') => {
    setModalTipoVenta(tipoVenta)
    setIsModalOpen(true)
  }

  const handleVentaSuccess = () => {
    fetchStats() // Recargar estadísticas
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  if (!canViewSales) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder al sistema de ventas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Ventas</h1>
          <p className="text-muted-foreground">
            Gestiona las ventas de lotes y unidades de cementerio
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/ventas/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          {canCreateSales && (
            <>
              <Button onClick={() => handleCreateVenta('LOTE')}>
                <Plus className="mr-2 h-4 w-4" />
                Vender Lote
              </Button>
              <Button onClick={() => handleCreateVenta('UNIDAD_CEMENTERIO')}>
                <Plus className="mr-2 h-4 w-4" />
                Vender Unidad
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVentas}</div>
              <p className="text-xs text-muted-foreground">
                Ventas registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ventasPendientes}</div>
              <p className="text-xs text-muted-foreground">
                Esperando aprobación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ventasAprobadas}</div>
              <p className="text-xs text-muted-foreground">
                Ventas confirmadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.montoTotal)}</div>
              <p className="text-xs text-muted-foreground">
                Valor total de ventas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs de ventas */}
      <Tabs defaultValue="todas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todas">Todas las ventas</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="aprobadas">Aprobadas</TabsTrigger>
          <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          <VentaList userRole={userRole} userId={userId} />
        </TabsContent>

        <TabsContent value="pendientes" className="space-y-4">
          <VentaList userRole={userRole} userId={userId} estado="PENDIENTE" />
        </TabsContent>

        <TabsContent value="aprobadas" className="space-y-4">
          <VentaList userRole={userRole} userId={userId} estado="APROBADA" />
        </TabsContent>

        <TabsContent value="canceladas" className="space-y-4">
          <VentaList userRole={userRole} userId={userId} estado="CANCELADA" />
        </TabsContent>
      </Tabs>

      {/* Modal para crear venta */}
      <VentaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleVentaSuccess}
        tipoVenta={modalTipoVenta}
      />
    </div>
  )
} 