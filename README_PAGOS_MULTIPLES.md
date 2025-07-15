# Sistema de Pagos Múltiples para Cuotas

## 🎯 **Descripción**

Se ha implementado un sistema completo de pagos múltiples para cuotas que permite registrar varios pagos parciales en una misma cuota, manteniendo un historial detallado de cada transacción.

## 🏗️ **Arquitectura del Sistema**

### **Modelo de Datos**

#### **PagoCuota** (Nuevo modelo)
```prisma
model PagoCuota {
  id                    String      @id @default(cuid())
  monto                 Float       // Monto del pago individual
  fechaPago             DateTime    // Fecha del pago
  formaPago             FormaPago?  // Forma de pago
  voucherPago           String?     // Número de voucher
  observaciones         String?     // Observaciones del pago
  
  // Relación con la cuota
  cuotaId               String
  cuota                 Cuota       @relation(fields: [cuotaId], references: [id], onDelete: Cascade)
  
  // Auditoría
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  createdBy             String?
  updatedBy             String?
  
  // Relaciones de auditoría
  creadoPorUsuario      Usuario?    @relation("PagoCuotaCreadoPor", fields: [createdBy], references: [id])
  actualizadoPorUsuario Usuario?    @relation("PagoCuotaActualizadoPor", fields: [updatedBy], references: [id])
}
```

#### **Cuota** (Actualizado)
```prisma
model Cuota {
  // ... campos existentes ...
  
  // Nueva relación con pagos
  pagos                 PagoCuota[]
}
```

## 🔧 **Funcionalidades Implementadas**

### **1. Endpoints API**

#### **GET /api/cuotas/[id]/pagos**
- Obtiene todos los pagos de una cuota específica
- Incluye información del usuario que registró cada pago
- Ordenados por fecha de pago (más reciente primero)

#### **POST /api/cuotas/[id]/pagos**
- Registra un nuevo pago para una cuota
- Valida que no se exceda el monto total de la cuota
- Actualiza automáticamente el estado de la cuota
- Usa transacciones para garantizar consistencia

### **2. Componentes de UI**

#### **PagoCuotaModal.tsx**
- Modal completo para gestionar pagos de una cuota
- Formulario para registrar nuevos pagos
- Tabla con historial de pagos
- Validaciones en tiempo real
- Barra de progreso visual

#### **CuotasModal.tsx** (Actualizado)
- Botón "Pagos" en cada cuota
- Integración con el nuevo sistema
- Actualización automática de estadísticas

## 📊 **Estados de Cuota**

| Estado | Descripción |
|--------|-------------|
| `PENDIENTE` | Cuota sin pagos |
| `PARCIAL` | Cuota con pagos parciales |
| `PAGADA` | Cuota completamente pagada |
| `VENCIDA` | Cuota vencida sin pagar |

## 💰 **Lógica de Pagos**

### **Validaciones**
- ✅ Monto debe ser mayor a 0
- ✅ No puede exceder el monto pendiente de la cuota
- ✅ Fecha de pago requerida
- ✅ Permisos de usuario verificados

### **Cálculos Automáticos**
```javascript
// Ejemplo de cálculo
const montoPendiente = cuota.monto - cuota.montoPagado
const nuevoMontoPagado = cuota.montoPagado + montoPago
const porcentajePagado = (nuevoMontoPagado / cuota.monto) * 100

// Estado automático
const nuevoEstado = nuevoMontoPagado >= cuota.monto ? 'PAGADA' : 'PARCIAL'
```

## 🎨 **Interfaz de Usuario**

### **Características del Modal de Pagos**
- 📈 **Barra de progreso visual** del pago
- 💰 **Resumen financiero** detallado
- 📋 **Historial completo** de pagos
- ➕ **Formulario intuitivo** para nuevos pagos
- 🔍 **Validaciones en tiempo real**

### **Información Mostrada**
- Monto total de la cuota
- Monto pagado hasta el momento
- Monto pendiente
- Porcentaje de progreso
- Estado actual de la cuota
- Fecha de vencimiento

## 🔐 **Control de Accesos**

### **Roles Permitidos**
- `SUPER_ADMIN`
- `ADMIN`
- `SALES_MANAGER`
- `FINANCE_MANAGER`
- `SALES_REP`

### **Permisos Específicos**
- **Sales Rep**: Solo puede ver/crear pagos de sus propias ventas
- **Otros roles**: Acceso completo a todas las cuotas

## 📝 **Ejemplo de Uso**

### **Escenario: Cuota de S/. 10,000**

1. **Pago inicial**: S/. 3,000
   - Estado: `PARCIAL`
   - Pendiente: S/. 7,000

2. **Segundo pago**: S/. 4,000
   - Estado: `PARCIAL`
   - Pendiente: S/. 3,000

3. **Pago final**: S/. 3,000
   - Estado: `PAGADA`
   - Pendiente: S/. 0

### **Historial de Pagos**
```
Fecha       | Monto    | Forma de Pago | Voucher
------------|----------|----------------|----------
15/01/2024  | S/.3,000| Transferencia | TR-001
20/02/2024  | S/.4,000| Efectivo      | EF-002
25/03/2024  | S/.3,000| Yape          | YP-003
```

## 🚀 **Ventajas del Sistema**

### **Para el Negocio**
- ✅ **Flexibilidad total** en pagos
- ✅ **Historial completo** de transacciones
- ✅ **Trazabilidad** de cada pago
- ✅ **Estados automáticos** actualizados
- ✅ **Reportes detallados** disponibles

### **Para el Usuario**
- ✅ **Interfaz intuitiva** y moderna
- ✅ **Validaciones claras** y útiles
- ✅ **Información visual** del progreso
- ✅ **Acceso rápido** a historial
- ✅ **Formularios simplificados**

## 🔄 **Migración de Datos**

El sistema es **compatible hacia atrás**:
- Las cuotas existentes mantienen su funcionalidad
- Los pagos anteriores se pueden migrar al nuevo sistema
- No se pierde información histórica

## 📈 **Próximas Mejoras**

- [ ] **Notificaciones automáticas** de pagos
- [ ] **Reportes de pagos** por período
- [ ] **Exportación** de historial de pagos
- [ ] **Integración** con sistemas de pago
- [ ] **Recordatorios** de pagos pendientes

---

**¡El sistema de pagos múltiples está listo para usar!** 🎉 