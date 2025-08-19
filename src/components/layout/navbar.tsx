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
  FiChevronDown,
  FiDollarSign,
  FiActivity,
  FiCreditCard,
  FiDatabase,
  FiAlertTriangle,
  FiFileText,
  FiCalendar
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import Logo from '@/components/ui/logo'
import Notifications from '@/components/layout/notifications'
import type { Rol } from '@prisma/client'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Proyectos', href: '/dashboard/projects', icon: FiShoppingCart },
  { name: 'Contratos', href: '/dashboard/contratos', icon: FiFileText },
  { name: 'Configuración', href: '/configuracion', icon: FiSettings },
]

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<Rol | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isGestionMenuOpen, setIsGestionMenuOpen] = useState(false)

  useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role as Rol)
    }
  }, [session])

  // Cerrar menús desplegables cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.gestion-menu')) {
        setIsGestionMenuOpen(false)
      }
      if (!target.closest('.user-menu')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Función para obtener el nombre del rol en español
  const getRoleDisplayName = (role: Rol | null): string => {
    if (!role) return ''
    
    const roleNames: Record<Rol, string> = {
      SUPER_ADMIN: 'Super Administrador',
      ADMIN: 'Administrador',
      GERENTE_GENERAL: 'Gerente General',
      DEVELOPER: 'Desarrollador',
      SALES_MANAGER: 'Gerente de Ventas',
      SALES_REP: 'Representante de Ventas',
      SALES_ASSISTANT: 'Asistente de Ventas',
      SALES_COORDINATOR: 'Coordinador de Ventas',
      PROJECT_MANAGER: 'Gerente de Proyectos',
      CONSTRUCTION_SUPERVISOR: 'Supervisor de Construcción',
      QUALITY_CONTROL: 'Control de Calidad',
      PROJECT_ASSISTANT: 'Asistente de Proyectos',
      FINANCE_MANAGER: 'Gerente Financiero',
      ACCOUNTANT: 'Contador',
      FINANCE_ASSISTANT: 'Asistente Financiero',
      INVESTOR: 'Inversionista',
      GUEST: 'Invitado'
    }
    
    return roleNames[role] || role
  }

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

  const canViewAuditoria = [
    'SUPER_ADMIN',
    'ADMIN',
    'GERENTE_GENERAL',
    'FINANCE_MANAGER'
  ].includes(userRole as Rol)

  const canViewSales = [
    'SUPER_ADMIN',
    'SALES_MANAGER',
    'SALES_REP',
    'SALES_ASSISTANT'
  ].includes(userRole as Rol)

  const canManageComisiones = [
    'SUPER_ADMIN',
    'FINANCE_MANAGER',
    'SALES_MANAGER',
    'ACCOUNTANT'
  ].includes(userRole as Rol)

  const canManageCancelaciones = [
    'SUPER_ADMIN',
    'ADMIN',
    'SALES_MANAGER',
    'FINANCE_MANAGER',
    'GERENTE_GENERAL'
  ].includes(userRole as Rol)

  const canManageReservas = [
    'SUPER_ADMIN',
    'ADMIN',
    'SALES_MANAGER',
    'SALES_REP',
    'SALES_ASSISTANT',
    'SALES_COORDINATOR',
    'GERENTE_GENERAL'
  ].includes(userRole as Rol)

  // Verificar si alguna de las rutas de gestión está activa
  const isGestionActive = pathname === '/clientes' || 
                          pathname === '/dashboard/users' || 
                          pathname === '/dashboard/vendedores' ||
                          pathname === '/dashboard/cancelaciones' ||
                          pathname === '/dashboard/reservas'

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Logo size="md" />
          </div>

          {/* Navegación Desktop */}
          <div className="hidden lg:flex lg:items-center lg:space-x-6 xl:space-x-8">
            {navigation.slice(0, -1).map((item) => {
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
            
            {/* Menú desplegable de Gestión */}
            <div className="relative gestion-menu">
              <button
                onClick={() => setIsGestionMenuOpen(!isGestionMenuOpen)}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isGestionActive
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiDatabase className="h-5 w-5 mr-2" />
                Gestión
                <FiChevronDown className="ml-1 h-4 w-4" />
              </button>

              {isGestionMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <Link
                      href="/clientes"
                      className={`flex items-center px-4 py-2 text-sm ${
                        pathname === '/clientes'
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                      onClick={() => setIsGestionMenuOpen(false)}
                    >
                      <FiUsers className="mr-3 h-5 w-5" />
                      Clientes
                    </Link>
                    {canManageUsers && (
                      <Link
                        href="/dashboard/users"
                        className={`flex items-center px-4 py-2 text-sm ${
                          pathname === '/dashboard/users'
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        role="menuitem"
                        onClick={() => setIsGestionMenuOpen(false)}
                      >
                        <FiUserPlus className="mr-3 h-5 w-5" />
                        Usuarios
                      </Link>
                    )}
                    {canManageUsers && (
                      <Link
                        href="/dashboard/vendedores"
                        className={`flex items-center px-4 py-2 text-sm ${
                          pathname === '/dashboard/vendedores'
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        role="menuitem"
                        onClick={() => setIsGestionMenuOpen(false)}
                      >
                        <FiUser className="mr-3 h-5 w-5" />
                        Vendedores
                      </Link>
                    )}
                    {canManageCancelaciones && (
                      <Link
                        href="/dashboard/cancelaciones"
                        className={`flex items-center px-4 py-2 text-sm ${
                          pathname === '/dashboard/cancelaciones'
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        role="menuitem"
                        onClick={() => setIsGestionMenuOpen(false)}
                      >
                        <FiAlertTriangle className="mr-3 h-5 w-5" />
                        Cancelaciones
                      </Link>
                    )}
                    {canManageReservas && (
                      <Link
                        href="/dashboard/reservas"
                        className={`flex items-center px-4 py-2 text-sm ${
                          pathname === '/dashboard/reservas'
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        role="menuitem"
                        onClick={() => setIsGestionMenuOpen(false)}
                      >
                        <FiCalendar className="mr-3 h-5 w-5" />
                        Reservas
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {canViewSales && (
              <Link
                href="/dashboard/ventas"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/dashboard/ventas'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiDollarSign className="h-5 w-5 mr-2" />
                Ventas
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
            {canViewAuditoria && (
              <Link
                href="/dashboard/auditoria"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/dashboard/auditoria'
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiActivity className="h-5 w-5 mr-2" />
                Auditoría
              </Link>
            )}
            {navigation.slice(-1).map((item) => {
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
          </div>

          {/* Menú de Usuario */}
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <div className="hidden sm:block">
              <Notifications />
            </div>
            
            <div className="relative user-menu">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                    <FiUser className="h-5 w-5" />
                  </div>
                  <div className="hidden lg:block ml-2 text-left">
                    <div className="font-medium">{session?.user?.name}</div>
                    <div className="text-xs text-gray-500">{getRoleDisplayName(userRole)}</div>
                  </div>
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

            {/* Botón de menú móvil */}
            <div className="flex items-center lg:hidden">
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
      </div>

      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          {/* Información del usuario en móvil */}
          <div className="px-3 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
                <FiUser className="h-6 w-6" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{session?.user?.name}</div>
                <div className="text-sm text-gray-500">{getRoleDisplayName(userRole)}</div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 pb-3 space-y-1">
            {navigation.slice(0, -1).map((item) => {
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
            
            {/* Sección de Gestión en móvil */}
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Gestión
              </div>
            </div>
            <Link
              href="/clientes"
              className={`flex items-center px-3 py-2 text-base font-medium ${
                pathname === '/clientes'
                  ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                  : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <FiUsers className="h-6 w-6 mr-3" />
              Clientes
            </Link>
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
            {canManageUsers && (
              <Link
                href="/dashboard/vendedores"
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  pathname === '/dashboard/vendedores'
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                    : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiUser className="h-6 w-6 mr-3" />
                Vendedores
              </Link>
            )}
            {canManageCancelaciones && (
              <Link
                href="/dashboard/cancelaciones"
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  pathname === '/dashboard/cancelaciones'
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                    : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiAlertTriangle className="h-6 w-6 mr-3" />
                Cancelaciones
              </Link>
            )}
            {canManageReservas && (
              <Link
                href="/dashboard/reservas"
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  pathname === '/dashboard/reservas'
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                    : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiCalendar className="h-6 w-6 mr-3" />
                Reservas
              </Link>
            )}
            
            {canViewSales && (
              <Link
                href="/dashboard/ventas"
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  pathname === '/dashboard/ventas'
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                    : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiDollarSign className="h-6 w-6 mr-3" />
                Ventas
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
            {canViewAuditoria && (
              <Link
                href="/dashboard/auditoria"
                className={`flex items-center px-3 py-2 text-base font-medium ${
                  pathname === '/dashboard/auditoria'
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                    : 'border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <FiActivity className="h-6 w-6 mr-3" />
                Auditoría
              </Link>
            )}
            {navigation.slice(-1).map((item) => {
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
          </div>
        </div>
      )}
    </nav>
  )
} 