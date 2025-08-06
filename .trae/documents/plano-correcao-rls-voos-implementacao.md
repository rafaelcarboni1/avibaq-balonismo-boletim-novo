# Plano de Implementação: Correção RLS Voos

**Data:** 15 de Janeiro de 2025  
**Prioridade:** 🔴 Crítica  
**Tempo Estimado:** 1h 15min  
**Responsável:** Equipe de Desenvolvimento

## 🎯 Objetivo

Restaurar a funcionalidade de criação de voos através da recriação das políticas RLS de INSERT, UPDATE e DELETE que foram removidas inadvertidamente durante correções anteriores.

## 📋 Pré-requisitos

### **Verificações Obrigatórias**
- [ ] Acesso ao Supabase SQL Editor
- [ ] Backup do banco de dados atual
- [ ] Ambiente de teste disponível
- [ ] Usuário piloto de teste configurado

### **Dependências Técnicas**
- [ ] Função `is_user_member_owner()` funcionando
- [ ] Função `is_admin_user()` funcionando
- [ ] Tabela `membros` com dados consistentes
- [ ] Tabela `vinculos_agencia_piloto` atualizada

## 🔍 Fase 1: Diagnóstico (15 min)

### **1.1 Verificar Estado Atual das Políticas**

```sql
-- Script de diagnóstico completo
-- Execute no Supabase SQL Editor

-- 1. Listar políticas atuais da tabela voos
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operacao,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Funcionando'
    WHEN cmd = 'INSERT' THEN '🔧 Precisa verificar'
    WHEN cmd = 'UPDATE' THEN '🔧 Precisa verificar'
    WHEN cmd = 'DELETE' THEN '🔧 Precisa verificar'
  END as status
FROM pg_policies 
WHERE tablename = 'voos'
ORDER BY cmd, policyname;

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'voos';

-- 3. Contar registros na tabela voos
SELECT 
  COUNT(*) as total_voos,
  COUNT(CASE WHEN status = 'rascunho' THEN 1 END) as rascunhos,
  COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as criados_hoje
FROM voos;
```

### **1.2 Testar Funções Auxiliares**

```sql
-- Verificar se as funções auxiliares existem e funcionam

-- Teste 1: Verificar existência das funções
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('is_user_member_owner', 'is_admin_user')
AND routine_schema = 'public';

-- Teste 2: Executar função is_admin_user
SELECT 
  auth.uid() as current_user_id,
  is_admin_user() as is_admin,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as user_email;

-- Teste 3: Buscar um membro piloto para teste
SELECT 
  m.id as membro_id,
  m.nome,
  m.email,
  m.tipo,
  m.status,
  is_user_member_owner(m.id) as is_owner
FROM membros m 
WHERE m.tipo = 'piloto' 
AND m.status = 'ativo'
LIMIT 3;
```

### **1.3 Simular Erro de Criação**

```sql
-- ATENÇÃO: Este comando deve falhar com erro RLS
-- Execute apenas para confirmar o problema

-- Buscar um piloto ativo para teste
SELECT id as piloto_id, nome 
FROM membros 
WHERE tipo = 'piloto' AND status = 'ativo' 
LIMIT 1;

-- Tentar inserir voo (deve falhar)
-- SUBSTITUA 'uuid-piloto-aqui' pelo ID retornado acima
/*
INSERT INTO voos (
  data_voo, 
  periodo, 
  piloto_id, 
  status,
  adultos_previstos,
  criancas_previstas
) VALUES (
  CURRENT_DATE + INTERVAL '7 days',
  'manha',
  'uuid-piloto-aqui',  -- SUBSTITUIR
  'rascunho',
  2,
  0
);
*/

-- Resultado esperado: ERROR - new row violates row-level security policy
```

## 🛠️ Fase 2: Implementação das Correções (30 min)

### **2.1 Script de Correção Principal**

