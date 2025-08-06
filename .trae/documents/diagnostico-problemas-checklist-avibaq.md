# 🔧 Diagnóstico Completo dos Problemas no Sistema de Checklist - AVIBAQ

## 📋 Resumo Executivo

O sistema de checklist do AVIBAQ está apresentando falhas críticas que impedem o funcionamento adequado da marcação de itens. Após análise profunda do código e dos erros reportados, identificamos **3 problemas principais** que precisam ser corrigidos de forma coordenada.

## 🚨 Problemas Identificados

### 1. **Incompatibilidade de Estrutura de Dados**

**Problema:** Existe uma discrepância crítica entre a estrutura da tabela `checklist_itens` no banco de dados e o que o código frontend espera.

**Tabela Real (Supabase):**
```sql
CREATE TABLE checklist_itens (
  id UUID PRIMARY KEY,
  voo_id UUID REFERENCES voos(id),
  bloco bloco_checklist,
  item_numero INTEGER,
  item_descricao TEXT,  -- ❌ Frontend espera 'descricao'
  marcado BOOLEAN,
  motivo_nao_marcado TEXT,
  preenchido_em TIMESTAMP,  -- ❌ Frontend usa 'marcado_em'
  preenchido_por UUID       -- ❌ Frontend usa 'marcado_por'
);
```

**Código Frontend Espera:**
```typescript
interface ChecklistItem {
  id: string;
  voo_id: string;
  bloco: number;
  item_numero: number;
  descricao: string;        // ✅ Mas tabela tem 'item_descricao'
  marcado: boolean;
  motivo_nao_marcado?: string;
  marcado_em?: string;      // ✅ Mas tabela tem 'preenchido_em'
  marcado_por?: string;     // ✅ Mas tabela tem 'preenchido_por'
}
```

### 2. **Problemas de Foreign Key Constraints**

**Problema:** As colunas `preenchido_por` e `marcado_por` têm constraints de foreign key que referenciam a tabela `users`, mas o código está tentando inserir valores incompatíveis.

**Erros Observados:**
- `foreign key constraint "checklist_itens_preenchido_por_fkey"`
- `foreign key constraint "checklist_itens_marcado_por_fkey"`

**Causa Raiz:**
```typescript
// No código frontend:
const updateData = {
  marcado,
  marcado_em: new Date().toISOString(),
  marcado_por: user?.users_table_id  // ❌ Pode ser undefined ou inválido
};
```

### 3. **Múltiplas Tentativas de Correção Inconsistentes**

**Problema:** Existem vários arquivos de correção SQL que foram aplicados parcialmente, criando um estado inconsistente:

- `fix_checklist_foreign_key_FINAL.sql`
- `fix_marcado_por_column.sql`
- `fix_missing_checklist_columns.sql`
- `fix_checklist_trigger_correct.sql`

Cada um tentou resolver parte do problema, mas criaram conflitos entre si.

## 🔍 Análise dos Erros do Console

Baseado na imagem fornecida, os erros principais são:

1. **Erro de Foreign Key:** `violates foreign key constraint "checklist_itens_marcado_por_fkey"`
2. **Coluna Inexistente:** Tentativas de UPDATE em colunas que não existem ou têm nomes diferentes
3. **Valores NULL:** Tentativa de inserir NULL em colunas NOT NULL

## 🎯 Solução Definitiva

### Fase 1: Padronização da Estrutura da Tabela

```sql
-- 1. Criar backup da tabela atual
CREATE TABLE checklist_itens_backup AS SELECT * FROM checklist_itens;

-- 2. Adicionar colunas que o frontend espera (se não existirem)
ALTER TABLE checklist_itens ADD COLUMN IF NOT EXISTS marcado_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE checklist_itens ADD COLUMN IF NOT EXISTS marcado_por UUID;

-- 3. Migrar dados das colunas antigas para as novas
UPDATE checklist_itens SET 
  marcado_em = preenchido_em,
  marcado_por = preenchido_por
WHERE marcado_em IS NULL;

-- 4. Tornar foreign keys opcionais
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_marcado_por_fkey;

ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_marcado_por_fkey 
  FOREIGN KEY (marcado_por) REFERENCES users(id) ON DELETE SET NULL;
```

### Fase 2: Correção do Código Frontend

