# DIAGNÓSTICO E CORREÇÕES - SISTEMA DE AUTENTICAÇÃO AVIBAQ

**Data:** 31 de julho de 2025  
**Urgência:** CRÍTICA  
**Status:** Problemas identificados, soluções em implementação

---

## 🚨 RESUMO EXECUTIVO

O sistema AVIBAQ possui um **sistema de autenticação híbrido complexo** que está causando falhas críticas. Identifiquei **5 problemas principais** que explicam os erros mostrados na interface.

### **Problemas Críticos Identificados:**
1. **Sincronização Inconsistente** entre `auth.users` e `public.users`
2. **Foreign Key Violations** em checklist e voos
3. **RLS Policies Falhando** devido a contexto de autenticação
4. **Permissões Não Carregando** por IDs incompatíveis
5. **Membros Antigos Órfãos** sem registros correlatos

---

## 🔧 ANÁLISE DETALHADA DOS PROBLEMAS

### **1. ARQUITETURA HÍBRIDA ATUAL**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   auth.users    │    │ public.users    │    │    membros      │
│                 │    │                 │    │                 │
│ id (UUID)       │────│ auth_id (FK)    │    │ user_id (FK)    │
│ email           │    │ id (UUID)       │────│ id (UUID)       │
│ created_at      │    │ email           │    │ email           │
└─────────────────┘    │ role            │    │ tipo            │
                       │ nome            │    │ status          │
                       └─────────────────┘    └─────────────────┘
```

**PROBLEMA:** Três tabelas diferentes com relacionamentos complexos e ponteiros que podem quebrar.

### **2. ERROS ESPECÍFICOS IDENTIFICADOS**

#### **A. Key is not present in table "users"**
```sql
-- CAUSA: Usuário existe em auth.users mas não em public.users
-- SINTOMA: useUser hook encontra usuário no auth mas não na tabela users
-- IMPACTO: role = null, permissões falham
```

#### **B. Foreign key constraint "checklist_itens"**
```sql
-- CAUSA: Trigger tenta inserir checklist com user_id NULL ou inexistente
-- SINTOMA: Falha ao criar voo por não conseguir criar checklist
-- IMPACTO: Usuários não conseguem criar voos
```

#### **C. usePermissions verificações falhando**
```sql
-- CAUSA: usePermissions usa users_table_id que pode ser NULL
-- SINTOMA: Todas as verificações de permissão retornam false
-- IMPACTO: Interface mostra "sem permissão" para ações válidas
```

### **3. FLUXO ATUAL E PONTOS DE FALHA**

#### **Fluxo de Login Atual:**
```javascript
1. supabase.auth.getUser() → retorna user com auth.id
2. SELECT * FROM users WHERE email = user.email → busca na tabela users
3. Se encontrar: user.role = data.role, user.users_table_id = data.id
4. Se não encontrar: user.role = null, user.users_table_id = null
```

**PONTOS DE FALHA:**
- ❌ **Passo 2**: Se email mudou, não encontra
- ❌ **Passo 3**: Se auth_id não foi definido na tabela users, vinculação fica frágil
- ❌ **Passo 4**: Sistema fica sem funcionar

#### **Fluxo de Permissões Atual:**
```javascript
1. usePermissions pega user.users_table_id || user.id
2. Chama get_user_combined_permissions(finalUserId)
3. Função RPC tenta usar auth.uid() → retorna NULL
4. Permissões falham ou ficam vazias
```

**PONTOS DE FALHA:**
- ❌ **Passo 1**: users_table_id pode ser NULL
- ❌ **Passo 3**: auth.uid() é NULL em context RPC
- ❌ **Passo 4**: Usuário fica sem permissões

---

## 🛠️ SOLUÇÕES PROPOSTAS

### **SOLUÇÃO 1: CRIAR TRIGGER DE SINCRONIZAÇÃO AUTOMÁTICA**

```sql
-- Criar função para sincronizar automaticamente novos usuários
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar registro em public.users quando usuário se cadastra em auth.users
  INSERT INTO public.users (auth_id, email, nome, role, ativo, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'piloto', true, NOW())
  ON CONFLICT (auth_id) DO UPDATE SET
    email = NEW.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();
