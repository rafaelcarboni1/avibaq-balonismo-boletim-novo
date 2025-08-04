import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";

/**
 * Hook useUser CORRIGIDO
 * 
 * MUDANÇAS PRINCIPAIS:
 * 1. Busca usuário por auth_id em vez de email (mais confiável)
 * 2. Fallback por email se auth_id falhar (compatibilidade)
 * 3. Tratamento de usuários órfãos
 * 4. Logs melhorados para debug
 * 5. Retry automático para usuários recém-criados
 */

export function useUser() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchUser = useCallback(async (isRetry = false) => {
    try {
      console.log(`[useUser] Iniciando busca${isRetry ? ' (retry)' : ''}...`);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useUser] Auth user:', user?.email);
      
      if (user) {
        setUser(user);
        
        // CORREÇÃO PRINCIPAL: Buscar por auth_id primeiro
        let data = null;
        let error = null;
        
        // Método 1: Buscar por auth_id (mais confiável)
        console.log('[useUser] Buscando por auth_id:', user.id);
        const result1 = await supabase
          .from("users")
          .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown, email")
          .eq('auth_id', user.id)
          .single();
        
        data = result1.data;
        error = result1.error;
        
        // Método 2: Fallback por email se auth_id não funcionar
        if (!data && error) {
          console.log('[useUser] Fallback: buscando por email:', user.email);
          const result2 = await supabase
            .from("users")
            .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown, email")
            .eq('email', user.email)
            .single();
          
          data = result2.data;
          error = result2.error;
          
          // Se encontrou por email mas não tem auth_id, corrigir
          if (data && !error) {
            console.log('[useUser] Corrigindo auth_id para usuário:', user.email);
            await supabase
              .from("users")
              .update({ auth_id: user.id })
              .eq('id', data.id);
          }
        }
        
        if (data && !error) {
          console.log('[useUser] Usuário encontrado:', data);
          setRole(data.role);
          setNome(data.nome || "");
          
          // CORREÇÃO: Manter ID original do auth e adicionar dados da tabela users
          const userWithUsersData = { 
            ...user, 
            id: user.id, // ID original do auth.users para RLS
            auth_id: user.id, // Preserva para logs
            users_table_id: data.id, // ID da tabela users para foreign keys
            role: data.role,
            nome: data.nome,
            whatsapp_group_joined: data.whatsapp_group_joined,
            whatsapp_modal_shown: data.whatsapp_modal_shown
          };
          
          console.log('[useUser] SUCESSO - auth ID:', user.id, 'users table ID:', data.id, 'role:', data.role);
          setUser(userWithUsersData);
          
        } else {
          // Usuário órfão detectado
          console.warn('[useUser] ⚠️ USUÁRIO ÓRFÃO DETECTADO:', user.email);
          console.warn('[useUser] Error:', error);
          
          // Se não é retry e não encontrou usuário, tentar algumas vezes
          if (!isRetry && retryCount < 3) {
            console.log('[useUser] Tentando novamente em 2 segundos... (tentativa', retryCount + 1, 'de 3)');
            setRetryCount(prev => prev + 1);
            setTimeout(() => fetchUser(true), 2000);
            return; // Não continuar com o processamento
          } else {
            // Após várias tentativas, criar usuário com dados mínimos
            console.error('[useUser] ERRO CRÍTICO: Usuário não encontrado após múltiplas tentativas');
            
            // Usuário sem dados completos - mantém funcionando com limitações
            const userWithoutCompleteData = {
              ...user,
              id: user.id,
              auth_id: user.id,
              users_table_id: null, // Indica que não tem registro na tabela users
              role: null,
              nome: "",
              whatsapp_group_joined: false,
              whatsapp_modal_shown: false,
              _isOrphaned: true // Flag para indicar usuário órfão
            };
            
            setUser(userWithoutCompleteData);
            setRole(null);
            setNome("");
          }
        }
      } else {
        console.log('[useUser] Nenhum usuário logado');
        setUser(null);
        setRole(null);
        setNome("");
      }
    } catch (error) {
      console.error('[useUser] Erro crítico:', error);
      setUser(null);
      setRole(null);
      setNome("");
    } finally {
      setLoading(false);
      setInitialized(true);
      console.log('[useUser] Estado final configurado');
    }
  }, [retryCount]);

  useEffect(() => {
    if (!initialized) {
      fetchUser();
    }
  }, [fetchUser, initialized]);

  // Listener para mudanças de auth - MELHORADO
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useUser] Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setNome("");
        setLoading(false);
        setRetryCount(0); // Reset retry count
      } else if (event === 'SIGNED_IN' && session?.user) {
        setRetryCount(0); // Reset retry count para novo login
        fetchUser();
      } else if (event === 'TOKEN_REFRESHED') {
        // Não refazer fetch completo no refresh de token
        console.log('[useUser] Token refreshed, mantendo dados atuais');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  // Retorna user com role anexado para compatibilidade - memoizado para evitar re-renders
  const userWithRole = useMemo(() => {
    if (!user) return null;
    
    const finalUser = { ...user, role };
    
    // Adicionar métodos utilitários
    finalUser.isAdmin = () => role === 'admin' || role === 'meteo' || role === 'tesouraria';
    finalUser.isPilot = () => role === 'piloto';
    finalUser.isAgency = () => role === 'agencia';
    finalUser.isOrphaned = () => finalUser._isOrphaned === true;
    finalUser.hasCompleteProfile = () => !!finalUser.users_table_id;
    
    return finalUser;
  }, [user, role]);

  // Função para tentar corrigir usuário órfão manualmente
  const fixOrphanedUser = useCallback(async () => {
    if (!user || !user._isOrphaned) return false;
    
    try {
      console.log('[useUser] Tentando corrigir usuário órfão:', user.email);
      
      // Tentar criar registro na tabela users
      const { data, error } = await supabase
        .from('users')
        .insert({
          auth_id: user.id,
          email: user.email,
          nome: user.email?.split('@')[0] || '',
          role: 'piloto',
          ativo: true
        })
        .select()
        .single();
      
      if (data && !error) {
        console.log('[useUser] ✅ Usuário órfão corrigido com sucesso');
        await fetchUser(); // Refazer fetch para atualizar dados
        return true;
      } else {
        console.error('[useUser] Erro ao corrigir usuário órfão:', error);
        return false;
      }
    } catch (error) {
      console.error('[useUser] Erro ao corrigir usuário órfão:', error);
      return false;
    }
  }, [user, fetchUser]);

  return { 
    user: userWithRole, 
    role, 
    nome, 
    loading: loading || !initialized,
    fixOrphanedUser // Função para corrigir usuários órfãos
  };
}