# Análise do Problema: Falha na Criação de Voos - Políticas RLS

**Data:** 15 de Janeiro de 2025  
**Status:** 🔴 Crítico - Bloqueando funcionalidade principal  
**Responsável:** Análise Técnica SOLO Document

## 📋 Resumo Executivo

O sistema está apresentando falhas na criação de voos durante o planejamento devido à **ausência de políticas RLS de INSERT** na tabela `voos`. As correções de RLS aplicadas anteriormente focaram apenas em políticas de SELECT, removendo inadvertidamente as políticas que permitem a criação de novos registros.

## 🔍 Análise Técnica Detalhada

### **Causa Raiz Identificada**

1. **Políticas RLS de INSERT Removidas**: As migrações de correção de RLS (`20250721122210_fix_voos_rls_policies.sql`) removeram as políticas antigas mas recriaram apenas políticas de SELECT:
   - ✅ `"Pilots can view their flights"` (SELECT)
   - ✅ `"Agencies can view their flights"` (SELECT) 
   - ✅ `"Admins can view all flights"` (SELECT)
   - ❌ **Faltam políticas de INSERT, UPDATE e DELETE**

2. **Dependência de Função Auxiliar**: As políticas corrigidas dependem da função `is_user_member_owner()` que pode não estar sendo executada corretamente no contexto de INSERT.

3. **Conflito de Autenticação**: O sistema usa arquitetura híbrida (Supabase Auth + tabela `users` customizada) que pode causar incompatibilidades entre `auth.uid()` e `users.id`.

### **Fluxo de Criação de Voo Atual**

```typescript
// pages/piloto/planejamento.tsx - Linha ~200
const { data: novoVoo, error } = await supabase
  .from('voos')
  .insert({
    data_voo: formData.data,
    periodo: formData.periodo,
    piloto_id: membro.id,  // ID do membro na tabela membros
    // ... outros campos
  })
  .select()
  .single();
```

**Problema**: Quando o INSERT é executado, o RLS bloqueia a operação porque não há política que permita a criação.

### **Políticas RLS Originais (Funcionais)**

```sql
-- Política original que funcionava
CREATE POLICY "Pilotos podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.piloto_id 
      AND u.id = auth.uid()
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    )
  );
```

### **Estado Atual das Políticas**

```sql
-- Apenas políticas de SELECT existem
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'voos';

-- Resultado esperado:
-- "Pilots can view their flights" | SELECT
-- "Agencies can view their flights" | SELECT  
-- "Admins can view all flights" | SELECT
-- (Faltam: INSERT, UPDATE, DELETE)
```

## 🎯 Impacto do Problema

### **Funcionalidades Afetadas**
- ❌ Criação de novos voos por pilotos
- ❌ Criação de voos por agências
- ❌ Planejamento de voos (funcionalidade principal)
- ⚠️ Possível impacto em atualizações de voos existentes

### **Usuários Impactados**
- **Pilotos**: Não conseguem planejar novos voos
- **Agências**: Não conseguem criar voos para pilotos vinculados
- **Sistema**: Funcionalidade core bloqueada

### **Erro Observado no Console**
```javascript
// Erro típico de RLS violation
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"voos\""
}
```

## 🛠️ Plano de Resolução

### **Fase 1: Diagnóstico Completo (15 min)**

1. **Verificar Políticas Atuais**
   ```sql
   -- Executar no Supabase SQL Editor
   SELECT schemaname, tablename, policyname, cmd, qual, with_check 
   FROM pg_policies 
   WHERE tablename = 'voos' 
   ORDER BY cmd;
   ```

2. **Testar Função Auxiliar**
   ```sql
   -- Verificar se função existe e funciona
   SELECT is_user_member_owner('uuid-do-membro-teste');
   ```

3. **Validar Estrutura de Autenticação**
   ```sql
   -- Verificar consistência auth.uid() vs users.id
   SELECT 
     auth.uid() as auth_id,
     u.id as users_id,
     u.email,
     m.id as membro_id
   FROM auth.users au
   JOIN users u ON au.email = u.email
   LEFT JOIN membros m ON m.user_id = u.id OR m.email = u.email
   WHERE au.id = auth.uid();
   ```

### **Fase 2: Correção das Políticas RLS (30 min)**

1. **Recriar Políticas de INSERT**
   ```sql
   -- Política para pilotos criarem voos
   CREATE POLICY "Pilotos podem criar voos" ON voos
     FOR INSERT WITH CHECK (
       is_user_member_owner(piloto_id) AND
       EXISTS (
         SELECT 1 FROM membros 
         WHERE id = piloto_id 
         AND tipo = 'piloto' 
         AND status = 'ativo'
       )
     );
   
   -- Política para agências criarem voos
   CREATE POLICY "Agências podem criar voos" ON voos
     FOR INSERT WITH CHECK (
       agencia_id IS NOT NULL AND
       is_user_member_owner(agencia_id) AND
       EXISTS (
         SELECT 1 FROM membros 
         WHERE id = agencia_id 
         AND tipo = 'agencia' 
         AND status = 'ativo'
       ) AND
       EXISTS (
         SELECT 1 FROM vinculos_agencia_piloto v
         WHERE v.agencia_id = voos.agencia_id
         AND v.piloto_id = voos.piloto_id
         AND v.status = 'aceito'
       )
     );
   ```

