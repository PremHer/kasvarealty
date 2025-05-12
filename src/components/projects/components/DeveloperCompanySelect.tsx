import { useDeveloperCompanies } from '@/hooks/useDeveloperCompanies'

interface DeveloperCompanySelectProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

export default function DeveloperCompanySelect({
  value,
  onChange,
  required = false,
  className = ''
}: DeveloperCompanySelectProps) {
  const { companies, isLoading, error } = useDeveloperCompanies()

  if (isLoading) {
    return (
      <select
        disabled
        className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 ${className}`}
      >
        <option>Cargando empresas...</option>
      </select>
    )
  }

  if (error) {
    return (
      <select
        disabled
        className={`w-full px-4 py-2.5 rounded-lg border border-red-300 bg-red-50 text-red-500 ${className}`}
      >
        <option>Error al cargar empresas</option>
      </select>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={`w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 ${className}`}
    >
      <option value="">Seleccione una empresa</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.businessName} - {company.ruc}
        </option>
      ))}
    </select>
  )
} 