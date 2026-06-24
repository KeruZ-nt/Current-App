-- Run this in Supabase Dashboard > SQL Editor
-- Crea una función atómica para decrementar stock sin race conditions

create or replace function decrement_stock(product_id uuid, quantity int)
returns void
language plpgsql
security definer
as $$
begin
  update products
  set stock = stock - quantity
  where id = product_id and stock >= quantity;

  if not found then
    raise exception 'Stock insuficiente o producto no encontrado.';
  end if;
end;
$$;
