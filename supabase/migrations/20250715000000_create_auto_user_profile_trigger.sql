-- Migração: Criar trigger para criação automática de perfil de usuário
-- Data: 2025-07-15
-- Objetivo: Resolver problema de RLS ao criar usuários via frontend

-- Função que será chamada pelo trigger para criar automaticamente o perfil do usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, nome, email, role, username, created_at)
  values (
    new.id,
    new.raw_user_meta_data->>'nome',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'piloto'),
    new.raw_user_meta_data->>'username',
    now()
  );
  return new;
end;
$$;

-- Trigger que chama a função após cada novo usuário ser criado no auth
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Comentário: Este trigger automatiza a criação do perfil na tabela users
-- sempre que um novo usuário for criado via auth.signUp(), eliminando
-- a necessidade de inserção manual e resolvendo problemas de RLS.