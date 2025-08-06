-- Script para criar um usuário de teste para as APIs de push notifications
-- Execute este script no SQL Editor do Supabase

-- Verificar se existe algum usuário admin
SELECT id, nome, email, role FROM users WHERE role = 'admin' LIMIT 5;

-- Se não existir nenhum admin, criar um usuário de teste
INSERT INTO users (
  id,
  nome,
  email,
  role,
  created_at,
  updated_at
) 
VALUES (
  '00000000-1111-2222-3333-444444444444',
  'Admin Teste Push',
  'admin-teste@avibaq.com',
  'admin',
  NOW(),
  NOW()
) 
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verificar se foi criado/atualizado
SELECT 'Usuário de teste criado/atualizado:' as info;
SELECT id, nome, email, role, created_at 
FROM users 
WHERE id = '00000000-1111-2222-3333-444444444444';