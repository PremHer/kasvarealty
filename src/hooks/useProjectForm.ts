import { useState } from 'react'
import { ProjectFormData } from '@/types/project'

interface UseProjectFormProps {
  initialData?: ProjectFormData
  onSubmit: (data: ProjectFormData) => Promise<void>
}

interface FormErrors {
  name?: string
  description?: string
  location?: string
  startDate?: string
  type?: string
  developerCompanyId?: string
}

const initialFormData: ProjectFormData = {
  name: '',
  description: '',
  location: '',
  startDate: '',
  type: 'CASA_INDIVIDUAL',
  developerCompanyId: '',
  departamento: '',
  provincia: '',
  distrito: '',
  latitud: '',
  longitud: '',
  precioTerreno: '',
  inversionInicial: '',
  totalArea: ''
}

export function useProjectForm({ initialData, onSubmit }: UseProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialData || initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.description) {
      newErrors.description = 'La descripción es requerida'
    }

    if (!formData.location) {
      newErrors.location = 'La ubicación es requerida'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida'
    }

    if (!formData.type) {
      newErrors.type = 'El tipo de proyecto es requerido'
    }

    if (!formData.developerCompanyId) {
      newErrors.developerCompanyId = 'La empresa desarrolladora es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar el error cuando el campo se modifica
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(formData)
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
      setError(error instanceof Error ? error.message : 'Error al enviar el formulario')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    errors,
    isSubmitting,
    error,
    handleChange,
    handleSubmit
  }
} 