'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import StatCard from '@/components/ui/stat-card'
import ActivityCard from '@/components/ui/activity-card'
import { 
  ProjectsBarChart,
  UnitsPieChart,
  SalesLineChart,
  TrendsAreaChart,
  CompaniesBarChart,
  UsersPieChart
} from '@/components/ui/charts'
import { 
  FiHome, 
  FiDollarSign, 
  FiTrendingUp,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiBarChart2
} from 'react-icons/fi'

interface DashboardStats {
  proyectosActivos: number
  unidadesDisponibles: number
  ventasMes: number
  ingresosMes: number
  proyectosLotizacion: number
  proyectosCementerio: number
  lotesDisponibles: number
  unidadesCementerioDisponibles: number
}

interface SystemStats {
  totalEmpresas: number
  totalUsuarios: number
  totalClientes: number
  totalProyectos: number
  proyectosLotizacion: number
  proyectosCementerio: number
  totalLotes: number
  lotesDisponibles: number
  totalUnidadesCementerio: number
  unidadesCementerioDisponibles: number
  totalVentas: number
  ingresosTotales: number
  usuariosActivos: number
  usuariosInactivos: number
  porcentajeLotesDisponibles: number
  porcentajeUnidadesCementerioDisponibles: number
  porcentajeUsuariosActivos: number
}

interface Activity {
  id: string
  tipo: string
  descripcion: string
  proyecto: string
  cliente?: string
  fecha: string
  monto?: number
}

