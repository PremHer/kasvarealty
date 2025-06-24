'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  FiSettings, 
  FiDatabase, 
  FiMail, 
  FiShield, 
  FiUsers, 
  FiBell,
  FiGlobe,
  FiFileText,
  FiSave,
  FiAlertCircle
} from 'react-icons/fi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Breadcrumb } from '@/components/ui/breadcrumb'

interface ConfiguracionGeneral {
  nombreSitio: string
  descripcionSitio: string
  moneda: string
  zonaHoraria: string
  idioma: string
  tema: string
  colorPrimario: string
  colorSecundario: string
  tipografia: string
  logoUrl: string
  faviconUrl: string
}

interface ConfiguracionEmail {
  servidorSMTP: string
  puertoSMTP: number
  usuarioSMTP: string
  passwordSMTP: string
  emailRemitente: string
  nombreRemitente: string
  usarSSL: boolean
  usarTLS: boolean
}

interface ConfiguracionNotificaciones {
  notificacionesEmail: boolean
  notificacionesPush: boolean
  notificacionesSMS: boolean
  recordatoriosAutomaticos: boolean
  reportesAutomaticos: boolean
  alertasVentas: boolean
  alertasProyectos: boolean
}

interface ConfiguracionSeguridad {
  sesionTimeout: number
  intentosLogin: number
  bloqueoTemporal: boolean
  requerirCambioPassword: boolean
  complejidadPassword: string
  autenticacionDosFactores: boolean
}

