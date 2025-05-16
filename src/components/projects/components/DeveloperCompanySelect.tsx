import { useState, useEffect } from 'react'

interface DeveloperCompany {
  id: string
  name: string
}

interface DeveloperCompanySelectProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export default function DeveloperCompanySelect({ value, onChange, required }: DeveloperCompanySelectProps) {
  const [companies, setCompanies] = useState<DeveloperCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/empresas')
        if (!response.ok) {
          throw new Error('Error al cargar las empresas desarrolladoras')
        }
        const data = await response.json()
        // Transformar los datos al formato esperado
        const formattedCompanies = data.map((company: any) => ({
          id: company.id,
          name: company.nombre
        }))
        setCompanies(formattedCompanies)
      } catch (error) {
        console.error('Error:', error)
        setError(error instanceof Error ? error.message : 'Error al cargar las empresas desarrolladoras')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  if (isLoading) {
    return (
      <select
        disabled
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900 opacity-50"
      >
        <option>Cargando...</option>
      </select>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white text-gray-900"
      required={required}
    >
      <option value="">Seleccione una empresa</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  )
} 