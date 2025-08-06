-- Correção para políticas RLS que falham na verificação auth.uid()
-- Problema: users.id != auth.uid() causa violação de RLS
-- Solução: Criar função que verifica auth por email e modificar políticas

-- 1. Função para verificar se o usuário autenticado é dono do membro
CREATE OR REPLACE FUNCTION is_user_member_owner(membro_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  membro_email TEXT;
  membro_user_id UUID;
BEGIN
  -- Buscar email do usuário autenticado
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar dados do membro
  SELECT email, user_id INTO membro_email, membro_user_id 
  FROM membros 
  WHERE id = membro_id;
  
  -- Verificar se:
  -- 1. O membro tem user_id que corresponde ao auth.uid() OU
  -- 2. O email do membro corresponde ao email do usuário autenticado
  RETURN (
    (membro_user_id IS NOT NULL AND membro_user_id = auth.uid()) OR
    (membro_email IS NOT NULL AND membro_email = user_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
  user_role TEXT;
BEGIN
  -- Buscar email do usuário autenticado
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar role do usuário na tabela users
  SELECT role INTO user_role FROM users WHERE email = user_email;
  
  RETURN (user_role IN ('admin', 'meteo', 'tesouraria'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Remover políticas antigas da tabela baloes
DROP POLICY IF EXISTS "Proprietários podem ver seus balões" ON baloes;
DROP POLICY IF EXISTS "Admins podem ver todos os balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem criar balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem atualizar seus balões" ON baloes;
DROP POLICY IF EXISTS "Proprietários podem deletar seus balões" ON baloes;

-- 4. Criar novas políticas para tabela baloes
CREATE POLICY "Proprietários podem ver seus balões" ON baloes
  FOR SELECT USING (
    is_user_member_owner(proprietario_id) OR is_admin_user()
  );

CREATE POLICY "Admins podem ver todos os balões" ON baloes
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Proprietários podem criar balões" ON baloes
  FOR INSERT WITH CHECK (
    is_user_member_owner(proprietario_id) AND
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = proprietario_id 
      AND status = 'ativo'
    )
  );

CREATE POLICY "Proprietários podem atualizar seus balões" ON baloes
  FOR UPDATE USING (
    is_user_member_owner(proprietario_id) OR is_admin_user()
  );

CREATE POLICY "Proprietários podem deletar seus balões" ON baloes
  FOR DELETE USING (
    is_user_member_owner(proprietario_id) OR is_admin_user()
  );

-- 5. Remover políticas antigas da tabela vinculos_agencia_piloto
DROP POLICY IF EXISTS "Agências podem ver seus vínculos" ON vinculos_agencia_piloto;
DROP POLICY IF EXISTS "Pilotos podem ver vínculos direcionados a eles" ON vinculos_agencia_piloto;
DROP POLICY IF EXISTS "Admins podem ver todos os vínculos" ON vinculos_agencia_piloto;
DROP POLICY IF EXISTS "Agências podem criar vínculos" ON vinculos_agencia_piloto;
DROP POLICY IF EXISTS "Pilotos podem responder convites" ON vinculos_agencia_piloto;
DROP POLICY IF EXISTS "Agências podem atualizar seus vínculos" ON vinculos_agencia_piloto;
DROP POLICY IF EXISTS "Agências podem deletar vínculos pendentes" ON vinculos_agencia_piloto;

-- 6. Criar novas políticas para tabela vinculos_agencia_piloto
CREATE POLICY "Agências podem ver seus vínculos" ON vinculos_agencia_piloto
  FOR SELECT USING (
    is_user_member_owner(agencia_id) OR is_admin_user()
  );

CREATE POLICY "Pilotos podem ver vínculos direcionados a eles" ON vinculos_agencia_piloto
  FOR SELECT USING (
    is_user_member_owner(piloto_id) OR is_admin_user()
  );

CREATE POLICY "Admins podem ver todos os vínculos" ON vinculos_agencia_piloto
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Agências podem criar vínculos" ON vinculos_agencia_piloto
  FOR INSERT WITH CHECK (
    is_user_member_owner(agencia_id) AND
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = agencia_id 
      AND tipo = 'agencia' 
      AND status = 'ativo'
    )
  );

CREATE POLICY "Pilotos podem responder convites" ON vinculos_agencia_piloto
  FOR UPDATE USING (
    is_user_member_owner(piloto_id) OR is_admin_user()
  );

CREATE POLICY "Agências podem atualizar seus vínculos" ON vinculos_agencia_piloto
  FOR UPDATE USING (
    is_user_member_owner(agencia_id) OR is_admin_user()
  );

CREATE POLICY "Agências podem deletar vínculos pendentes" ON vinculos_agencia_piloto
  FOR DELETE USING (
    (is_user_member_owner(agencia_id) AND status = 'pendente') OR is_admin_user()
  );

-- 7. Garantir que as funções podem ser executadas
GRANT EXECUTE ON FUNCTION is_user_member_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- 8. Comentários
COMMENT ON FUNCTION is_user_member_owner(UUID) IS 'Verifica se o usuário autenticado é dono do membro por user_id ou email';
COMMENT ON FUNCTION is_admin_user() IS 'Verifica se o usuário autenticado é admin por email';