```sql
-- =====================================================================
-- CORREÇÃO COMPLETA DAS POLÍTICAS RLS DA TABELA VOOS
-- Data: 15 de janeiro de 2025
-- Objetivo: Restaurar funcionalidade de criação de voos
-- =====================================================================

BEGIN;

-- Passo 1: Verificar estado antes da correção
SELECT 'ANTES DA CORREÇÃO - Políticas existentes:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'voos' ORDER BY cmd;

-- Passo 2: Remover políticas conflitantes (se existirem)
DROP POLICY IF EXISTS "Pilotos podem criar voos" ON voos;
DROP POLICY IF EXISTS "Agências podem criar voos" ON voos;
DROP POLICY IF EXISTS "Agências podem criar voos para pilotos vinculados" ON voos;
DROP POLICY IF EXISTS "Pilotos podem criar seus voos" ON voos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Pilotos podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Agências podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Apenas admins podem deletar voos" ON voos;

-- Passo 3: Criar política de INSERT para pilotos
CREATE POLICY "Pilotos podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    -- Verificar se o usuário é dono do piloto_id
    is_user_member_owner(piloto_id) AND
    -- Verificar se o piloto está ativo
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = piloto_id 
      AND tipo = 'piloto' 
      AND status = 'ativo'
    )
  );

-- Passo 4: Criar política de INSERT para agências
CREATE POLICY "Agências podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    -- Deve ter agencia_id preenchido
    agencia_id IS NOT NULL AND
    -- Verificar se o usuário é dono da agência
    is_user_member_owner(agencia_id) AND
    -- Verificar se a agência está ativa
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = agencia_id 
      AND tipo = 'agencia' 
      AND status = 'ativo'
    ) AND
    -- Verificar se existe vínculo aceito entre agência e piloto
    EXISTS (
      SELECT 1 FROM vinculos_agencia_piloto v
      WHERE v.agencia_id = voos.agencia_id
      AND v.piloto_id = voos.piloto_id
      AND v.status = 'aceito'
    )
  );

-- Passo 5: Criar política de UPDATE
CREATE POLICY "Usuários podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    -- Piloto pode atualizar seus próprios voos
    is_user_member_owner(piloto_id) OR 
    -- Agência pode atualizar voos onde está envolvida
    (agencia_id IS NOT NULL AND is_user_member_owner(agencia_id)) OR
    -- Admins podem atualizar qualquer voo
    is_admin_user()
  );

-- Passo 6: Criar política de DELETE (apenas admins)
CREATE POLICY "Apenas admins podem deletar voos" ON voos
  FOR DELETE USING (
    is_admin_user()
  );

-- Passo 7: Verificar resultado
SELECT 'APÓS CORREÇÃO - Políticas criadas:' as status;
SELECT 
  policyname, 
  cmd,
  CASE cmd
    WHEN 'SELECT' THEN '👁️ Visualização'
    WHEN 'INSERT' THEN '➕ Criação'
    WHEN 'UPDATE' THEN '✏️ Atualização'
    WHEN 'DELETE' THEN '🗑️ Exclusão'
  END as funcionalidade
FROM pg_policies 
WHERE tablename = 'voos' 
ORDER BY cmd, policyname;

-- Passo 8: Comentários para documentação
COMMENT ON TABLE voos IS 'Tabela de voos com políticas RLS corrigidas em 15/01/2025 - INSERT/UPDATE/DELETE restaurados';

COMMIT;

-- Mensagem de sucesso
SELECT '✅ CORREÇÃO APLICADA COM SUCESSO!' as resultado;
SELECT 'Próximo passo: executar testes de validação' as proxima_acao;
```

### **2.2 Verificação Pós-Implementação**