```

### **SOLUÇÃO 2: FUNÇÃO DE CORREÇÃO PARA USUÁRIOS EXISTENTES**

```sql
-- Corrigir usuários órfãos (existem em auth mas não em public.users)
CREATE OR REPLACE FUNCTION fix_orphaned_auth_users()
RETURNS TABLE(fixed_count INTEGER, error_count INTEGER) AS $$
DECLARE
  v_fixed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  auth_user RECORD;
BEGIN
  -- Encontrar usuários em auth.users sem registro em public.users
  FOR auth_user IN 
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.auth_id = au.id
    WHERE pu.auth_id IS NULL
  LOOP
    BEGIN
      -- Tentar criar registro em public.users
      INSERT INTO public.users (auth_id, email, nome, role, ativo, created_at)
      VALUES (auth_user.id, auth_user.email, '', 'piloto', true, auth_user.created_at);
      
      v_fixed_count := v_fixed_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      RAISE NOTICE 'Erro ao corrigir usuário %: %', auth_user.email, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_fixed_count, v_error_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **SOLUÇÃO 3: CORRIGIR RLS POLICIES PARA USAR AUTH_ID**

```sql
-- Política corrigida que usa auth_id em vez de fallback por email
CREATE OR REPLACE FUNCTION is_user_authorized(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se o usuário autenticado tem acesso ao target_user_id
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND (
      id = target_user_id OR  -- Próprio usuário
      role IN ('admin', 'meteo', 'tesouraria')  -- Admin access
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar em política crítica de voos
DROP POLICY IF EXISTS "Usuários podem ver seus voos" ON voos;
CREATE POLICY "Usuários podem ver seus voos" ON voos
  FOR SELECT USING (
    is_user_authorized(piloto_id) OR 
    (agencia_id IS NOT NULL AND is_user_authorized(agencia_id))
  );
```

### **SOLUÇÃO 4: HOOK useUser OTIMIZADO**

```javascript
// Nova versão do useUser que usa auth_id como chave primária
const fetchUser = useCallback(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // CORREÇÃO: Buscar por auth_id em vez de email
      const { data, error } = await supabase
        .from("users")
        .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown")
        .eq('auth_id', user.id)  // ← MUDANÇA CRÍTICA
        .single();
        
      if (data && !error) {
        setUser({
          ...user,
          id: user.id,  // Manter auth.id para RLS
          users_table_id: data.id,  // ID da tabela users
          role: data.role,
          // ... outros campos
        });
      } else {
        // Se não encontrou, pode ser usuário órfão - tentar corrigir
        console.warn('[useUser] Usuário órfão detectado:', user.email);
        // Trigger automático deve ter criado, tentar novamente
        setTimeout(fetchUser, 1000);
      }
    }
  } catch (error) {
    console.error('[useUser] Erro:', error);
  }
}, []);
```

### **SOLUÇÃO 5: TRIGGER DE CHECKLIST CORRIGIDO**

```sql
-- Corrigir trigger que está causando foreign key violations
CREATE OR REPLACE FUNCTION trigger_voos_criar_checklist()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Buscar ID do usuário atual na tabela users usando auth.uid()
  SELECT id INTO current_user_id 
  FROM public.users 
  WHERE auth_id = auth.uid();
  
  -- Se não encontrar, criar checklist sem preenchido_por
  INSERT INTO checklist_itens (
    voo_id, bloco, categoria, item_texto, obrigatorio, preenchido_por
  ) VALUES
    (NEW.id, 1, 'documentacao', 'Documentação da aeronave em ordem', true, current_user_id),
    (NEW.id, 1, 'documentacao', 'Licença de piloto válida', true, current_user_id),
    -- ... outros itens
    (NEW.id, 2, 'operacao', 'Pouso seguro realizado', true, current_user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: ESTABILIZAÇÃO IMEDIATA** (Urgente - 1 hora)
```sql
-- 1. Executar correção de usuários órfãos
SELECT * FROM fix_orphaned_auth_users();

