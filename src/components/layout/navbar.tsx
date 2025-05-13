'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiHome, 
  FiShoppingCart, 
  FiUsers, 
  FiSettings, 
  FiLogOut,
  FiMenu,
  FiX,
  FiUserPlus,
  FiUser,
  FiChevronDown
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import Logo from '@/components/ui/logo'
import type { Rol } from '@prisma/client'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Proyectos', href: '/dashboard/projects', icon: FiShoppingCart },
  { name: 'Clientes', href: '/clientes', icon: FiUsers },
  { name: 'Configuración', href: '/configuracion', icon: FiSettings },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<Rol | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role as Rol)
    }
  }, [session])

  const canManageUsers = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL',
    'SALES_MANAGER',
    'PROJECT_MANAGER',
    'FINANCE_MANAGER'
  ].includes(userRole as Rol)

  const canManageEmpresas = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL'
  ].includes(userRole as Rol)

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Navegación Principal */}
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0">
              <Logo size="md" />
            </div>

            {/* Navegación Desktop */}
            <div className="hidden sm:flex sm:ml-10 sm:space-x-4 lg:space-x-8 flex-1 justify-center">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
              {canManageUsers && (
                <Link
                  href="/dashboard/users"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/dashboard/users'
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <FiUserPlus className="h-5 w-5 mr-2" />
                  Usuarios
                </Link>
              )}
              {canManageEmpresas && (
                <Link
                  href="/dashboard/empresas"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === '/dashboard/empresas'
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <FiHome className="h-5 w-5 mr-2" />
                  Empresas
                </Link>
              )}
            </div>
          </div>

          {/* Menú de Usuario */}
          <div className="hidden sm:flex sm:items-center sm:ml-6">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                    <FiUser className="h-5 w-5" />
                  </div>
                  <span className="ml-2">{session?.user?.name}</span>
                  <FiChevronDown className="ml-1 h-5 w-5 text-gray-400" />
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiUser className="mr-3 h-5 w-5 text-gray-400" />
                      Mi Perfil
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        signOut()
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      <FiLogOut className="mr-3 h-5 w-5 text-gray-400" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botón de menú móvil */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMobileMenuOpen ? (
                <FiX className="block h-6 w-6" />
              ) : (
                <FiMenu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-base font-medium ${
                    isActive
                      ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                      : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <item.icon className="h-6 w-6 mr-3" />
                  {item.name}
                </Link>
              )
            })}
            {canManageUsers && (
              <Link
                href="/dashboard/users"
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  pathname === '/dashboard/users'
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                    : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiUserPlus className="h-6 w-6 mr-3" />
                Usuarios
              </Link>
            )}
            {canManageEmpresas && (
              <Link
                href="/dashboard/empresas"
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  pathname === '/dashboard/empresas'
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                    : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiHome className="h-6 w-6 mr-3" />
                Empresas
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
} 