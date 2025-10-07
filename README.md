# Kasva Realty - Sistema de Gestión Inmobiliaria

Sistema integral de gestión para desarrollos inmobiliarios, construido con Next.js 14, Prisma y Tailwind CSS.

## Estructura del Proyecto

### Frontend (src/app)
```
src/app/
├── api/                    # Rutas de API (Backend)
│   └── dashboard/
│       ├── stats/         # API para estadísticas
│       ├── activity/      # API para actividad reciente
│       └── deadlines/     # API para vencimientos
│
├── auth/                  # Páginas de autenticación
│   └── login/            # Página de inicio de sesión
│
├── dashboard/            # Páginas del dashboard
│   ├── layout.tsx        # Layout específico del dashboard
│   └── page.tsx          # Página principal del dashboard
│
├── layout.tsx            # Layout principal de la aplicación
└── page.tsx              # Página de inicio
```

### Componentes (src/components)
```
src/components/
├── auth/                 # Componentes de autenticación
│   └── protected-route.tsx
│
├── layout/              # Componentes de layout
│   ├── navbar.tsx       # Barra de navegación
│   └── client-layout.tsx # Layout del cliente
│
├── providers/           # Proveedores de contexto
│   └── auth-provider.tsx
│
└── ui/                  # Componentes de UI reutilizables
    ├── activity-card.tsx
    ├── logo.tsx
    └── stat-card.tsx
```

### Backend (src/lib)
```
src/lib/
├── db-utils.ts          # Utilidades de base de datos
└── auth.ts              # Configuración de autenticación
```

### Base de Datos
```
prisma/
├── schema.prisma        # Esquema de la base de datos
└── migrations/          # Migraciones de la base de datos
```

## Flujo de Datos

### Cliente → API → Base de Datos
1. El frontend hace peticiones a las rutas de API
2. Las rutas de API usan Prisma para interactuar con la base de datos
3. Los datos se devuelven al frontend para ser mostrados

### Autenticación
1. NextAuth.js maneja la autenticación
2. Las rutas protegidas verifican la sesión
3. Los datos de usuario se almacenan en la base de datos

## Diagramas de Flujo

### Gestión de Proyectos
```mermaid
flowchart TD
    A[Usuario autenticado] --> B[Dashboard de proyectos]
    B -->|Carga inicial| C[GET /api/projects/:id]
    C --> D[Prisma.proyecto.findUnique]
    D --> B
    B -->|Abrir edición| E[Modal EditProject]
    E -->|Guardar cambios| F[PUT /api/projects/:id]
    F --> G[Prisma.proyecto.update]
    G --> H[Invalida caches locales]
    H --> B
```

### Ciclo de Ventas
```mermaid
flowchart TD
    A[ProjectVentas Component] --> B[Fetch ventas]
    B --> C[GET /api/ventas?proyectoId]
    C --> D[Prisma.ventaLote & ventaUnidadCementerio]
    D --> A
    A -->|Nueva venta| E[VentaModal]
    E -->|Confirmar| F[POST /api/ventas]
    F --> G[Validaciones & Prisma transaction]
    G --> H[Respuesta con venta creada]
    H --> A
    A -->|Gestionar cuotas| I[CuotasModal]
    I -->|Actualizar cuota| J[PATCH /api/cuotas/:id/pagos]
    J --> K[Prisma.cuota + registros de pago]
    K --> A
```

### Gestión de Cobros / Recibos
```mermaid
flowchart TD
    A[Dashboard Recibos] --> B[GET /api/recibos]
    B --> C[Prisma.reciboPago.findMany]
    C --> A
    A -->|Generar PDF| D[POST /api/recibos/:id/generate-pdf]
    D --> E[Puppeteer + plantilla recibo]
    E --> F[Respuesta con enlace/archivo]
    F --> A
    A -->|Registrar pago| G[Formulario Recibo]
    G -->|Guardar| H[POST /api/recibos]
    H --> I[Prisma + actualiza saldos]
    I --> A
```
## Tecnologías Principales

- **Frontend**:
  - Next.js 14 (App Router)
  - React
  - Tailwind CSS
  - TypeScript

- **Backend**:
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL

- **Autenticación**:
  - NextAuth.js

## Configuración del Proyecto

### Variables de Entorno
Crear un archivo `.env` con las siguientes variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kasva_realty"
NEXTAUTH_SECRET="tu-secreto-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### Instalación
```bash
# Instalar dependencias
npm install

# Configurar la base de datos
npx prisma generate
npx prisma migrate dev

# Iniciar el servidor de desarrollo
npm run dev
```

## Estructura de Datos

### Modelos Principales
- Usuario
- Proyecto
- Unidad
- Venta
- Cliente
- Actividad

## Convenciones de Código

### Nombrado de Archivos
- Componentes: PascalCase (ej: `Navbar.tsx`)
- Utilidades: camelCase (ej: `dbUtils.ts`)
- Páginas: kebab-case (ej: `dashboard-page.tsx`)

### Estructura de Componentes
```typescript
// 1. Imports
import { useState } from 'react'

// 2. Interfaces/Types
interface Props {
  // ...
}

// 3. Componente
export default function Component({ prop1, prop2 }: Props) {
  // 4. Hooks
  const [state, setState] = useState()

  // 5. Funciones auxiliares
  const handleClick = () => {
    // ...
  }

  // 6. Render
  return (
    // ...
  )
}
```

## Mejores Prácticas

1. **Componentes**:
   - Mantener componentes pequeños y enfocados
   - Usar TypeScript para tipos
   - Documentar props complejas

2. **API Routes**:
   - Validar datos de entrada
   - Manejar errores apropiadamente
   - Usar tipos para respuestas

3. **Base de Datos**:
   - Usar migraciones para cambios
   - Mantener índices optimizados
   - Documentar relaciones

4. **Seguridad**:
   - Validar sesiones
   - Sanitizar inputs
   - Usar variables de entorno

## Desarrollo

### Comandos Útiles
```bash
# Desarrollo
npm run dev

# Construcción
npm run build

# Producción
npm start

# Linting
npm run lint

# Prisma
npx prisma studio
npx prisma generate
npx prisma migrate dev
```

### Flujo de Trabajo
1. Crear rama feature
2. Desarrollar funcionalidad
3. Tests y linting
4. Pull request
5. Code review
6. Merge a main

## Despliegue

### Requisitos
- Node.js 18+
- PostgreSQL 12+
- Variables de entorno configuradas

### Pasos
1. Construir la aplicación
2. Ejecutar migraciones
3. Configurar servidor
4. Desplegar

## Mantenimiento

### Tareas Regulares
- Actualizar dependencias
- Revisar logs
- Optimizar consultas
- Backup de base de datos

### Monitoreo
- Errores de aplicación
- Rendimiento
- Uso de recursos
- Seguridad 