export default function ConfiguracionPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Estados para las configuraciones
  const [configGeneral, setConfigGeneral] = useState<ConfiguracionGeneral>({
    nombreSitio: 'Kasva Realty',
    descripcionSitio: 'Sistema de gestión inmobiliaria',
    moneda: 'PEN',
    zonaHoraria: 'America/Lima',
    idioma: 'es',
    tema: 'light',
    colorPrimario: '#3B82F6',
    colorSecundario: '#1E40AF',
    tipografia: 'Inter',
    logoUrl: '',
    faviconUrl: ''
  })

  const [configEmail, setConfigEmail] = useState<ConfiguracionEmail>({
    servidorSMTP: '',
    puertoSMTP: 587,
    usuarioSMTP: '',
    passwordSMTP: '',
    emailRemitente: '',
    nombreRemitente: '',
    usarSSL: false,
    usarTLS: true
  })

  const [configNotificaciones, setConfigNotificaciones] = useState<ConfiguracionNotificaciones>({
    notificacionesEmail: true,
    notificacionesPush: false,
    notificacionesSMS: false,
    recordatoriosAutomaticos: true,
    reportesAutomaticos: false,
    alertasVentas: true,
    alertasProyectos: true
  })

  const [configSeguridad, setConfigSeguridad] = useState<ConfiguracionSeguridad>({
    sesionTimeout: 30,
    intentosLogin: 5,
    bloqueoTemporal: true,
    requerirCambioPassword: false,
    complejidadPassword: 'MEDIA',
    autenticacionDosFactores: false
  })

  // Verificar permisos
  const canManageConfig = ['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role || '')

  useEffect(() => {
    if (canManageConfig) {
      cargarConfiguraciones()
    }
  }, [canManageConfig])

  const cargarConfiguraciones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/configuraciones')
      if (response.ok) {
        const configs = await response.json()
        
        // Cargar configuraciones desde la API
        if (configs.general) {
          setConfigGeneral(configs.general)
        }
        if (configs.email) {
          setConfigEmail(configs.email)
        }
        if (configs.notificaciones) {
          setConfigNotificaciones(configs.notificaciones)
        }
        if (configs.seguridad) {
          setConfigSeguridad(configs.seguridad)
        }
      } else {
        console.error('Error al cargar configuraciones:', response.statusText)
      }
    } catch (error) {
      console.error('Error al cargar configuraciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const guardarConfiguracion = async (tipo: string, datos: any) => {
    try {
      setSaving(true)
      const response = await fetch('/api/configuraciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, datos })
      })

      if (response.ok) {
        toast({
          title: "Configuración guardada",
          description: "Los cambios se han guardado correctamente",
          variant: "default"
        })
      } else {
        throw new Error('Error al guardar configuración')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (!canManageConfig) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <CardTitle>Acceso Denegado</CardTitle>
              <CardDescription>
                No tienes permisos para acceder a la configuración del sistema.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      {/* Header mejorado */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FiSettings className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600 mt-1">Gestiona la configuración general, apariencia y funcionalidad del sistema</p>
          </div>
        </div>
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Configuración" }
          ]}
          className="mt-2"
        />
      </div>

      {/* Tabs mejorados */}
      <Tabs defaultValue="general" className="space-y-8">
        <div className="border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white border-b-0">
            <TabsTrigger 
              value="general" 
              className="flex items-center gap-3 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 data-[state=active]:border-primary-200"
            >
              <FiSettings className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger 
              value="email" 
              className="flex items-center gap-3 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 data-[state=active]:border-primary-200"
            >
              <FiMail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notificaciones" 
              className="flex items-center gap-3 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 data-[state=active]:border-primary-200"
            >
              <FiBell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
            <TabsTrigger 
              value="seguridad" 
              className="flex items-center gap-3 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700 data-[state=active]:border-primary-200"
            >
              <FiShield className="h-4 w-4" />
              <span className="hidden sm:inline">Seguridad</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Configuración General */}
        <TabsContent value="general" className="space-y-8">
          <div className="grid gap-8">
            {/* Información Básica */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiGlobe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Información Básica</CardTitle>
                    <CardDescription>Configura el nombre y descripción del sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombreSitio" className="text-sm font-medium">Nombre del Sitio</Label>
                    <Input
                      id="nombreSitio"
                      value={configGeneral.nombreSitio}
                      onChange={(e) => setConfigGeneral(prev => ({ ...prev, nombreSitio: e.target.value }))}
                      placeholder="Ej: Kasva Realty"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Este nombre aparecerá en el navegador y en el sistema</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcionSitio" className="text-sm font-medium">Descripción del Sitio</Label>
                    <Input
                      id="descripcionSitio"
                      value={configGeneral.descripcionSitio}
                      onChange={(e) => setConfigGeneral(prev => ({ ...prev, descripcionSitio: e.target.value }))}
                      placeholder="Ej: Sistema de gestión inmobiliaria"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Breve descripción del propósito del sistema</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración Regional */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiGlobe className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Configuración Regional</CardTitle>
                    <CardDescription>Define la moneda, zona horaria e idioma del sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="moneda" className="text-sm font-medium">Moneda</Label>
                    <Select value={configGeneral.moneda} onValueChange={(value) => setConfigGeneral(prev => ({ ...prev, moneda: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEN">🇵🇪 Soles (PEN)</SelectItem>
                        <SelectItem value="USD">🇺🇸 Dólares (USD)</SelectItem>
                        <SelectItem value="EUR">🇪🇺 Euros (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Moneda principal para transacciones</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zonaHoraria" className="text-sm font-medium">Zona Horaria</Label>
                    <Select value={configGeneral.zonaHoraria} onValueChange={(value) => setConfigGeneral(prev => ({ ...prev, zonaHoraria: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Lima">🇵🇪 Lima (GMT-5)</SelectItem>
                        <SelectItem value="America/New_York">🇺🇸 Nueva York (GMT-5)</SelectItem>
                        <SelectItem value="America/Los_Angeles">🇺🇸 Los Ángeles (GMT-8)</SelectItem>
                        <SelectItem value="Europe/Madrid">🇪🇸 Madrid (GMT+1)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Zona horaria para fechas y horas</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idioma" className="text-sm font-medium">Idioma</Label>
                    <Select value={configGeneral.idioma} onValueChange={(value) => setConfigGeneral(prev => ({ ...prev, idioma: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="pt">🇧🇷 Português</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Idioma de la interfaz</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Apariencia */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiSettings className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Apariencia</CardTitle>
                    <CardDescription>Personaliza el tema, colores y tipografía del sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tema" className="text-sm font-medium">Tema</Label>
                    <Select value={configGeneral.tema} onValueChange={(value) => setConfigGeneral(prev => ({ ...prev, tema: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">☀️ Claro</SelectItem>
                        <SelectItem value="dark">🌙 Oscuro</SelectItem>
                        <SelectItem value="auto">🔄 Automático</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Tema visual del sistema</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipografia" className="text-sm font-medium">Tipografía</Label>
                    <Select value={configGeneral.tipografia} onValueChange={(value) => setConfigGeneral(prev => ({ ...prev, tipografia: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Fuente principal del sistema</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="colorPrimario" className="text-sm font-medium">Color Primario</Label>
                    <div className="flex gap-3">
                      <Input
                        id="colorPrimario"
                        value={configGeneral.colorPrimario}
                        onChange={(e) => setConfigGeneral(prev => ({ ...prev, colorPrimario: e.target.value }))}
                        placeholder="#3B82F6"
                        className="h-11 flex-1"
                      />
                      <div 
                        className="w-12 h-11 rounded-lg border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: configGeneral.colorPrimario }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Color principal para botones y elementos destacados</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colorSecundario" className="text-sm font-medium">Color Secundario</Label>
                    <div className="flex gap-3">
                      <Input
                        id="colorSecundario"
                        value={configGeneral.colorSecundario}
                        onChange={(e) => setConfigGeneral(prev => ({ ...prev, colorSecundario: e.target.value }))}
                        placeholder="#1E40AF"
                        className="h-11 flex-1"
                      />
                      <div 
                        className="w-12 h-11 rounded-lg border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: configGeneral.colorSecundario }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Color secundario para elementos complementarios</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recursos */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FiFileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Recursos</CardTitle>
                    <CardDescription>Configura el logo y favicon del sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl" className="text-sm font-medium">URL del Logo</Label>
                    <Input
                      id="logoUrl"
                      value={configGeneral.logoUrl}
                      onChange={(e) => setConfigGeneral(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://ejemplo.com/logo.png"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">URL de la imagen del logo (PNG, SVG recomendado)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faviconUrl" className="text-sm font-medium">URL del Favicon</Label>
                    <Input
                      id="faviconUrl"
                      value={configGeneral.faviconUrl}
                      onChange={(e) => setConfigGeneral(prev => ({ ...prev, faviconUrl: e.target.value }))}
                      placeholder="https://ejemplo.com/favicon.ico"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">URL del favicon (ICO, PNG recomendado)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botón de guardar mejorado */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button 
              onClick={() => guardarConfiguracion('general', configGeneral)}
              disabled={saving}
              className="px-8 h-12 text-base font-medium"
            >
              <FiSave className="mr-2 h-5 w-5" />
              {saving ? 'Guardando...' : 'Guardar Configuración General'}
            </Button>
          </div>
        </TabsContent>

        {/* Configuración de Email */}
        <TabsContent value="email" className="space-y-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiMail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Configuración de Email</CardTitle>
                  <CardDescription>Configura el servidor SMTP para el envío de emails del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuración del Servidor */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración del Servidor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="servidorSMTP" className="text-sm font-medium">Servidor SMTP</Label>
                    <Input
                      id="servidorSMTP"
                      value={configEmail.servidorSMTP}
                      onChange={(e) => setConfigEmail(prev => ({ ...prev, servidorSMTP: e.target.value }))}
                      placeholder="smtp.gmail.com"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Dirección del servidor SMTP</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="puertoSMTP" className="text-sm font-medium">Puerto SMTP</Label>
                    <Input
                      id="puertoSMTP"
                      type="number"
                      value={configEmail.puertoSMTP}
                      onChange={(e) => setConfigEmail(prev => ({ ...prev, puertoSMTP: parseInt(e.target.value) }))}
                      placeholder="587"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Puerto del servidor SMTP (587, 465, 25)</p>
                  </div>
                </div>
              </div>

              {/* Credenciales */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Credenciales de Autenticación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="usuarioSMTP" className="text-sm font-medium">Usuario SMTP</Label>
                    <Input
                      id="usuarioSMTP"
                      value={configEmail.usuarioSMTP}
                      onChange={(e) => setConfigEmail(prev => ({ ...prev, usuarioSMTP: e.target.value }))}
                      placeholder="usuario@gmail.com"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Email o nombre de usuario para autenticación</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordSMTP" className="text-sm font-medium">Contraseña SMTP</Label>
                    <Input
                      id="passwordSMTP"
                      type="password"
                      value={configEmail.passwordSMTP}
                      onChange={(e) => setConfigEmail(prev => ({ ...prev, passwordSMTP: e.target.value }))}
                      placeholder="Contraseña de aplicación"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Contraseña o token de aplicación</p>
                  </div>
                </div>
              </div>

              {/* Configuración del Remitente */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración del Remitente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailRemitente" className="text-sm font-medium">Email Remitente</Label>
                    <Input
                      id="emailRemitente"
                      type="email"
                      value={configEmail.emailRemitente}
                      onChange={(e) => setConfigEmail(prev => ({ ...prev, emailRemitente: e.target.value }))}
                      placeholder="noreply@empresa.com"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Email que aparecerá como remitente</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombreRemitente" className="text-sm font-medium">Nombre Remitente</Label>
                    <Input
                      id="nombreRemitente"
                      value={configEmail.nombreRemitente}
                      onChange={(e) => setConfigEmail(prev => ({ ...prev, nombreRemitente: e.target.value }))}
                      placeholder="Empresa S.A.C."
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Nombre que aparecerá como remitente</p>
                  </div>
                </div>
              </div>

              {/* Configuración de Seguridad */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración de Seguridad</h3>
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="usarSSL"
                      checked={configEmail.usarSSL}
                      onCheckedChange={(checked) => setConfigEmail(prev => ({ ...prev, usarSSL: checked }))}
                    />
                    <div>
                      <Label htmlFor="usarSSL" className="text-sm font-medium">Usar SSL</Label>
                      <p className="text-xs text-gray-500">Conexión segura con SSL</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="usarTLS"
                      checked={configEmail.usarTLS}
                      onCheckedChange={(checked) => setConfigEmail(prev => ({ ...prev, usarTLS: checked }))}
                    />
                    <div>
                      <Label htmlFor="usarTLS" className="text-sm font-medium">Usar TLS</Label>
                      <p className="text-xs text-gray-500">Conexión segura con TLS</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botón de guardar */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button 
              onClick={() => guardarConfiguracion('email', configEmail)}
              disabled={saving}
              className="px-8 h-12 text-base font-medium"
            >
              <FiSave className="mr-2 h-5 w-5" />
              {saving ? 'Guardando...' : 'Guardar Configuración de Email'}
            </Button>
          </div>
        </TabsContent>

        {/* Configuración de Notificaciones */}
        <TabsContent value="notificaciones" className="space-y-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiBell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Configuración de Notificaciones</CardTitle>
                  <CardDescription>Gestiona cómo y cuándo recibir notificaciones del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipos de Notificaciones */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Tipos de Notificaciones</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiMail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <Label htmlFor="notificacionesEmail" className="text-sm font-medium">Notificaciones por Email</Label>
                        <p className="text-xs text-gray-500">Recibir notificaciones por correo electrónico</p>
                      </div>
                    </div>
                    <Switch
                      id="notificacionesEmail"
                      checked={configNotificaciones.notificacionesEmail}
                      onCheckedChange={(checked) => setConfigNotificaciones(prev => ({ ...prev, notificacionesEmail: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FiBell className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <Label htmlFor="notificacionesPush" className="text-sm font-medium">Notificaciones Push</Label>
                        <p className="text-xs text-gray-500">Recibir notificaciones en el navegador</p>
                      </div>
                    </div>
                    <Switch
                      id="notificacionesPush"
                      checked={configNotificaciones.notificacionesPush}
                      onCheckedChange={(checked) => setConfigNotificaciones(prev => ({ ...prev, notificacionesPush: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Notificaciones Automáticas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Notificaciones Automáticas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FiBell className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <Label htmlFor="recordatoriosAutomaticos" className="text-sm font-medium">Recordatorios Automáticos</Label>
                        <p className="text-xs text-gray-500">Enviar recordatorios automáticos de tareas</p>
                      </div>
                    </div>
                    <Switch
                      id="recordatoriosAutomaticos"
                      checked={configNotificaciones.recordatoriosAutomaticos}
                      onCheckedChange={(checked) => setConfigNotificaciones(prev => ({ ...prev, recordatoriosAutomaticos: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FiFileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <Label htmlFor="reportesAutomaticos" className="text-sm font-medium">Reportes Automáticos</Label>
                        <p className="text-xs text-gray-500">Enviar reportes automáticos por email</p>
                      </div>
                    </div>
                    <Switch
                      id="reportesAutomaticos"
                      checked={configNotificaciones.reportesAutomaticos}
                      onCheckedChange={(checked) => setConfigNotificaciones(prev => ({ ...prev, reportesAutomaticos: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Alertas Específicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Alertas Específicas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FiBell className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <Label htmlFor="alertasVentas" className="text-sm font-medium">Alertas de Ventas</Label>
                        <p className="text-xs text-gray-500">Recibir alertas sobre nuevas ventas</p>
                      </div>
                    </div>
                    <Switch
                      id="alertasVentas"
                      checked={configNotificaciones.alertasVentas}
                      onCheckedChange={(checked) => setConfigNotificaciones(prev => ({ ...prev, alertasVentas: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiSettings className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <Label htmlFor="alertasProyectos" className="text-sm font-medium">Alertas de Proyectos</Label>
                        <p className="text-xs text-gray-500">Recibir alertas sobre cambios en proyectos</p>
                      </div>
                    </div>
                    <Switch
                      id="alertasProyectos"
                      checked={configNotificaciones.alertasProyectos}
                      onCheckedChange={(checked) => setConfigNotificaciones(prev => ({ ...prev, alertasProyectos: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botón de guardar */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button 
              onClick={() => guardarConfiguracion('notificaciones', configNotificaciones)}
              disabled={saving}
              className="px-8 h-12 text-base font-medium"
            >
              <FiSave className="mr-2 h-5 w-5" />
              {saving ? 'Guardando...' : 'Guardar Configuración de Notificaciones'}
            </Button>
          </div>
        </TabsContent>

        {/* Configuración de Seguridad */}
        <TabsContent value="seguridad" className="space-y-8">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FiShield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Configuración de Seguridad</CardTitle>
                  <CardDescription>Gestiona las políticas de seguridad y autenticación del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuración de Sesión */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Configuración de Sesión</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sesionTimeout" className="text-sm font-medium">Timeout de Sesión (minutos)</Label>
                    <Input
                      id="sesionTimeout"
                      type="number"
                      value={configSeguridad.sesionTimeout}
                      onChange={(e) => setConfigSeguridad(prev => ({ ...prev, sesionTimeout: parseInt(e.target.value) }))}
                      placeholder="30"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Tiempo antes de cerrar sesión automáticamente</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intentosLogin" className="text-sm font-medium">Intentos de Login</Label>
                    <Input
                      id="intentosLogin"
                      type="number"
                      value={configSeguridad.intentosLogin}
                      onChange={(e) => setConfigSeguridad(prev => ({ ...prev, intentosLogin: parseInt(e.target.value) }))}
                      placeholder="5"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Número máximo de intentos fallidos</p>
                  </div>
                </div>
              </div>

              {/* Políticas de Contraseñas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Políticas de Contraseñas</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="complejidadPassword" className="text-sm font-medium">Complejidad de Contraseñas</Label>
                    <Select value={configSeguridad.complejidadPassword} onValueChange={(value) => setConfigSeguridad(prev => ({ ...prev, complejidadPassword: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAJA">🔓 Baja (mínimo 6 caracteres)</SelectItem>
                        <SelectItem value="MEDIA">🔒 Media (mínimo 8 caracteres, mayúsculas y números)</SelectItem>
                        <SelectItem value="ALTA">🔐 Alta (mínimo 10 caracteres, símbolos especiales)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Nivel de complejidad requerida para las contraseñas</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FiShield className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <Label htmlFor="requerirCambioPassword" className="text-sm font-medium">Requerir Cambio de Contraseña</Label>
                        <p className="text-xs text-gray-500">Forzar cambio de contraseña en primer login</p>
                      </div>
                    </div>
                    <Switch
                      id="requerirCambioPassword"
                      checked={configSeguridad.requerirCambioPassword}
                      onCheckedChange={(checked) => setConfigSeguridad(prev => ({ ...prev, requerirCambioPassword: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Medidas de Seguridad */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Medidas de Seguridad</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <FiShield className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <Label htmlFor="bloqueoTemporal" className="text-sm font-medium">Bloqueo Temporal</Label>
                        <p className="text-xs text-gray-500">Bloquear cuenta después de intentos fallidos</p>
                      </div>
                    </div>
                    <Switch
                      id="bloqueoTemporal"
                      checked={configSeguridad.bloqueoTemporal}
                      onCheckedChange={(checked) => setConfigSeguridad(prev => ({ ...prev, bloqueoTemporal: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FiShield className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <Label htmlFor="autenticacionDosFactores" className="text-sm font-medium">Autenticación de Dos Factores</Label>
                        <p className="text-xs text-gray-500">Habilitar 2FA para usuarios</p>
                      </div>
                    </div>
                    <Switch
                      id="autenticacionDosFactores"
                      checked={configSeguridad.autenticacionDosFactores}
                      onCheckedChange={(checked) => setConfigSeguridad(prev => ({ ...prev, autenticacionDosFactores: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botón de guardar */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button 
              onClick={() => guardarConfiguracion('seguridad', configSeguridad)}
              disabled={saving}
              className="px-8 h-12 text-base font-medium"
            >
              <FiSave className="mr-2 h-5 w-5" />
              {saving ? 'Guardando...' : 'Guardar Configuración de Seguridad'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 