-- 2. Habilitar RLS nas tabelas vulneráveis
ALTER TABLE voos ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;
```

### **FASE 2: CORREÇÕES ESTRUTURAIS** (1-2 horas)
```sql
-- 1. Instalar trigger de sincronização automática
-- 2. Corrigir todas as RLS policies problemáticas
-- 3. Atualizar triggers de checklist e voos
```

### **FASE 3: OTIMIZAÇÕES DE CÓDIGO** (2-3 horas)
```javascript
// 1. Atualizar hook useUser para usar auth_id
// 2. Corrigir hook usePermissions
// 3. Testar fluxo completo
```

### **FASE 4: VALIDAÇÃO E TESTES** (1 hora)
```sql
-- 1. Testar login de membros antigos
-- 2. Validar criação de voos e checklists
-- 3. Verificar permissões funcionando
```

---

## 🧪 COMANDOS DE DIAGNÓSTICO

### **Verificar Usuários Órfãos:**
```sql
-- Usuários em auth.users sem registro em public.users
SELECT COUNT(*) as orphaned_users
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.auth_id IS NULL;
```

### **Verificar Membros Sem user_id:**
```sql
-- Membros sem vinculação com usuário
SELECT COUNT(*) as members_without_user
FROM membros m
WHERE m.user_id IS NULL;
```

### **Testar Função de Permissões:**
```sql
-- Testar se permissões estão funcionando
SELECT * FROM get_user_combined_permissions('uuid-do-usuario');
```

### **Verificar RLS Ativo:**
```sql
-- Verificar quais tabelas têm RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
```

---

## ⚠️ RISCOS E MITIGAÇÕES

### **RISCOS IDENTIFICADOS:**
1. **Interrupção Temporária:** Correções podem afetar usuários logados
2. **Perda de Dados:** Mudanças em triggers podem causar inconsistências
3. **Performance:** Novos triggers podem impactar performance

### **MITIGAÇÕES:**
1. **Backup Completo** antes de qualquer mudança
2. **Testes em Ambiente Staging** primeiro
3. **Rollback Plan** documentado para cada mudança
4. **Monitoramento Ativo** durante implementação

---

## 📈 MÉTRICAS DE SUCESSO

### **Indicadores de Correção:**
- ✅ Zero usuários órfãos (auth.users sem public.users)
- ✅ Zero foreign key violations em checklist_itens
- ✅ 100% dos usuários carregando permissões corretamente
- ✅ Zero falhas de RLS policies
- ✅ Membros antigos conseguem fazer login

### **Monitoramento Contínuo:**
```sql
-- Query para monitorar saúde do sistema
SELECT 
  'auth_users' as tabela, COUNT(*) as total FROM auth.users
UNION ALL
SELECT 
  'public_users' as tabela, COUNT(*) as total FROM public.users
UNION ALL
SELECT 
  'membros' as tabela, COUNT(*) as total FROM membros
UNION ALL
SELECT 
  'orphaned_users' as tabela, 
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.users pu ON pu.auth_id = au.id WHERE pu.auth_id IS NULL) as total;
```

---

## 🔄 PROCEDIMENTO DE ROLLBACK

Se algo der errado, execute em ordem:

```sql
-- 1. Desabilitar novos triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Restaurar políticas antigas
-- (manter backup das políticas atuais)

-- 3. Reverter mudanças em código
-- (usar git para voltar ao commit anterior)
```

---

**⚠️ PRÓXIMOS PASSOS:** Implementar Fase 1 imediatamente para estabilizar o sistema, depois prosseguir com as outras fases de forma controlada.

**📞 SUPORTE:** Este documento deve ser seguido em ordem. Cada mudança deve ser testada antes de prosseguir para a próxima.

---

**Última atualização:** 31/07/2025 por Claude Code  
**Status:** Aguardando aprovação para implementação