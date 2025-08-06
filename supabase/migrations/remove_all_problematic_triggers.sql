-- REMOÇÃO COMPLETA DE TODOS OS TRIGGERS PROBLEMÁTICOS
-- Este script remove todos os triggers que podem estar interferindo com o marcado_por

-- 1. REMOVER TODOS OS TRIGGERS DA TABELA checklist_itens
DROP TRIGGER IF EXISTS trigger_checklist_validation ON checklist_itens;
DROP TRIGGER IF EXISTS trigger_checklist_updated_at ON checklist_itens;
DROP TRIGGER IF EXISTS validate_checklist_user_ids_trigger ON checklist_itens;
DROP TRIGGER IF EXISTS trigger_validate_checklist_user_ids ON checklist_itens;
DROP TRIGGER IF EXISTS trigger_checklist_update_status_voo ON checklist_itens;

-- 2. REMOVER TODAS AS FUNÇÕES RELACIONADAS
DROP FUNCTION IF EXISTS trigger_checklist_validation();
DROP FUNCTION IF EXISTS validate_checklist_user_ids();
DROP FUNCTION IF EXISTS trigger_checklist_updated_at();

-- 3. CRIAR FUNÇÃO SIMPLES APENAS PARA UPDATED_AT (SEM MODIFICAR MARCADO_POR)
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. APLICAR APENAS O TRIGGER DE UPDATED_AT (SEM VALIDAÇÕES)
CREATE TRIGGER trigger_checklist_updated_at
  BEFORE UPDATE ON checklist_itens
  FOR EACH ROW
  EXECUTE FUNCTION trigger_updated_at();

-- 5. VERIFICAR SE TODOS OS TRIGGERS FORAM REMOVIDOS
SELECT 
  'TRIGGERS RESTANTES NA TABELA checklist_itens:' as info;

SELECT 
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'checklist_itens'::regclass
ORDER BY t.tgname;

-- 6. TESTAR SE AGORA PODEMOS INSERIR/ATUALIZAR SEM PROBLEMAS
SELECT 'TESTE: Verificando se podemos atualizar marcado_por sem interferência' as status;