```typescript
// pages/piloto/checklist/[id].tsx
const handleItemChange = async (itemId: string, marcado: boolean, motivo?: string) => {
  // Validar se user existe antes de usar
  if (!user?.users_table_id) {
    console.error('[Checklist] Usuário não identificado:', user);
    toast({
      title: "Erro de autenticação",
      description: "Não foi possível identificar o usuário. Faça login novamente.",
      variant: "destructive"
    });
    return;
  }

  const updateData: any = {
    marcado,
    marcado_em: new Date().toISOString(),
    marcado_por: user.users_table_id
  };

  if (!marcado && motivo) {
    updateData.motivo_nao_marcado = motivo;
  } else if (marcado) {
    updateData.motivo_nao_marcado = null;
  }

  // Atualizar estado local primeiro
  setChecklistItems(items => 
    items.map(item => 
      item.id === itemId 
        ? { ...item, ...updateData }
        : item
    )
  );

  // Salvar no servidor se online
  if (isOnline) {
    try {
      setAutoSaving(true);

      const { error } = await supabase
        .from('checklist_itens')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        console.error('[Checklist] Erro ao atualizar item:', error);
        
        // Reverter estado local em caso de erro
        setChecklistItems(items => 
          items.map(item => 
            item.id === itemId 
              ? { ...item, marcado: !marcado } // Reverter
              : item
          )
        );
        
        toast({
          title: "Erro ao salvar",
          description: `Erro: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('[Checklist] Item atualizado com sucesso:', itemId);
      
    } catch (error) {
      console.error('[Checklist] Erro inesperado:', error);
    } finally {
      setAutoSaving(false);
    }
  }
};
```

### Fase 3: Correção da Função de Criação Automática

```sql
-- Corrigir função que cria checklist automaticamente
CREATE OR REPLACE FUNCTION criar_checklist_padrao(p_voo_id UUID)
RETURNS VOID AS $$
DECLARE
  user_table_id UUID := NULL;
BEGIN
  -- Tentar identificar usuário atual
  BEGIN
    SELECT id INTO user_table_id 
    FROM users 
    WHERE auth_id = auth.uid();
    
    IF user_table_id IS NULL THEN
      -- Fallback: buscar por email
      SELECT u.id INTO user_table_id
      FROM users u
      JOIN auth.users au ON u.email = au.email
      WHERE au.id = auth.uid();
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      user_table_id := NULL;
  END;

  -- Criar itens do checklist com estrutura correta
  INSERT INTO checklist_itens (
    voo_id, bloco, item_numero, item_descricao, marcado, 
    motivo_nao_marcado, marcado_por
  ) VALUES
  -- Bloco 1
  (p_voo_id, 'bloco1', 1, 'Verificação de fixação e estrutura do queimador e tanques', false, 'Aguardando preenchimento', user_table_id),
  (p_voo_id, 'bloco1', 2, 'Verificar os cabos/mosquetões do cesto', false, 'Aguardando preenchimento', user_table_id),
  -- ... outros itens
  ;
  
  RAISE NOTICE '[CHECKLIST] Criado checklist para voo % com user %', p_voo_id, user_table_id;
END;
$$ LANGUAGE plpgsql;
```

## 🧪 Plano de Testes

### 1. Testes de Estrutura
```sql
-- Verificar se todas as colunas existem
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
AND column_name IN ('marcado_em', 'marcado_por', 'item_descricao')
ORDER BY column_name;
```

### 2. Testes de Funcionalidade
1. Criar um novo voo
2. Verificar se checklist é criado automaticamente
3. Tentar marcar um item como concluído
4. Tentar marcar um item como não concluído com motivo
5. Verificar se dados são salvos corretamente

### 3. Testes de Rollback
```sql
-- Em caso de problemas, restaurar backup
DROP TABLE checklist_itens;
ALTER TABLE checklist_itens_backup RENAME TO checklist_itens;
```

## 📊 Cronograma de Implementação

| Fase | Atividade | Tempo Estimado | Risco |
|------|-----------|----------------|-------|
| 1 | Backup e correção da estrutura SQL | 30min | Baixo |
| 2 | Correção do código frontend | 1h | Médio |
| 3 | Correção das funções SQL | 30min | Baixo |
| 4 | Testes completos | 1h | Baixo |
| **Total** | | **3h** | |

## ⚠️ Riscos e Mitigações

### Riscos Identificados
1. **Perda de dados durante migração**
   - **Mitigação:** Backup completo antes de qualquer alteração

2. **Incompatibilidade com dados existentes**
   - **Mitigação:** Migração gradual com validação

3. **Problemas de autenticação de usuários**
   - **Mitigação:** Fallback para NULL em foreign keys

## 🎯 Critérios de Sucesso

✅ **Funcional:**
- Usuário consegue marcar itens do checklist sem erros
- Dados são salvos corretamente no banco
- Interface responde adequadamente a erros

✅ **Técnico:**
- Zero erros de foreign key constraint
- Logs limpos no console
- Performance mantida

✅ **Negócio:**
- Pilotos conseguem completar checklists
- Dados de segurança são preservados
- Sistema funciona offline/online

## 📝 Próximos Passos

1. **Imediato:** Aplicar correções SQL (Fase 1)
2. **Curto prazo:** Atualizar código frontend (Fase 2)
3. **Médio prazo:** Implementar testes automatizados
4. **Longo prazo:** Refatorar sistema de checklist para maior robustez

---

**Documento criado em:** Janeiro 2025  
**Responsável:** Sistema de Documentação AVIBAQ  
**Status:** Aguardando implementação  
**Prioridade:** 🔴 Crítica