# CAUSA RAIZ DO PROBLEMA marcado_por

## Resumo do Problema
O campo `marcado_por` nos itens de checklist estava sendo preenchido com o `auth.uid()` em vez do `users_table_id` enviado pelo frontend, causando erro de foreign key constraint.

## Investigação Realizada

### 1. Análise do Hook useUser
- ✅ Hook funcionando corretamente
- ✅ Função RPC `get_current_user_table_id()` retornando ID válido
- ✅ Frontend enviando `users_table_id` correto: `f36990a5-192f-41dc-aa95-8720d9122071`

### 2. Análise do Banco de Dados
- ✅ Tabela `users` contém o registro do Igor com ID correto
- ✅ Foreign key constraints configuradas corretamente
- ❌ Valor sendo substituído antes da validação

### 3. Causa Raiz Identificada
**Arquivo:** `supabase/migrations/20250804190305_adapt_checklist_real_structure.sql`
**Trigger:** `trigger_checklist_validation_real`
**Função:** `trigger_checklist_validation_real()`

**Código Problemático (linhas 35-54):**
```sql
-- CONVERSÃO de auth.uid() para marcado_por (campo correto da estrutura real)
-- Primeiro: tentar busca direta por ID
SELECT id INTO user_table_id FROM users WHERE id = auth.uid();

IF user_table_id IS NOT NULL THEN
  NEW.marcado_por = user_table_id;  -- ❌ SOBRESCREVE O VALOR DO FRONTEND
ELSE
  -- Fallback: buscar por email se não encontrou por ID direto
  -- ...
END IF;
```

## Fluxo do Problema

1. **Frontend** envia `marcado_por: 'f36990a5-192f-41dc-aa95-8720d9122071'` (users_table_id correto)
2. **Trigger** `trigger_checklist_validation_real` executa ANTES da inserção/atualização
3. **Trigger** força `NEW.marcado_por = auth.uid()` = `'7e85dac4-7a9f-48d6-a073-e0aeb2a63b64'`
4. **Validação** `validate_checklist_user_ids()` verifica se `'7e85dac4-7a9f-48d6-a073-e0aeb2a63b64'` existe na tabela `users`
5. **Erro** porque `auth.uid()` não existe como `id` na tabela `users`

## Solução Proposta

### Opção 1: Remover Conversão Automática
Remover o trigger `trigger_checklist_validation_real` e permitir que o frontend envie o `users_table_id` diretamente.

### Opção 2: Corrigir a Lógica do Trigger
Modificar o trigger para não sobrescrever o `marcado_por` quando ele já vem preenchido do frontend.

## Arquivos de Correção Criados

1. `supabase/migrations/remove_trigger_checklist_validation_real.sql` - Remove o trigger problemático
2. `apply-trigger-fix.js` - Script para aplicar a correção

## Status Atual
- ❌ Problema ainda não resolvido devido a problemas de conectividade com Supabase
- ✅ Causa raiz identificada e documentada
- ✅ Solução preparada e testada localmente

## Próximos Passos
1. Aplicar a migração `remove_trigger_checklist_validation_real.sql` no Supabase
2. Testar o fluxo completo do Igor novamente
3. Verificar se outros triggers similares existem

## Impacto
- **Funcionalidade afetada:** Preenchimento de checklist
- **Usuários afetados:** Todos os usuários que tentam marcar itens de checklist
- **Severidade:** Alta (funcionalidade principal não funciona)

---
*Documentação criada em: 05/08/2025*
*Investigação realizada por: SOLO Coding*