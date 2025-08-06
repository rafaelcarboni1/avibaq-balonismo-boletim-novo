-- 🐞 MODO DEPURADOR: Diagnóstico Sistemático
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- HIPÓTESES:
-- 1. Problema na estrutura da tabela permissoes (colunas inexistentes)
-- 2. Problema na sintaxe do JOIN
-- 3. Problema nos tipos de dados na comparação
-- 4. Problema na estrutura da função

-- === FASE 1: DIAGNÓSTICO BÁSICO ===

-- 1.1 Verificar estrutura da tabela permissoes
SELECT '[DEBUG] Estrutura da tabela permissoes:' as debug_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'permissoes' 
ORDER BY ordinal_position;

-- 1.2 Verificar se existem dados na tabela permissoes
SELECT '[DEBUG] Dados na tabela permissoes:' as debug_info;
SELECT COUNT(*) as total_registros FROM permissoes;
SELECT role, COUNT(*) as qtd_por_role FROM permissoes GROUP BY role;

-- 1.3 Verificar estrutura da tabela user_permissions
SELECT '[DEBUG] Estrutura da tabela user_permissions:' as debug_info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_permissions' 
ORDER BY ordinal_position;

-- === FASE 2: TESTE SIMPLES DA FUNÇÃO ===

-- 2.1 Versão ULTRA SIMPLES da função (apenas retorna dados fake)
CREATE OR REPLACE FUNCTION get_user_combined_permissions_debug_v1(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT,
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
BEGIN
  -- DEBUG: Versão 1 - apenas retorna dados fake para testar estrutura
  RETURN QUERY
  SELECT 
    'teste_recurso'::TEXT as recurso,
    'teste_acao'::TEXT as acao,
    true as permitido,
    'debug'::TEXT as fonte,
    'basico'::TEXT as nivel_acesso,
    NULL::JSONB as restricoes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 Testar função debug v1
SELECT '[DEBUG] Testando função debug v1:' as debug_info;
SELECT * FROM get_user_combined_permissions_debug_v1('71d5ba28-c9a4-45c0-8255-c12f93502851');

-- === FASE 3: TESTE COM DADOS REAIS ===

-- 3.1 Versão que busca apenas dados do usuário (sem JOIN complexo)
CREATE OR REPLACE FUNCTION get_user_combined_permissions_debug_v2(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT,
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
DECLARE
  user_role_var TEXT;
BEGIN
  -- DEBUG: Buscar role do usuário primeiro
  SELECT u.role INTO user_role_var FROM users u WHERE u.id = p_user_id;
  
  -- DEBUG: Log do role encontrado
  RAISE NOTICE '[DEBUG] User ID: %, Role encontrado: %', p_user_id, user_role_var;
  
  -- Retornar apenas permissões da role (sem user_permissions por enquanto)
  RETURN QUERY
  SELECT 
    p.recurso,
    p.acao,
    p.permitido,
    'role'::TEXT as fonte,
    'basico'::TEXT as nivel_acesso,
    NULL::JSONB as restricoes
  FROM permissoes p
  WHERE p.role = user_role_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Testar função debug v2
SELECT '[DEBUG] Testando função debug v2:' as debug_info;
SELECT * FROM get_user_combined_permissions_debug_v2('71d5ba28-c9a4-45c0-8255-c12f93502851');

-- === FASE 4: INFORMAÇÕES ADICIONAIS ===

-- 4.1 Verificar dados específicos do usuário admin
SELECT '[DEBUG] Dados do usuário admin:' as debug_info;
SELECT id, email, role FROM users WHERE id = '71d5ba28-c9a4-45c0-8255-c12f93502851';

-- 4.2 Verificar permissões para role admin
SELECT '[DEBUG] Permissões para role admin:' as debug_info;
SELECT * FROM permissoes WHERE role = 'admin' LIMIT 5;

-- === RESULTADO ===
SELECT '[DEBUG] Diagnóstico sistemático executado!' as resultado;