```sql
-- Script de verificação após aplicar a correção

-- 1. Confirmar que todas as políticas foram criadas
SELECT 
  'Resumo das políticas RLS:' as info,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies 
WHERE tablename = 'voos';

-- 2. Listar todas as políticas detalhadamente
SELECT 
  policyname as "Política",
  cmd as "Operação",
  CASE 
    WHEN cmd = 'SELECT' THEN '✅'
    WHEN cmd = 'INSERT' THEN '🆕'
    WHEN cmd = 'UPDATE' THEN '📝'
    WHEN cmd = 'DELETE' THEN '🗑️'
  END as "Status"
FROM pg_policies 
WHERE tablename = 'voos'
ORDER BY 
  CASE cmd 
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END,
  policyname;
```

## ✅ Fase 3: Testes de Validação (20 min)

### **3.1 Teste de Criação de Voo (Piloto)**

```sql
-- Teste 1: Criação de voo por piloto
-- IMPORTANTE: Execute como usuário piloto autenticado

-- Buscar piloto ativo para teste
SELECT 
  id as piloto_id,
  nome,
  email,
  is_user_member_owner(id) as pode_criar
FROM membros 
WHERE tipo = 'piloto' 
AND status = 'ativo'
AND is_user_member_owner(id) = true
LIMIT 1;

-- Criar voo de teste (SUBSTITUIR piloto_id)
INSERT INTO voos (
  data_voo,
  periodo,
  piloto_id,
  status,
  adultos_previstos,
  criancas_previstas,
  local_decolagem,
  observacoes
) VALUES (
  CURRENT_DATE + INTERVAL '7 days',
  'manha',
  'SUBSTITUIR-PELO-ID-DO-PILOTO',  -- IMPORTANTE: Substituir
  'rascunho',
  2,
  1,
  'Campo de teste',
  'Voo de teste - criação via correção RLS'
)
RETURNING 
  id,
  data_voo,
  periodo,
  status,
  'Voo criado com sucesso!' as resultado;
```

### **3.2 Teste de Atualização de Voo**

```sql
-- Teste 2: Atualização de voo existente
-- Use o ID do voo criado no teste anterior

UPDATE voos 
SET 
  observacoes = 'Voo atualizado via teste RLS - ' || NOW()::text,
  adultos_previstos = 3
WHERE id = 'ID-DO-VOO-CRIADO-ACIMA'  -- SUBSTITUIR
RETURNING 
  id,
  observacoes,
  adultos_previstos,
  updated_at,
  'Voo atualizado com sucesso!' as resultado;
```

### **3.3 Teste via Interface Web**

```javascript
// Script para testar via console do navegador
// Execute na página /piloto/planejamento

// 1. Verificar se usuário está autenticado
console.log('[TESTE] Usuário atual:', await supabase.auth.getUser());

// 2. Buscar dados do piloto
const { data: membro } = await supabase
  .from('membros')
  .select('*')
  .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
  .eq('tipo', 'piloto')
  .single();

console.log('[TESTE] Dados do membro:', membro);

// 3. Tentar criar voo
const { data: novoVoo, error } = await supabase
  .from('voos')
  .insert({
    data_voo: '2025-01-25',
    periodo: 'manha',
    piloto_id: membro.id,
    status: 'rascunho',
    adultos_previstos: 2,
    criancas_previstas: 0,
    local_decolagem: 'Teste via console',
    observacoes: 'Teste de criação pós-correção RLS'
  })
  .select()
  .single();

if (error) {
  console.error('[TESTE] ❌ Erro na criação:', error);
} else {
  console.log('[TESTE] ✅ Voo criado com sucesso:', novoVoo);
}
```

## 📊 Fase 4: Monitoramento (10 min)

### **4.1 Queries de Monitoramento**