2. **Recriar Políticas de UPDATE**
   ```sql
   CREATE POLICY "Usuários podem atualizar seus voos" ON voos
     FOR UPDATE USING (
       is_user_member_owner(piloto_id) OR 
       (agencia_id IS NOT NULL AND is_user_member_owner(agencia_id)) OR
       is_admin_user()
     );
   ```

3. **Política de DELETE (Apenas Admins)**
   ```sql
   CREATE POLICY "Apenas admins podem deletar voos" ON voos
     FOR DELETE USING (is_admin_user());
   ```

### **Fase 3: Validação e Testes (20 min)**

1. **Teste de Criação de Voo**
   ```sql
   -- Simular criação como piloto
   INSERT INTO voos (
     data_voo, periodo, piloto_id, status,
     adultos_previstos, criancas_previstas
   ) VALUES (
     '2025-01-20', 'manha', 'uuid-piloto-teste', 'rascunho',
     2, 0
   );
   ```

2. **Teste via Interface**
   - Acessar `/piloto/planejamento`
   - Preencher formulário de voo
   - Verificar criação sem erros
   - Confirmar redirecionamento para dashboard

3. **Verificar Logs**
   ```javascript
   // No console do navegador
   console.log('[TESTE] Tentativa de criação de voo:', formData);
   console.log('[TESTE] Resposta Supabase:', { data, error });
   ```

### **Fase 4: Documentação e Monitoramento (10 min)**

1. **Atualizar Documentação**
   - Registrar correção aplicada
   - Documentar políticas RLS atuais
   - Criar checklist de validação

2. **Configurar Monitoramento**
   ```sql
   -- Query para monitorar falhas de RLS
   SELECT 
     COUNT(*) as total_errors,
     DATE_TRUNC('hour', created_at) as hour
   FROM logs_sistema 
   WHERE error_type = 'RLS_VIOLATION' 
   AND table_name = 'voos'
   GROUP BY hour
   ORDER BY hour DESC;
   ```

## 🔧 Script de Correção Completo

```sql
-- CORREÇÃO COMPLETA DAS POLÍTICAS RLS DA TABELA VOOS
-- Data: 15 de janeiro de 2025
-- Problema: Políticas de INSERT removidas inadvertidamente

-- 1. Verificar estado atual
SELECT 'Políticas atuais:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'voos';

-- 2. Recriar políticas de INSERT
CREATE POLICY "Pilotos podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    is_user_member_owner(piloto_id) AND
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = piloto_id 
      AND tipo = 'piloto' 
      AND status = 'ativo'
    )
  );

CREATE POLICY "Agências podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    agencia_id IS NOT NULL AND
    is_user_member_owner(agencia_id) AND
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = agencia_id 
      AND tipo = 'agencia' 
      AND status = 'ativo'
    ) AND
    EXISTS (
      SELECT 1 FROM vinculos_agencia_piloto v
      WHERE v.agencia_id = voos.agencia_id
      AND v.piloto_id = voos.piloto_id
      AND v.status = 'aceito'
    )
  );

-- 3. Recriar políticas de UPDATE
CREATE POLICY "Usuários podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    is_user_member_owner(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_user_member_owner(agencia_id)) OR
    is_admin_user()
  );

-- 4. Política de DELETE
CREATE POLICY "Apenas admins podem deletar voos" ON voos
  FOR DELETE USING (is_admin_user());

-- 5. Verificar resultado
SELECT 'Políticas após correção:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'voos' ORDER BY cmd;

-- 6. Teste básico
SELECT 'Teste de função auxiliar:' as info;
SELECT 
  auth.uid() as current_user,
  is_admin_user() as is_admin,
  COUNT(*) as member_count
FROM membros m
WHERE is_user_member_owner(m.id);
```

## ⚠️ Riscos e Considerações

### **Riscos da Correção**
- **Baixo**: Políticas são aditivas, não afetam funcionalidades existentes
- **Médio**: Possível impacto em performance se função `is_user_member_owner()` for lenta
- **Baixo**: Risco de regressão em outras funcionalidades

### **Plano de Rollback**
```sql
-- Em caso de problemas, remover políticas criadas
DROP POLICY IF EXISTS "Pilotos podem criar voos" ON voos;
DROP POLICY IF EXISTS "Agências podem criar voos" ON voos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Apenas admins podem deletar voos" ON voos;
```

### **Monitoramento Pós-Correção**
- Verificar logs de erro por 24h
- Monitorar performance de queries na tabela `voos`
- Validar criação de voos por diferentes tipos de usuário
- Confirmar funcionamento de atualizações de status

## 📊 Métricas de Sucesso

- ✅ **Criação de voos funcionando** sem erros RLS
- ✅ **Tempo de resposta** < 2s para criação de voo
- ✅ **Zero erros** relacionados a RLS na tabela voos
- ✅ **Funcionalidades relacionadas** (checklist, anexos) funcionando

## 🔄 Próximos Passos

1. **Aplicar correção** no ambiente de desenvolvimento
2. **Testar extensivamente** todas as funcionalidades de voo
3. **Aplicar em produção** durante janela de manutenção
4. **Monitorar** por 48h após aplicação
5. **Documentar lições aprendidas** para evitar regressões futuras

---

**Conclusão**: O problema é bem definido e a solução é direta. A aplicação das políticas RLS de INSERT resolverá o bloqueio na criação de voos, restaurando a funcionalidade principal do sistema.