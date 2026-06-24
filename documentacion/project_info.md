# 📖 Información del Proyecto (Arquitectura)

Esta guía sirve como punto de partida técnico para cualquier desarrollador que ingrese al proyecto. Complementa el `README.md` comercial explicando cómo funciona el sistema por debajo y sus reglas inquebrantables.

---

## 🛠️ Stack Tecnológico Principal

### 1. Frontend Framework
- **React + Vite:** Para un rendimiento y carga extremadamente rápidos, usando TypeScript como lenguaje para prevenir errores desde el editor de código.
- **Tailwind CSS v4:** El motor de estilos. IMPORTANTE: En la versión 4 no dependemos del archivo `tailwind.config.js`. Todo el tema (colores primarios, espaciados y clases base como `.glass` o `.text-gradient`) se administra e importa directamente desde `src/index.css` utilizando variables HSL modernas.

### 2. Base de Datos & Backend (Serverless)
- **Supabase:** Reemplaza a Node.js/Express. No tenemos un backend clásico, todo se comunica directamente entre el Frontend y Supabase de manera segura a través de **Row Level Security (RLS)**. Si una regla de seguridad falta en Supabase, el sistema es vulnerable.

### 3. Estado Global
- **Zustand:** Se encarga de guardar y distribuir la información a lo largo de toda la página sin recargar. Tenemos tiendas separadas (`stores`) por concepto:
  - `authStore.ts`: Gestiona el inicio de sesión y los datos del usuario actual.
  - `workspaceStore.ts`: Mantiene cargado el inventario de la tienda seleccionada.
  - `notificationStore.ts`: Se suscribe en tiempo real a la campana de notificaciones.
  - `toastStore.ts`: Maneja las alertas flotantes verdes o rojas (éxito/error).

### 4. Iconos y Gráficos
- **Lucide React:** La única librería autorizada para íconos dentro de la plataforma (limpio, minimalista).
- **Recharts:** (Futuro) La librería designada para la creación del dashboard de analíticas del almacén.

---

## 📐 Reglas Estrictas de Programación (No Negociables)

Cualquier aportación al código fuente debe respetar las siguientes normas establecidas por el equipo:

### Arquitectura sin Servidor (Backend-less)
No se debe intentar crear un servidor intermedio. Supabase debe ser **la única fuente de verdad**. Las transacciones de venta complejas deben procesarse usando funciones atómicas RPC (`decrement_stock`) para evitar carreras de peticiones.

### Manejo de Errores Estandarizado
Está prohibido imprimir errores directos de Supabase (como "TypeError x") al usuario. Todos los errores deben pasar obligatoriamente por la función `sanitizeError(error)` (ubicada en `src/lib/errors.ts`) que convierte el lenguaje de programación en frases amables en español como "Contraseña incorrecta".

### Manejo de Layouts (Estructura de Pantallas)
Existen dos moldes de página en la app:
1. `TopNavLayout`: Solo muestra una barra superior. Se usa para seleccionar a qué Almacén quieres entrar.
2. `MainLayout`: Contiene un panel lateral completo (Sidebar) con menú de navegación, campanita de notificaciones, etc. Se usa para la gestión interna de productos.

### Reglas Visuales y Estética (Glassmorphism)
La aplicación **DEBE verse Premium**. No está permitido usar colores planos genéricos.
- Los fondos principales deben hacer uso del diseño tipo cristal (`.glass`) que puedes encontrar en el CSS principal.
- No hay modo oscuro. El diseño está optimizado 100% para colores limpios, radiantes e iluminados con sombras difuminadas.

### Protección de Componentes (`ProtectedRoute`)
La puerta de entrada a la aplicación. Un usuario NUNCA debe ver el inventario a menos que pase 3 filtros en cadena garantizados por `ProtectedRoute`:
1. Estar con sesión activa.
2. Tener su perfil completamente llenado (Nombre no vacío).
3. Haber seleccionado una tienda activa en la que trabajar.