```sql
-- Monitoramento contínuo após a correção

-- 1. Estatísticas de voos criados hoje
SELECT 
  'Voos criados hoje:' as metrica,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'rascunho' THEN 1 END) as rascunhos,
  COUNT(CASE WHEN status = 'planejado' THEN 1 END) as planejados
FROM voos 
WHERE created_at >= CURRENT_DATE;

-- 2. Últimos voos criados (verificar se correção funcionou)
SELECT 
  v.id,
  v.data_voo,
  v.periodo,
  v.status,
  m.nome as piloto,
  v.created_at,
  EXTRACT(EPOCH FROM (NOW() - v.created_at))/60 as minutos_atras
FROM voos v
JOIN membros m ON v.piloto_id = m.id
ORDER BY v.created_at DESC
LIMIT 10;

-- 3. Verificar se há erros de RLS nos logs (se disponível)
-- Esta query pode não funcionar se não houver tabela de logs
/*
SELECT 
  COUNT(*) as total_erros_rls,
  MAX(created_at) as ultimo_erro
FROM logs_sistema 
WHERE error_message ILIKE '%row-level security%'
AND table_name = 'voos'
AND created_at >= CURRENT_DATE;
*/
```

### **4.2 Alertas e Validações**

```sql
-- Validações de integridade pós-correção

-- 1. Verificar se não há voos órfãos
SELECT 
  'Verificação de integridade:' as check_type,
  COUNT(*) as voos_sem_piloto
FROM voos v
LEFT JOIN membros m ON v.piloto_id = m.id
WHERE m.id IS NULL;

-- 2. Verificar se pilotos inativos não criaram voos
SELECT 
  'Voos de pilotos inativos:' as check_type,
  COUNT(*) as total
FROM voos v
JOIN membros m ON v.piloto_id = m.id
WHERE m.status != 'ativo'
AND v.created_at >= CURRENT_DATE;

-- 3. Performance check - tempo de resposta das políticas
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM voos v
JOIN membros m ON v.piloto_id = m.id
WHERE v.created_at >= CURRENT_DATE - INTERVAL '7 days';
```

## 🚨 Plano de Rollback

### **Em Caso de Problemas**

```sql
-- ROLLBACK COMPLETO - Execute apenas se houver problemas graves

BEGIN;

-- Remover todas as políticas criadas
DROP POLICY IF EXISTS "Pilotos podem criar voos" ON voos;
DROP POLICY IF EXISTS "Agências podem criar voos" ON voos;
DROP POLICY IF EXISTS "Usuários podem atualizar seus voos" ON voos;
DROP POLICY IF EXISTS "Apenas admins podem deletar voos" ON voos;

-- Recriar apenas políticas de SELECT (estado anterior)
CREATE POLICY "Pilots can view their flights" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.piloto_id 
      AND u.id = auth.uid()
      AND m.tipo = 'piloto'
    )
  );

CREATE POLICY "Agencies can view their flights" ON voos
  FOR SELECT USING (
    voos.agencia_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
    )
  );

CREATE POLICY "Admins can view all flights" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

COMMIT;

SELECT '⚠️ ROLLBACK EXECUTADO - Sistema voltou ao estado anterior' as status;
```

## 📋 Checklist Final

### **Antes de Aplicar em Produção**
- [ ] Backup do banco de dados realizado
- [ ] Testes executados em ambiente de desenvolvimento
- [ ] Função `is_user_member_owner()` validada
- [ ] Função `is_admin_user()` validada
- [ ] Usuários de teste (piloto e agência) configurados
- [ ] Plano de rollback testado

### **Durante a Aplicação**
- [ ] Script de correção executado sem erros
- [ ] Políticas RLS criadas corretamente
- [ ] Testes de criação de voo executados
- [ ] Interface web testada
- [ ] Logs verificados

### **Após a Aplicação**
- [ ] Monitoramento ativo por 24h
- [ ] Usuários notificados da correção
- [ ] Documentação atualizada
- [ ] Métricas de sucesso coletadas
- [ ] Lições aprendidas documentadas

---

**⚡ Resumo Executivo**: A correção consiste em recriar 4 políticas RLS essenciais (2 INSERT, 1 UPDATE, 1 DELETE) que foram removidas inadvertidamente. O processo é seguro, reversível e deve restaurar completamente a funcionalidade de criação de voos.