interface ChartData {
  proyectosPorTipo: any[]
  unidadesDistribucion: any[]
  ventasMensuales: any[]
  tendencias: any[]
  empresasData: any[]
  usuariosData: any[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | SystemStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activityRes, chartsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity'),
          fetch('/api/dashboard/charts')
        ])

        if (!statsRes.ok || !activityRes.ok || !chartsRes.ok) {
          throw new Error('Error al cargar datos del dashboard')
        }

        const [statsData, activityData, chartsData] = await Promise.all([
          statsRes.json(),
          activityRes.json(),
          chartsRes.json()
        ])

        setStats(statsData)
        setActivity(activityData)
        setChartData(chartsData)
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Bienvenido, {session?.user?.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSuperAdmin ? 'Panel de control del sistema' : 'Panel de control y estadísticas del sistema'}
            </p>
          </div>
        </div>
      </div>

      {isSuperAdmin ? (
        // Dashboard para SUPER_ADMIN
        <>
          {/* Estadísticas principales del sistema */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Empresas"
              value={(stats as SystemStats)?.totalEmpresas || 0}
              icon={FiHome}
              description="Total de empresas registradas"
            />
            <StatCard
              title="Usuarios"
              value={(stats as SystemStats)?.totalUsuarios || 0}
              icon={FiUser}
              description="Total de usuarios del sistema"
            />
            <StatCard
              title="Clientes"
              value={(stats as SystemStats)?.totalClientes || 0}
              icon={FiUsers}
              description="Total de clientes registrados"
            />
            <StatCard
              title="Proyectos"
              value={(stats as SystemStats)?.totalProyectos || 0}
              icon={FiHome}
              description="Total de proyectos activos"
            />
          </div>

          {/* Estadísticas de ventas e ingresos */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Ventas Totales"
              value={(stats as SystemStats)?.totalVentas || 0}
              icon={FiDollarSign}
              description="Total de ventas realizadas"
            />
            <StatCard
              title="Ingresos Totales"
              value={`$${(stats as SystemStats)?.ingresosTotales.toLocaleString() || 0}`}
              icon={FiTrendingUp}
              description="Ingresos totales del sistema"
            />
            <StatCard
              title="Usuarios Activos"
              value={(stats as SystemStats)?.usuariosActivos || 0}
              icon={FiUserCheck}
              description="Usuarios con cuenta activa"
            />
            <StatCard
              title="Usuarios Inactivos"
              value={(stats as SystemStats)?.usuariosInactivos || 0}
              icon={FiUserX}
              description="Usuarios con cuenta inactiva"
            />
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de proyectos por tipo */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <div className="flex items-center">
                  <FiBarChart2 className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-800">Proyectos por Tipo</h3>
                </div>
              </div>
              <div className="p-6">
                {chartData?.proyectosPorTipo && chartData.proyectosPorTipo.length > 0 ? (
                  <ProjectsBarChart data={chartData.proyectosPorTipo} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de distribución de usuarios */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                <div className="flex items-center">
                  <FiUser className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-800">Distribución de Usuarios</h3>
                </div>
              </div>
              <div className="p-6">
                {chartData?.usuariosData && chartData.usuariosData.length > 0 ? (
                  <UsersPieChart data={chartData.usuariosData} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gráficos de tendencias */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de ventas mensuales */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                <div className="flex items-center">
                  <FiDollarSign className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-800">Ventas Mensuales</h3>
                </div>
              </div>
              <div className="p-6">
                {chartData?.ventasMensuales && chartData.ventasMensuales.length > 0 ? (
                  <SalesLineChart data={chartData.ventasMensuales} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de tendencias */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                <div className="flex items-center">
                  <FiTrendingUp className="h-6 w-6 text-orange-600 mr-3" />
                  <h3 className="text-lg font-semibold text-orange-800">Tendencias</h3>
                </div>
              </div>
              <div className="p-6">
                {chartData?.tendencias && chartData.tendencias.length > 0 ? (
                  <TrendsAreaChart data={chartData.tendencias} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas detalladas por tipo de proyecto */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Proyectos de Lotización */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                <div className="flex items-center">
                  <FiMapPin className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-800">Proyectos de Lotización</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Proyectos Activos</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats as SystemStats)?.proyectosLotizacion || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Lotes Totales</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats as SystemStats)?.totalLotes || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium text-gray-600">Lotes Disponibles</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {(stats as SystemStats)?.lotesDisponibles || 0}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {(stats as SystemStats)?.porcentajeLotesDisponibles || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proyectos de Cementerio */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                <div className="flex items-center">
                  <FiUsers className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-800">Proyectos de Cementerio</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Proyectos Activos</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats as SystemStats)?.proyectosCementerio || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Unidades Totales</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats as SystemStats)?.totalUnidadesCementerio || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium text-gray-600">Unidades Disponibles</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {(stats as SystemStats)?.unidadesCementerioDisponibles || 0}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {(stats as SystemStats)?.porcentajeUnidadesCementerioDisponibles || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        // Dashboard para otros roles
        <>
          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Proyectos Activos"
              value={(stats as DashboardStats)?.proyectosActivos || 0}
              icon={FiHome}
              description="Total de proyectos en desarrollo"
            />
            <StatCard
              title="Unidades Disponibles"
              value={(stats as DashboardStats)?.unidadesDisponibles || 0}
              icon={FiCalendar}
              description="Unidades listas para venta"
            />
            <StatCard
              title="Ventas del Mes"
              value={(stats as DashboardStats)?.ventasMes || 0}
              icon={FiDollarSign}
              description="Total de ventas realizadas"
            />
            <StatCard
              title="Ingresos del Mes"
              value={`$${(stats as DashboardStats)?.ingresosMes.toLocaleString() || 0}`}
              icon={FiTrendingUp}
              description="Ingresos totales del mes"
            />
          </div>

          {/* Gráficos para usuarios normales */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de distribución de unidades */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <div className="flex items-center">
                  <FiBarChart2 className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-800">Distribución de Unidades</h3>
                </div>
              </div>
              <div className="p-6">
                {chartData?.unidadesDistribucion && chartData.unidadesDistribucion.length > 0 ? (
                  <UnitsPieChart data={chartData.unidadesDistribucion} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de ventas mensuales */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                <div className="flex items-center">
                  <FiDollarSign className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-800">Ventas Mensuales</h3>
                </div>
              </div>
              <div className="p-6">
                {chartData?.ventasMensuales && chartData.ventasMensuales.length > 0 ? (
                  <SalesLineChart data={chartData.ventasMensuales} />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas detalladas por tipo de proyecto */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Proyectos de Lotización */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                <div className="flex items-center">
                  <FiMapPin className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-800">Proyectos de Lotización</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Proyectos Activos</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats as DashboardStats)?.proyectosLotizacion || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium text-gray-600">Lotes Disponibles</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats as DashboardStats)?.lotesDisponibles || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Proyectos de Cementerio */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                <div className="flex items-center">
                  <FiUsers className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-purple-800">Proyectos de Cementerio</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Proyectos Activos</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats as DashboardStats)?.proyectosCementerio || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium text-gray-600">Unidades Disponibles</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {(stats as DashboardStats)?.unidadesCementerioDisponibles || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Actividad Reciente */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <div className="flex items-center">
            <FiCalendar className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-800">Actividad Reciente</h3>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {activity.length > 0 ? (
            activity.map((item) => {
              let icon = FiHome
              let status: 'success' | 'info' | 'warning' = 'info'
              
              switch (item.tipo) {
                case 'VENTA_LOTE':
                  icon = FiDollarSign
                  status = 'success'
                  break
                case 'PROYECTO_CREADO':
                  icon = FiHome
                  status = 'info'
                  break
                case 'USUARIO_CREADO':
                  icon = FiUser
                  status = 'info'
                  break
                case 'EMPRESA_CREADA':
                  icon = FiUsers
                  status = 'warning'
                  break
                default:
                  icon = FiCalendar
                  status = 'info'
              }

              return (
                <ActivityCard
                  key={item.id}
                  title={item.descripcion}
                  description={`Proyecto: ${item.proyecto}${item.cliente ? ` | Cliente: ${item.cliente}` : ''}`}
                  icon={icon}
                  date={new Date(item.fecha)}
                  status={status}
                />
              )
            })
          ) : (
            <div className="p-6 text-center text-gray-500">
              No hay actividad reciente para mostrar
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 