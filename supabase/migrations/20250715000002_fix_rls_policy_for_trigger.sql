-- Migração: Corrigir política RLS para permitir inserção pelo trigger
-- Data: 2025-07-15
-- Objetivo: Resolver bloqueio do trigger pela política RLS da tabela users

-- Adicionar política para permitir que o trigger insira na tabela users
-- A função é SECURITY DEFINER, mas a política RLS ainda pode bloquear
-- Esta política permite inserção durante o processo de signup
DROP POLICY IF EXISTS "Allow user insert by trigger" ON public.users;
CREATE POLICY "Allow user insert by trigger" ON public.users
  FOR INSERT WITH CHECK (true);

-- Garantir que RLS está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Comentário: Esta política permite que o trigger SECURITY DEFINER 
-- insira na tabela users sem ser bloqueado pelo RLS