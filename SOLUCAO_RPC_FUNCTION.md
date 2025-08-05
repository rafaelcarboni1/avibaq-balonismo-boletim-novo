# Solução: Correção da Função RPC get_current_user_table_id

## Problema Identificado

A função RPC `get_current_user_table_id()` estava retornando `null` mesmo para usuários válidos, causando erros de foreign key constraint no sistema de checklist.

### Causa Raiz

A implementação original da função tinha uma lógica inadequada:

```sql
-- VERSÃO PROBLEMÁTICA
CREATE OR REPLACE FUNCTION get_current_user_table_id()
RETURNS UUID AS $$
DECLARE
    user_email TEXT;
    user_table_id UUID;
BEGIN
    -- Obter email do usuário autenticado
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar ID na tabela users
    SELECT id INTO user_table_id FROM users WHERE email = user_email;
    
    RETURN user_table_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Problemas:**
1. `auth.uid()` retorna `null` quando executado com service role
2. Busca ineficiente por email ao invés de usar `auth_id` diretamente
3. Não havia sincronização automática de `auth_id`

## Solução Implementada

### 1. Função RPC Corrigida

```sql
CREATE OR REPLACE FUNCTION get_current_user_table_id()
RETURNS UUID AS $$
DECLARE
    current_auth_id UUID;
    user_table_id UUID;
    user_email TEXT;
BEGIN
    -- Obter auth.uid() do usuário autenticado
    current_auth_id := auth.uid();
    
    -- Se não há usuário autenticado, retornar null
    IF current_auth_id IS NULL THEN
        RAISE LOG 'get_current_user_table_id: auth.uid() retornou NULL';
        RETURN NULL;
    END IF;
    
    -- Buscar diretamente por auth_id na tabela users
    SELECT id INTO user_table_id 
    FROM users 
    WHERE auth_id = current_auth_id;
    
    -- Se encontrou por auth_id, retornar
    IF user_table_id IS NOT NULL THEN
        RAISE LOG 'get_current_user_table_id: Usuário encontrado por auth_id: % -> %', current_auth_id, user_table_id;
        RETURN user_table_id;
    END IF;
    
    -- FALLBACK: Se não encontrou por auth_id, tentar por email
    -- (para casos onde auth_id ainda não foi sincronizado)
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = current_auth_id;
    
    IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id 
        FROM users 
        WHERE email = user_email;
        
        IF user_table_id IS NOT NULL THEN
            RAISE LOG 'get_current_user_table_id: Usuário encontrado por email fallback: % -> %', user_email, user_table_id;
            
            -- IMPORTANTE: Atualizar auth_id para sincronizar
            UPDATE users 
            SET auth_id = current_auth_id,
                updated_at = NOW()
            WHERE id = user_table_id;
            
            RAISE LOG 'get_current_user_table_id: auth_id sincronizado para usuário %', user_table_id;
            
            RETURN user_table_id;
        ELSE
            RAISE LOG 'get_current_user_table_id: Email % não encontrado na tabela users', user_email;
        END IF;
    ELSE
        RAISE LOG 'get_current_user_table_id: Email não encontrado para auth_id %', current_auth_id;
    END IF;
    
    -- Se chegou até aqui, usuário não foi encontrado
    RAISE LOG 'get_current_user_table_id: Usuário não encontrado para auth_id %', current_auth_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Função de Debug

Criada função auxiliar para debug:

```sql
CREATE OR REPLACE FUNCTION debug_get_current_user_table_id()
RETURNS JSON AS $$
DECLARE
    current_auth_id UUID;
    user_table_id UUID;
    user_email TEXT;
    result JSON;
BEGIN
    current_auth_id := auth.uid();
    
    -- Buscar por auth_id
    SELECT id INTO user_table_id FROM users WHERE auth_id = current_auth_id;
    
    -- Buscar email do auth
    SELECT email INTO user_email FROM auth.users WHERE id = current_auth_id;
    
    -- Montar resultado de debug
    result := json_build_object(
        'auth_uid', current_auth_id,
        'auth_email', user_email,
        'found_by_auth_id', user_table_id,
        'users_with_auth_id_count', (SELECT COUNT(*) FROM users WHERE auth_id IS NOT NULL),
        'users_total_count', (SELECT COUNT(*) FROM users)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Melhorias Implementadas

### 1. Busca Otimizada
- **Antes:** Busca por email (ineficiente)
- **Depois:** Busca direta por `auth_id` (eficiente)

### 2. Sincronização Automática
- Quando um usuário é encontrado por email mas não tem `auth_id`, a função automaticamente sincroniza o `auth_id`
- Isso garante que futuras consultas sejam mais rápidas

### 3. Logs Detalhados
- Logs para debug em cada etapa da função
- Facilita identificação de problemas futuros

### 4. Fallback Robusto
- Se `auth_id` não funcionar, tenta por email
- Garante compatibilidade com usuários antigos

## Resultados dos Testes

### Teste Sem Autenticação
```
auth_uid: null,
auth_email: null,
found_by_auth_id: null
```
**Resultado:** `null` (esperado)

### Teste Com Autenticação
```
auth_uid: 'fd9943de-4dcd-449d-812b-5180e8855643',
auth_email: