-- CORREÇÃO URGENTE: Vincular TODOS os membros ativos aos usuários auth
-- Execute este SQL no Dashboard do Supabase

-- 1. VINCULAR TODOS MEMBROS ATIVOS POR EMAIL (não apenas Rodrigo)
UPDATE membros 
SET user_id = u.id
FROM auth.users u 
WHERE membros.email = u.email 
AND membros.user_id IS NULL
AND membros.status = 'ativo';

-- 2. VERIFICAR RESULTADO DA VINCULAÇÃO
SELECT 
  'VINCULAÇÃO COMPLETA' as status,
  tipo,
  COUNT(*) as total_vinculados
FROM membros 
WHERE user_id IS NOT NULL AND status = 'ativo'
GROUP BY tipo;

-- 3. VERIFICAR SE AINDA HÁ MEMBROS SEM VINCULAÇÃO
SELECT 
  'MEMBROS AINDA SEM VINCULAÇÃO' as status,
  tipo,
  COUNT(*) as total_sem_vinculacao
FROM membros 
WHERE user_id IS NULL AND status = 'ativo'
GROUP BY tipo;

-- 4. MOSTRAR DETALHES DOS MEMBROS SEM VINCULAÇÃO (para debug)
SELECT 
  'DETALHES SEM VINCULAÇÃO' as info,
  nome_completo,
  email,
  tipo,
  'Sem usuário auth correspondente' as motivo
FROM membros 
WHERE user_id IS NULL 
AND status = 'ativo'
AND NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = membros.email
);

-- 5. LOG DA OPERAÇÃO
INSERT INTO logs_atividade (acao, detalhes) VALUES 
('fix_all_users_vinculation', jsonb_build_object(
  'descricao', 'Vinculação em massa de todos membros ativos aos usuários auth',
  'data_execucao', NOW(),
  'tipo_operacao', 'UPDATE membros SET user_id por email'
));