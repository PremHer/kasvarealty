'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import StatCard from '@/components/ui/stat-card'
import ActivityCard from '@/components/ui/activity-card'
import { 
  FiHome, 
  FiDollarSign, 
  FiTrendingUp,
  FiCalendar
} from 'react-icons/fi'

interface DashboardStats {
  proyectosActivos: number
  unidadesDisponibles: number
  ventasMes: number
  ingresosMes: number
}

interface Activity {
  id: string
  tipo: string
  descripcion: string
  proyecto: string
  fecha: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity')
        ])

        if (!statsRes.ok || !activityRes.ok) {
          throw new Error('Error al cargar datos del dashboard')
        }

        const [statsData, activityData] = await Promise.all([
          statsRes.json(),
          activityRes.json()
        ])

        setStats(statsData)
        setActivity(activityData)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Bienvenido, {session?.user?.name}
          </h2>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Proyectos Activos"
          value={stats?.proyectosActivos || 0}
          icon={FiHome}
          description="Total de proyectos en desarrollo"
        />
        <StatCard
          title="Unidades Disponibles"
          value={stats?.unidadesDisponibles || 0}
          icon={FiCalendar}
          description="Unidades listas para venta"
        />
        <StatCard
          title="Ventas del Mes"
          value={stats?.ventasMes || 0}
          icon={FiDollarSign}
          description="Total de ventas realizadas"
        />
        <StatCard
          title="Ingresos del Mes"
          value={`$${stats?.ingresosMes.toLocaleString() || 0}`}
          icon={FiTrendingUp}
          description="Ingresos totales del mes"
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Actividad Reciente
        </h3>
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          {activity.map((item) => (
            <ActivityCard
              key={item.id}
              title={item.descripcion}
              description={`Proyecto: ${item.proyecto}`}
              icon={FiCalendar}
              date={new Date(item.fecha)}
              status={item.tipo === 'VENTA' ? 'success' : 'info'}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 