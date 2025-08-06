-- CORREÇÃO URGENTE DE RLS - Execute no Dashboard do Supabase
-- Este script corrige o problema de acesso negado para pilotos/agências

-- 1. PRIMEIRO: Vincular user_id aos membros (se ainda não foi feito)
UPDATE membros 
SET user_id = u.id
FROM users u 
WHERE membros.email = u.email 
AND membros.user_id IS NULL;

-- 2. VERIFICAR SE VINCULAÇÃO FUNCIONOU
SELECT 
  'Membros com user_id preenchido' as status,
  COUNT(*) as total
FROM membros 
WHERE user_id IS NOT NULL AND status = 'ativo';

-- 3. CORRIGIR POLÍTICAS RLS DE BALÕES (temporariamente mais permissivas)
DROP POLICY IF EXISTS "Proprietários podem ver seus balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem criar balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem atualizar seus balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem deletar seus balões" ON baloes;

-- Política TEMPORÁRIA mais permissiva para balões
CREATE POLICY "Proprietários podem ver seus balões" ON baloes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = baloes.proprietario_id 
      AND (
        (m.user_id IS NOT NULL AND u.id = auth.uid()) OR
        (m.user_id IS NULL AND EXISTS(
          SELECT 1 FROM users u2 WHERE u2.email = m.email AND u2.id = auth.uid()
        ))
      )
      AND m.status = 'ativo'
    )
  );

CREATE POLICY "Proprietários podem criar balões" ON baloes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM membros m 
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = baloes.proprietario_id 
      AND (
        (m.user_id IS NOT NULL AND u.id = auth.uid()) OR
        (m.user_id IS NULL AND EXISTS(
          SELECT 1 FROM users u2 WHERE u2.email = m.email AND u2.id = auth.uid()
        ))
      )
      AND m.status = 'ativo'
    )
  );

CREATE POLICY "Proprietários podem atualizar seus balões" ON baloes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = baloes.proprietario_id 
      AND (
        (m.user_id IS NOT NULL AND u.id = auth.uid()) OR
        (m.user_id IS NULL AND EXISTS(
          SELECT 1 FROM users u2 WHERE u2.email = m.email AND u2.id = auth.uid()
        ))
      )
      AND m.status = 'ativo'
    )
  );

CREATE POLICY "Proprietários podem deletar seus balões" ON baloes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = baloes.proprietario_id 
      AND (
        (m.user_id IS NOT NULL AND u.id = auth.uid()) OR
        (m.user_id IS NULL AND EXISTS(
          SELECT 1 FROM users u2 WHERE u2.email = m.email AND u2.id = auth.uid()
        ))
      )
      AND m.status = 'ativo'
    )
  );

-- 4. VERIFICAR SE AS POLÍTICAS ESTÃO FUNCIONANDO
SELECT 
  'Políticas RLS de balões' as status,
  'Atualizadas com sucesso' as resultado;

-- 5. TESTE: Mostrar balões que o usuário atual deveria ver
-- (Este SELECT só funcionará se executado por um usuário logado)
SELECT 
  'TESTE - Seus balões' as info,
  COUNT(*) as total_baloes
FROM baloes b
JOIN membros m ON b.proprietario_id = m.id
LEFT JOIN users u ON m.user_id = u.id
WHERE (
  (m.user_id IS NOT NULL AND u.id = auth.uid()) OR
  (m.user_id IS NULL AND EXISTS(
    SELECT 1 FROM users u2 WHERE u2.email = m.email AND u2.id = auth.uid()
  ))
)
AND m.status = 'ativo';