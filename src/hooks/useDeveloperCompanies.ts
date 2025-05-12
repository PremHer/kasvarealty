import { useState, useEffect } from 'react'
import { DeveloperCompany } from '@/types/project'

interface UseDeveloperCompaniesProps {
  onError?: (error: Error) => void
}

export function useDeveloperCompanies({ onError }: UseDeveloperCompaniesProps = {}) {
  const [companies, setCompanies] = useState<DeveloperCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/developer-companies')
        if (!response.ok) {
          throw new Error('Error al cargar empresas desarrolladoras')
        }
        const data = await response.json()
        setCompanies(data)
      } catch (error) {
        const errorMessage = error instanceof Error ? error : new Error('Error desconocido')
        setError(errorMessage)
        onError?.(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompanies()
  }, [onError])

  return {
    companies,
    isLoading,
    error
  }
} 