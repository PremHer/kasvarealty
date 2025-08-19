'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'

// Colores para los gráficos
const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#8B5CF6',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',
  info: '#06B6D4'
}

// Gráfico de barras para comparar proyectos
export function ProjectsBarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="lotizacion" fill={COLORS.secondary} name="Lotización" />
        <Bar dataKey="cementerio" fill={COLORS.accent} name="Cementerio" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Gráfico de dona para distribución de unidades
export function UnitsPieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Gráfico de líneas para ventas mensuales
export function SalesLineChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="ventas" 
          stroke={COLORS.primary} 
          strokeWidth={2}
          name="Ventas"
        />
        <Line 
          type="monotone" 
          dataKey="ingresos" 
          stroke={COLORS.success} 
          strokeWidth={2}
          name="Ingresos"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Gráfico de área para tendencias
export function TrendsAreaChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="periodo" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="proyectos" 
          stackId="1" 
          stroke={COLORS.primary} 
          fill={COLORS.primary} 
          fillOpacity={0.6}
          name="Proyectos"
        />
        <Area 
          type="monotone" 
          dataKey="unidades" 
          stackId="1" 
          stroke={COLORS.secondary} 
          fill={COLORS.secondary} 
          fillOpacity={0.6}
          name="Unidades"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Gráfico de barras horizontales para comparar empresas
export function CompaniesBarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="empresa" type="category" width={80} />
        <Tooltip />
        <Legend />
        <Bar dataKey="proyectos" fill={COLORS.primary} name="Proyectos" />
        <Bar dataKey="ventas" fill={COLORS.success} name="Ventas" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Gráfico de dona para distribución de usuarios
export function UsersPieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
} 