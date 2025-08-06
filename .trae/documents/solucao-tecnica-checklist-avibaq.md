# 🛠️ Solução Técnica Definitiva - Sistema de Checklist AVIBAQ

## 🎯 Objetivo

Este documento contém a implementação técnica completa para corrigir definitivamente os problemas do sistema de checklist, baseado no diagnóstico realizado.

## 📋 Scripts de Correção

### 1. Script Principal de Correção

```sql
-- =====================================================================
-- CORREÇÃO DEFINITIVA DO SISTEMA DE CHECKLIST AVIBAQ
-- Data: Janeiro 2025
-- Problema: Incompatibilidade estrutural e foreign key constraints
-- =====================================================================

-- ETAPA 1: BACKUP DE SEGURANÇA
DO $$
BEGIN
    -- Criar backup apenas se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_itens_backup_jan2025') THEN
        CREATE TABLE checklist_itens_backup_jan2025 AS SELECT * FROM checklist_itens;
        RAISE NOTICE '✅ Backup criado: checklist_itens_backup_jan2025';
    ELSE
        RAISE NOTICE 'ℹ️ Backup já existe, pulando criação';
    END IF;
END $$;

-- ETAPA 2: REMOVER CONSTRAINTS PROBLEMÁTICOS
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_marcado_por_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_created_by_fkey;

RAISE NOTICE '✅ Constraints problemáticos removidos';

-- ETAPA 3: ADICIONAR COLUNAS QUE O FRONTEND ESPERA
DO $$
BEGIN
    -- Adicionar coluna marcado_em se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'checklist_itens' AND column_name = 'marcado_em') THEN
        ALTER TABLE checklist_itens ADD COLUMN marcado_em TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Coluna marcado_em adicionada';
    END IF;
    
    -- Adicionar coluna marcado_por se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'checklist_itens' AND column_name = 'marcado_por') THEN
        ALTER TABLE checklist_itens ADD COLUMN marcado_por UUID;
        RAISE NOTICE '✅ Coluna marcado_por adicionada';
    END IF;
    
    -- Garantir que todas as colunas de usuário são opcionais
    ALTER TABLE checklist_itens ALTER COLUMN preenchido_por DROP NOT NULL;
    ALTER TABLE checklist_itens ALTER COLUMN marcado_por DROP NOT NULL;
    
    RAISE NOTICE '✅ Colunas configuradas como opcionais';
END $$;

-- ETAPA 4: MIGRAR DADOS EXISTENTES
UPDATE checklist_itens SET 
    marcado_em = COALESCE(marcado_em, preenchido_em, updated_at, created_at),
    marcado_por = COALESCE(marcado_por, preenchido_por)
WHERE marcado_em IS NULL OR marcado_por IS NULL;

RAISE NOTICE '✅ Dados migrados das colunas antigas';

-- ETAPA 5: RECRIAR FOREIGN KEYS COMO OPCIONAIS
ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_marcado_por_fkey 
    FOREIGN KEY (marcado_por) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_preenchido_por_fkey 
    FOREIGN KEY (preenchido_por) REFERENCES users(id) ON DELETE SET NULL;

RAISE NOTICE '✅ Foreign keys opcionais recriados';

-- ETAPA 6: CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_checklist_marcado_por ON checklist_itens(marcado_por);
CREATE INDEX IF NOT EXISTS idx_checklist_marcado_em ON checklist_itens(marcado_em);

RAISE NOTICE '✅ Índices criados';

-- ETAPA 7: VERIFICAR ESTRUTURA FINAL
SELECT 
    'ESTRUTURA FINAL DA TABELA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
    AND column_name IN ('marcado_em', 'marcado_por', 'preenchido_por', 'item_descricao', 'motivo_nao_marcado')
ORDER BY column_name;

SELECT '🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!' as status;
```

### 2. Função Corrigida para Criação Automática de Checklist

