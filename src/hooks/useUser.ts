import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";

/**
 * Hook useUser VERSÃO SEGURA
 * 
 * MUDANÇAS MÍNIMAS PARA NÃO QUEBRAR SISTEMA ATUAL:
 * 1. Mantém busca por email como principal (compatibilidade)
 * 2. Adiciona busca por auth_id como otimização
 * 3. NÃO muda estrutura do retorno
 * 4. NÃO afeta fluxo de cadastro
 * 5. Logs melhorados para debug
 */

export function useUser() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      console.log('[useUser] Iniciando busca de usuário...');
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useUser] Auth user:', user?.email);
      
      if (user) {
        setUser(user);
        
        let data = null;
        let error = null;
        
        // OTIMIZAÇÃO SEGURA: Tentar por auth_id primeiro (se função existir)
        try {
          console.log('[useUser] Tentando busca otimizada por auth_id:', user.id);
          const result = await supabase.rpc('get_user_by_auth_id', { p_auth_id: user.id });
          if (result.data && result.data.length > 0 && !result.error) {
            data = result.data[0];
            console.log('[useUser] ✅ Busca por auth_id funcionou');
          } else {
            console.log('[useUser] Busca por auth_id não retornou dados, usando fallback');
          }
        } catch (rpcError) {
          console.log('[useUser] Função RPC não disponível, usando método tradicional');
        }
        
        // MÉTODO TRADICIONAL: Buscar por email (mantém compatibilidade)
        if (!data) {
          console.log('[useUser] Usando busca tradicional por email:', user.email);
          const result = await supabase
            .from("users")
            .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown")
            .match({ email: user.email })
            .single();
          
          data = result.data;
          error = result.error;
        }
        
        if (data && !error) {
          console.log('[useUser] ✅ Usuário encontrado:', { email: user.email, role: data.role });
          
          setRole(data.role);
          setNome(data.nome || "");
          
          // MANTÉM ESTRUTURA ORIGINAL (não quebra código existente)
          const userWithUsersData = { 
            ...user, 
            id: user.id, // ID original do auth.users para RLS
            auth_id: user.id, // Para referência
            users_table_id: data.id, // ID da tabela users
            role: data.role,
            whatsapp_group_joined: data.whatsapp_group_joined,
            whatsapp_modal_shown: data.whatsapp_modal_shown
          };
          
          console.log('[useUser] ✅ Dados integrados - auth ID:', user.id, 'users table ID:', data.id);
          console.log('[useUser] 🔍 CRITICAL DEBUG - users_table_id:', userWithUsersData.users_table_id);
          console.log('[useUser] 🔍 CRITICAL DEBUG - userWithUsersData completo:', JSON.stringify(userWithUsersData, null, 2));
          setUser(userWithUsersData);
          
        } else {
          console.warn('[useUser] ⚠️ Usuário não encontrado na tabela users:', user.email);
          console.warn('[useUser] Error:', error);
          console.warn('[useUser] 🚨 CRITICAL: Este usuário CAUSARÁ erro de foreign key!');
          console.warn('[useUser] 🚨 Auth ID:', user.id, 'não existe em public.users');
          
          // COMPORTAMENTO CONSERVADOR: Manter usuário com dados mínimos
          // (não quebra o sistema, apenas fica sem role)
          const userWithoutRole = {
            ...user,
            id: user.id,
            auth_id: user.id,
            users_table_id: null,  // ❌ ESTE NULL CAUSA O ERRO!
            role: null,
            whatsapp_group_joined: false,
            whatsapp_modal_shown: false
          };
          
          console.warn('[useUser] 🚨 DEFININDO users_table_id como NULL - ISSO CAUSARÁ ERRO!');
          setUser(userWithoutRole);
          setRole(null);
          setNome("");
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
  }, []);

  useEffect(() => {
    if (!initialized) {
      fetchUser();
    }
  }, [fetchUser, initialized]);

  // Listener para mudanças de auth - MANTIDO IGUAL
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useUser] Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setNome("");
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        fetchUser();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  // MANTÉM RETORNO IDÊNTICO (compatibilidade total)
  const userWithRole = useMemo(() => {
    return user ? { ...user, role } : null;
  }, [user, role]);

  return { user: userWithRole, role, nome, loading: loading || !initialized };
} 