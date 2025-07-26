-- CORREÇÃO DE EMERGÊNCIA: Restaurar acesso de login
-- Remove política que está bloqueando o login e restaura a original

-- 1. REMOVER todas as políticas SELECT problemáticas da tabela users
DROP POLICY IF EXISTS "admin_read_users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users table" ON users;

-- 2. CRIAR uma única política que permite tanto login quanto gerenciamento
-- Esta política permite:
-- - Qualquer usuário autenticado ler a tabela (necessário para login)
-- - Mantém compatibilidade com o sistema existente
CREATE POLICY "Users can read for login and admin management" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);