```sql
-- =====================================================================
-- FUNÇÃO CORRIGIDA: CRIAR CHECKLIST AUTOMÁTICO
-- =====================================================================

CREATE OR REPLACE FUNCTION criar_checklist_padrao(p_voo_id UUID)
RETURNS VOID AS $$
DECLARE
    user_table_id UUID := NULL;
    user_email TEXT;
BEGIN
    RAISE NOTICE '[CHECKLIST] Iniciando criação para voo: %', p_voo_id;
    
    -- BUSCA DEFENSIVA DO USUÁRIO
    BEGIN
        -- Método 1: Buscar diretamente por auth_id
        SELECT id INTO user_table_id 
        FROM users 
        WHERE auth_id = auth.uid();
        
        RAISE NOTICE '[CHECKLIST] Busca por auth_id: % -> %', auth.uid(), user_table_id;
        
        -- Método 2: Se não encontrou, buscar por email
        IF user_table_id IS NULL THEN
            SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
            
            IF user_email IS NOT NULL THEN
                SELECT id INTO user_table_id FROM users WHERE email = user_email;
                RAISE NOTICE '[CHECKLIST] Busca por email: % -> %', user_email, user_table_id;
            END IF;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[CHECKLIST] Erro na busca de usuário: %', SQLERRM;
            user_table_id := NULL;
    END;
    
    -- CRIAR ITENS DO CHECKLIST
    INSERT INTO checklist_itens (
        voo_id, bloco, item_numero, item_descricao, marcado, 
        motivo_nao_marcado, marcado_por, preenchido_por, created_at
    ) VALUES
    -- BLOCO 1: Preparação e Verificações Iniciais
    (p_voo_id, 'bloco1', 1, 'Verificação de fixação e estrutura do queimador e tanques', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 2, 'Verificar os cabos/mosquetões do cesto', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 3, 'Verificar fitas de tanques bem ajustadas e presas', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 4, 'Verificar válvulas do suspiro cheias', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 5, 'Garantir mangueiras com folgas para manobra necessária', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 6, 'Verificar mangueiras fora da borda do cesto', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 7, 'Confirmar registros dos tanques devidamente fechados', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 8, 'Verificar conexões entre queimador e tanques', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 9, 'Verificar pressão do extintor 1 (ponteiro no verde)', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 10, 'Verificar pressão do extintor 2 (ponteiro no verde)', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 11, 'Conferir kit de primeiros socorros completo', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco1', 12, 'Fazer primeiro acionamento do queimador (teste)', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    
    -- BLOCO 2: Preparação do Balão
    (p_voo_id, 'bloco2', 1, 'Conectar ancoragem em ponto fixo e resistente', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 2, 'Usar sistema de desengate rápido apropriado', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 3, 'Inspecionar cabos do envelope íntegros', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 4, 'Conectar cabos de forma ordenada', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 5, 'Garantir mosquetões fechados corretamente', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 6, 'Esticar envelope no chão para verificação', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 7, 'Posicionar ventiladores e travar rodas', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco2', 8, 'Colocar cone de segurança delimitando área', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    
    -- BLOCO 3: Verificações Finais
    (p_voo_id, 'bloco3', 1, 'Rever conexões bem apertadas e posicionadas', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 2, 'Verificar itens obrigatórios na mala de voo', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 3, 'Instalar instrumentos de voo', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 4, 'Chamar passageiros para embarque', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 5, 'Apresentar piloto e equipamento', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 6, 'Repetir treinamento da posição de pouso', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 7, 'Informar decolagem na frequência 142.210 MHz', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW()),
    (p_voo_id, 'bloco3', 8, 'Verificar condições de vento', false, 'Aguardando preenchimento', user_table_id, user_table_id, NOW());
    
    RAISE NOTICE '[CHECKLIST] ✅ Criado checklist com 24 itens para voo % (usuário: %)', p_voo_id, user_table_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '[CHECKLIST] ❌ ERRO ao criar checklist: %', SQLERRM;
        -- Não falhar a criação do voo por causa do checklist
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS trigger_voos_criar_checklist ON voos;

CREATE TRIGGER trigger_voos_criar_checklist
    AFTER INSERT ON voos
    FOR EACH ROW
    EXECUTE FUNCTION criar_checklist_padrao(NEW.id);

RAISE NOTICE '✅ Trigger recriado com função corrigida';
```

### 3. Código Frontend Corrigido

```typescript
// pages/piloto/checklist/[id].tsx - Função handleItemChange corrigida

const handleItemChange = async (itemId: string, marcado: boolean, motivo?: string) => {
  console.log('[Checklist] Iniciando atualização:', { itemId, marcado, motivo, user: user?.users_table_id });
  
  // VALIDAÇÃO CRÍTICA: Verificar se usuário está autenticado
  if (!user?.users_table_id) {
    console.error('[Checklist] ❌ Usuário não identificado:', user);
    toast({
      title: "Erro de autenticação",
      description: "Não foi possível identificar o usuário. Faça login novamente.",
      variant: "destructive"
    });
    return;
  }

  // PREPARAR DADOS PARA ATUALIZAÇÃO
  const updateData: any = {
    marcado,
    marcado_em: new Date().toISOString(),
    marcado_por: user.users_table_id,
    updated_at: new Date().toISOString()
  };

  // LÓGICA DO MOTIVO
  if (!marcado && motivo?.trim()) {
    updateData.motivo_nao_marcado = motivo.trim();
  } else if (marcado) {
    updateData.motivo_nao_marcado = null;
  }

  console.log('[Checklist] Dados para atualização:', updateData);

  // ATUALIZAR ESTADO LOCAL PRIMEIRO (OTIMISTIC UPDATE)
  const itemAnterior = checklistItems.find(item => item.id === itemId);
  
  setChecklistItems(items => 
    items.map(item => 
      item.id === itemId 
        ? { ...item, ...updateData }
        : item
    )
  );

  // SALVAR NO SERVIDOR SE ONLINE
  if (isOnline) {
    try {
      setAutoSaving(true);
      console.log('[Checklist] Enviando para Supabase...');

      const { data, error } = await supabase
        .from('checklist_itens')
        .update(updateData)
        .eq('id', itemId)
        .select('*');

      if (error) {
        console.error('[Checklist] ❌ Erro do Supabase:', error);
        
        // REVERTER ESTADO LOCAL EM CASO DE ERRO
        if (itemAnterior) {
          setChecklistItems(items => 
            items.map(item => 
              item.id === itemId ? itemAnterior : item
            )
          );
        }
        
        // MOSTRAR ERRO ESPECÍFICO
        let errorMessage = "Erro desconhecido";
        if (error.message.includes('foreign key')) {
          errorMessage = "Erro de autenticação. Faça login novamente.";
        } else if (error.message.includes('violates')) {
          errorMessage = "Dados inválidos. Verifique os campos preenchidos.";
        } else {
          errorMessage = error.message;
        }
        
        toast({
          title: "Erro ao salvar item",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      console.log('[Checklist] ✅ Item atualizado com sucesso:', data);
      
      // CONFIRMAR SUCESSO
      toast({
        title: "Item atualizado",
        description: marcado ? "Item marcado como concluído" : "Motivo registrado",
        variant: "default"
      });
      
    } catch (error) {
      console.error('[Checklist] ❌ Erro inesperado:', error);
      
      // REVERTER ESTADO LOCAL
      if (itemAnterior) {
        setChecklistItems(items => 
          items.map(item => 
            item.id === itemId ? itemAnterior : item
          )
        );
      }
      
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setAutoSaving(false);
    }
  } else {
    // MODO OFFLINE
    console.log('[Checklist] Modo offline - salvando localmente');
    saveDraftToStorage();
    
    toast({
      title: "Modo offline",
      description: "Item salvo localmente. Será sincronizado quando voltar online.",
      variant: "default"
    });
  }
};
```

