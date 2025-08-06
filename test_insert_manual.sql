-- TESTE MANUAL DE INSERT - Execute SOMENTE se logado como piloto
-- Este teste vai tentar inserir um balão manualmente para ver o erro exato

-- PASSO 1: Ver seus dados como usuário logado
SELECT 
  'SEUS DADOS' as info,
  auth.uid() as your_auth_id,
  m.id as your_member_id,
  m.nome_completo as your_name,
  m.email as your_email,
  m.tipo as your_type
FROM membros m
WHERE (
  (m.user_id = auth.uid()) OR 
  (m.user_id IS NULL AND EXISTS(
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = m.email
  ))
)
AND m.status = 'ativo';

-- PASSO 2: Tentar INSERT manual (só execute se PASSO 1 retornar dados)
-- SUBSTITUA 'YOUR_MEMBER_ID' pelo ID do PASSO 1
/*
INSERT INTO baloes (
  prefixo,
  volume_m3,
  nome_batismo,
  observacoes,
  proprietario_id,
  ativo
) VALUES (
  'TEST-001',
  3000,
  'Teste Manual',
  'Teste para debug RLS',
  'YOUR_MEMBER_ID',
  true
);
*/

-- PASSO 3: Se deu erro, verificar detalhes da política
-- Execute este para ver qual política está bloqueando
SELECT 
  'TESTE DETALHADO DA POLÍTICA' as debug,
  m.id as member_id,
  m.nome_completo,
  m.user_id,
  auth.uid() as current_auth_uid,
  u.email as auth_email,
  m.email as member_email,
  -- Testar condição 1: user_id match
  (m.user_id = u.id AND u.id = auth.uid()) as condicao_user_id,
  -- Testar condição 2: email match com user_id NULL
  (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid()) as condicao_email,
  -- Resultado final
  (
    (m.user_id = u.id AND u.id = auth.uid()) OR 
    (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
  ) as politica_deveria_permitir
FROM membros m
JOIN auth.users u ON (m.user_id = u.id OR m.email = u.email)
WHERE (
  (m.user_id = auth.uid()) OR 
  (EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = m.email))
)
AND m.status = 'ativo'
AND m.tipo = 'piloto';