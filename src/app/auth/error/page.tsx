'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/ui/logo'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Credenciales inválidas'
      case 'UserNotFound':
        return 'Usuario no encontrado'
      case 'UserInactive':
        return 'Usuario inactivo'
      case 'InvalidPassword':
        return 'Contraseña incorrecta'
      default:
        return 'Error al iniciar sesión'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <Logo size="md" className="mb-4" />
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Error de Autenticación
          </h2>
          <p className="mt-2 text-center text-sm text-red-600">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/auth/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
} 