### 4. Script de Validação

```sql
-- =====================================================================
-- SCRIPT DE VALIDAÇÃO PÓS-CORREÇÃO
-- =====================================================================

-- 1. Verificar estrutura da tabela
SELECT 
    '1. ESTRUTURA DA TABELA' as teste,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
ORDER BY ordinal_position;

-- 2. Verificar constraints
SELECT 
    '2. FOREIGN KEY CONSTRAINTS' as teste,
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc 
    ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage kcu2 
    ON rc.unique_constraint_name = kcu2.constraint_name
WHERE kcu.table_name = 'checklist_itens'
AND kcu.column_name IN ('marcado_por', 'preenchido_por');

-- 3. Testar inserção de item
DO $$
DECLARE
    test_voo_id UUID := gen_random_uuid();
    test_user_id UUID;
BEGIN
    -- Buscar um usuário existente para teste
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '3. TESTE DE INSERÇÃO: ❌ Nenhum usuário encontrado para teste';
        RETURN;
    END IF;
    
    -- Tentar inserir item de teste
    INSERT INTO checklist_itens (
        voo_id, bloco, item_numero, item_descricao, 
        marcado, motivo_nao_marcado, marcado_por
    ) VALUES (
        test_voo_id, 'bloco1', 999, 'TESTE - Item de validação', 
        false, 'Teste de validação', test_user_id
    );
    
    RAISE NOTICE '3. TESTE DE INSERÇÃO: ✅ Sucesso com user_id %', test_user_id;
    
    -- Limpar teste
    DELETE FROM checklist_itens WHERE item_numero = 999 AND item_descricao LIKE 'TESTE%';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '3. TESTE DE INSERÇÃO: ❌ Erro: %', SQLERRM;
END $$;

-- 4. Verificar dados existentes
SELECT 
    '4. DADOS EXISTENTES' as teste,
    COUNT(*) as total_itens,
    COUNT(CASE WHEN marcado_por IS NOT NULL THEN 1 END) as com_marcado_por,
    COUNT(CASE WHEN marcado_em IS NOT NULL THEN 1 END) as com_marcado_em,
    COUNT(CASE WHEN marcado = true THEN 1 END) as marcados
FROM checklist_itens;

SELECT '🎉 VALIDAÇÃO CONCLUÍDA!' as status;
```

## 🚀 Instruções de Implementação

### Passo 1: Aplicar Correções SQL
```bash
# No dashboard do Supabase, execute na seguinte ordem:
1. Script Principal de Correção
2. Função Corrigida para Criação Automática
3. Script de Validação
```

### Passo 2: Atualizar Código Frontend
```bash
# Substitua a função handleItemChange no arquivo:
# pages/piloto/checklist/[id].tsx
```

### Passo 3: Testar Funcionalidade
```bash
1. Criar um novo voo
2. Acessar checklist do voo
3. Marcar alguns itens
4. Verificar se não há erros no console
5. Confirmar dados no banco
```

## 📊 Monitoramento Pós-Implementação

### Logs a Observar
- `[Checklist] ✅ Item atualizado com sucesso`
- `[Checklist] ❌ Erro do Supabase` (não deve aparecer)
- Console limpo sem erros de foreign key

### Métricas de Sucesso
- 0 erros de foreign key constraint
- 100% dos itens de checklist salvos corretamente
- Tempo de resposta < 500ms para marcação de itens

---

**Status:** Pronto para implementação  
**Prioridade:** 🔴 Crítica  
**Tempo estimado:** 2-3 horas