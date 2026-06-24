-- Run this in Supabase Dashboard > SQL Editor
-- Políticas RLS para el bucket 'avatars' en Storage

-- 1. Permitir a usuarios autenticados leer avatars
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- 2. Solo el propietario puede subir/actualizar su avatar
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Solo el propietario puede eliminar su avatar
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- NOTA: Las carpetas en storage se referencian como "{userId}-{random}.{ext}"
-- La política usa storage.foldername() para extraer el userId de la ruta
