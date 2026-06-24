# 🚀 Roadmap del Proyecto (Hoja de Ruta)

Este documento proyecta las futuras actualizaciones, mejoras y características que escalarán esta aplicación de gestión de inventarios para llevarla al siguiente nivel.

---

## 📅 Fase 1: Optimización de Usabilidad (A Corto Plazo)

### 1. Filtros y Búsqueda Avanzada
- Implementar barras de búsqueda predictiva en las pantallas de **Productos** y **Transacciones**.
- Agregar filtros por "Categoría", "Rango de Fechas" (en el historial) y "Rango de Precios".
- Añadir alertas visuales inmediatas cuando el stock de un producto llegue a su `min_stock` definido.

### 2. Dashboard de Estadísticas (Reportes Visuales)
- Integrar la librería **Recharts** (ya documentada en las reglas del proyecto) para mostrar un resumen financiero en la pestaña principal:
  - Gráfica de ingresos vs. gastos semanales.
  - Productos más vendidos (Top 5).
  - Alerta de capital estancado (productos sin movimiento en más de 60 días).

---

## 🏗️ Fase 2: Robustez Arquitectónica (A Medio Plazo)

### 3. Blindaje RLS (Capa de Base de Datos)
- Trasladar las lógicas de protección que existen actualmente en el Frontend (UI) directo a las políticas RLS en Supabase.
- Específicamente: Prohibir a nivel de SQL que los administradores puedan degradar o eliminar al fundador (`created_by`) de un almacén.

### 4. Permisos de Rol Granulares
Actualmente existen `admin` y `collaborator`. Se proyecta expandir la tabla `workspace_members` para soportar:
- `owner`: Solo uno por almacén (el fundador).
- `manager`: Puede aceptar solicitudes y mover dinero, pero no borrar el almacén.
- `cashier`: Solo puede registrar salidas de productos (Ventas), no modificar precios ni borrar historiales.
- `viewer`: Solo puede ver el stock (ideal para auditores externos).

### 5. Multi-Sucursal (Sub-Workspaces)
- Expandir la tabla de `workspaces` permitiendo que un almacén grande tenga "sucursales" o "ubicaciones" (ej. Pasillo A, Estante B) mediante una relación jerárquica (`parent_workspace_id`).

---

## 🌟 Fase 3: Escalabilidad Empresarial (A Largo Plazo)

### 6. Reportes y Exportación Masiva
- Habilitar descarga del historial de `transactions` en formato **Excel (.xlsx)** y **PDF**.
- Generación automatizada de reportes de cierre de caja mensual.

### 7. Integración de Escáner de Código de Barras
- Añadir a la PWA o versión móvil un lector de cámara que busque el `sku` en la tabla de productos inmediatamente para acelerar las salidas de almacén.

### 8. Soporte Offline (Sin Conexión)
- Utilizar Service Workers e IndexedDB para permitir registrar ventas aunque el dispositivo pierda conexión a internet, sincronizándolas automáticamente a Supabase cuando vuelva la señal.
