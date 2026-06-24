-- Run this in Supabase Dashboard > SQL Editor
-- Estas políticas reflejan lo que cada rol hace en la app real:
--   - Admin: todo (CRUD en todas las tablas)
--   - Colaborador: procesa ventas/compras (inserta transacciones, actualiza stock),
--                  ve inventario e historial, NO modifica productos/proveedores/miembros.

-- 1. products — todos los miembros del workspace pueden ver,
--               solo admins pueden crear/eliminar,
--               todos pueden UPDATE (necesario para stock en ventas/compras)
create policy "Members can view products"
  on products for select
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Members can update stock on products"
  on products for update
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Only admins can insert products"
  on products for insert
  with check (
    exists (
      select 1 from workspace_members
      where workspace_id = products.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Only admins can delete products"
  on products for delete
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = products.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- 2. transactions — todos los miembros ven historial e insertan (ventas/compras)
create policy "Members can view transactions"
  on transactions for select
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Members can insert transactions"
  on transactions for insert
  with check (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Only admins can update transactions"
  on transactions for update
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = transactions.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Only admins can delete transactions"
  on transactions for delete
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = transactions.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- 3. suppliers — solo admins gestionan
create policy "Members can view suppliers"
  on suppliers for select
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Only admins can modify suppliers"
  on suppliers for insert
  with check (
    exists (
      select 1 from workspace_members
      where workspace_id = suppliers.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Only admins can update suppliers"
  on suppliers for update
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = suppliers.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Only admins can delete suppliers"
  on suppliers for delete
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = suppliers.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- 4. workspace_members — todos ven la lista, solo admins modifican
create policy "Members can view workspace members"
  on workspace_members for select
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Only admins can modify workspace members"
  on workspace_members for insert
  with check (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_members.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Only admins can update workspace members"
  on workspace_members for update
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_members.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "Only admins can delete workspace members"
  on workspace_members for delete
  using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_members.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- NOTA: products UPDATE permite a todos los miembros porque la app actual
--       actualiza stock desde ventas/compras sin RPC.
--       Para producción real, migrar a supabase.rpc('decrement_stock', ...)
--       y luego restringir products UPDATE a solo admins.
--       Ver supabase/migrations/001_decrement_stock.sql
