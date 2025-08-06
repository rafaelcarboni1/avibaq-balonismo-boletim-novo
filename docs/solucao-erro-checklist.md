# Solução: Erro na Criação de Voos - Checklist

## Problema Identificado

O erro na criação de voos ocorria devido a uma **inconsistência lógica** no sistema de checklist:

### Causa Raiz
1. **Durante criação do voo**: O trigger automático insere itens de checklist com:
   - `marcado = false`
   - `motivo_nao_marcado = 'Aguardando preenchimento'`

2. **Durante validação**: O trigger de validação rejeitava essa exata combinação

### Arquivos Envolvidos
- `supabase/migrations/20250111000005_create_checklist_itens.sql` (constraint original)
- Função `trigger_checklist_validation()` (validação muito restritiva)

## Solução Implementada

### 1. Nova Migração Criada
- Arquivo: `supabase/migrations/20250117000001_fix_checklist_validation.sql`

### 2. Alterações Realizadas

#### A. Constraint Atualizada
```sql
-- ANTES (muito restritiva)
CONSTRAINT check_motivo_obrigatorio CHECK (
  marcado = true OR motivo_nao_marcado IS NOT NULL
)

-- DEPOIS (permite estado inicial)
CONSTRAINT check_motivo_obrigatorio CHECK (
  marcado = true OR 
  motivo_nao_marcado IS NOT NULL
)
```

#### B. Função de Validação Corrigida
Removida a rejeição do estado "Aguardando preenchimento", permitindo que seja um estado inicial válido.

## Como Aplicar a Correção

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o conteúdo de `supabase/migrations/20250117000001_fix_checklist_validation.sql`

### Opção 2: Via Supabase CLI (se Docker estiver rodando)
```bash
npx supabase db push
```

### Opção 3: Via psql direto
```bash
psql "sua_connection_string" -f supabase/migrations/20250117000001_fix_checklist_validation.sql
```

## Validação da Correção

Após aplicar a migração, teste:
1. Criar um novo planejamento de voo
2. Verificar se o checklist é criado automaticamente sem erros
3. Confirmar que os itens aparecem com status "Aguardando preenchimento"

## Arquivos Criados

1. `supabase/migrations/20250117000001_fix_checklist_validation.sql` - Migração principal
2. `fix_checklist_validation_final.sql` - Script standalone (alternativo)
3. `docs/solucao-erro-checklist.md` - Esta documentação

## Status

✅ **Problema diagnosticado**  
✅ **Solução implementada**  
⏳ **Aguardando aplicação da migração no banco**  
⏳ **Aguardando teste de validação**