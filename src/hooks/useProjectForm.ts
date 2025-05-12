import { useState } from 'react'
import { Project, ProjectFormData } from '@/types/project'

interface UseProjectFormProps {
  initialData?: Project
  onSubmit: (data: ProjectFormData) => Promise<void>
}

export function useProjectForm({ initialData, onSubmit }: UseProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(() => ({
    name: initialData?.name || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    budget: initialData?.budget?.toString() || '',
    type: initialData?.type || '' as any,
    totalArea: initialData?.totalArea?.toString() || '',
    usableArea: initialData?.usableArea?.toString() || '',
    totalUnits: initialData?.totalUnits?.toString() || '',
    developerCompanyId: initialData?.developerCompanyId || ''
  }))

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit(formData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al procesar el formulario')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    error
  }
} 