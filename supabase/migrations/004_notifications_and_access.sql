-- Run this in Supabase Dashboard > SQL Editor
-- Crea las tablas notifications y access_requests con políticas RLS

-- 1. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('access_request', 'access_accepted', 'access_rejected')),
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can insert notifications"
  on notifications for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- 2. ACCESS REQUESTS
create table if not exists access_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

alter table access_requests enable row level security;

create policy "Users can view relevant access requests"
  on access_requests for select
  using (
    user_id = auth.uid()
    or workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can create their own access requests"
  on access_requests for insert
  with check (user_id = auth.uid());

create policy "Admins can update access requests in their workspace"
  on access_requests for update
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid() and role = 'admin'
    )
  );
