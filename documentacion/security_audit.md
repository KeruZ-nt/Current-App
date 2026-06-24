# Auditoría de Seguridad (Security Audit)

Esta auditoría detalla el estado de la seguridad a nivel de base de datos (Supabase RLS) y aplicación frontend (React), señalando protecciones actuales y posibles vulnerabilidades futuras.

## 🛡️ Protecciones Actuales Implementadas

### 1. Row Level Security (RLS) Activo
Todas las tablas sin excepción (`profiles`, `workspaces`, `workspace_members`, `products`, `suppliers`, `transactions`, `access_requests`, `notifications`) tienen la seguridad por filas habilitada (`ENABLE ROW LEVEL SECURITY`). Esto garantiza que nadie pueda consultar la API pública sin un JWT válido.

### 2. Aislamiento de "Workspaces"
Los datos transaccionales (`products`, `suppliers`, `transactions`) están estrictamente protegidos bajo la regla `workspace_id IN (SELECT public.get_user_workspaces())`. 
- **Beneficio:** Un usuario jamás podrá extraer, modificar ni eliminar información de tiendas en las que no trabaja.

### 3. Operaciones Seguras de Base de Datos (RPC)
- `decrement_stock`: Esta función evita la "condición de carrera" (race condition) al vender productos simultáneamente. El stock se actualiza de manera atómica a nivel de base de datos en lugar de hacer el cálculo en el cliente.
- `request_workspace_access`: Realiza la petición y notifica masivamente a los administradores en un solo bloque seguro, evitando que se registren peticiones fallidas a medias.

### 4. Protección Visual del Creador
Se ha implementado una capa de seguridad en la interfaz (`Team.tsx`) que oculta los controles de eliminación y cambio de rol para el fundador del almacén. Un administrador invitado no puede expulsar al creador original.

---

## 🔴 Vulnerabilidades a Cubrir en un Futuro (Mejoras)

> [!WARNING]
> La protección del creador actualmente es "visual" (en la interfaz web). Para hacerlo 100% impenetrable a nivel de base de datos (ante ataques directos a la API), se recomienda actualizar la política RLS de `workspace_members`.

### Mejora RLS: Blindaje del Creador
Si el proyecto se expone públicamente, debes actualizar la regla de "Eliminar Miembros" en Supabase.
**Código recomendado:**
```sql
CREATE OR REPLACE POLICY "Admins can delete members" ON public.workspace_members 
FOR DELETE USING (
  is_workspace_admin(workspace_id) 
  AND user_id != (SELECT created_by FROM workspaces WHERE id = workspace_id)
);
```
*(Esta regla le diría a la base de datos: Puedes eliminar miembros SI eres admin, pero NO si el usuario a eliminar es el dueño).*

### Mejora RLS: Degradación del Creador
De la misma manera, para evitar que cambien su rol por API:
**Código recomendado:**
```sql
CREATE OR REPLACE POLICY "Admins can update members" ON public.workspace_members 
FOR UPDATE USING (
  is_workspace_admin(workspace_id)
  AND user_id != (SELECT created_by FROM workspaces WHERE id = workspace_id)
);
```

### Límites de Peticiones (Rate Limiting)
Al usar códigos de invitación cortos (ej. `K-1234`), un usuario malintencionado podría usar un bot para adivinar códigos. Se recomienda usar **Supabase Edge Functions** para agregar rate-limiting (máximo 5 intentos por minuto por usuario) al intentar unirse a un grupo.
