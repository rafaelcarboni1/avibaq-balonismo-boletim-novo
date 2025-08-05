import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";

/**
 * Hook useUser VERSÃO ROBUSTA
 * 
 * IMPLEMENTAÇÃO SEGURA CONTRA FOREIGN KEY ERRORS:
 * 1. Usa função RPC get_current_user_table_id como método principal
 * 2. Validação rigorosa de IDs antes de definir users_table_id
 * 3. Não retorna users_table_id nulo (evita foreign key errors)
 * 4. Mantém compatibilidade com sistema existente
 * 5. Logs detalhados para debug
 */

export function useUser() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      console.log('[useUser] Iniciando busca robusta de usuário...');
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useUser] Auth user:', user?.email);
      
      if (user) {
        setUser(user);
        
        let data = null;
        let error = null;
        
        // MÉTODO PRINCIPAL: Usar função RPC robusta
        try {
          console.log('[useUser] Usando get_current_user_table_id...');
          const { data: userTableId, error: rpcError } = await supabase
            .rpc('get_current_user_table_id');
          
          if (!rpcError && userTableId) {
            console.log('[useUser] ✅ RPC retornou ID válido:', userTableId);
            
            // Buscar dados completos do usuário
            const result = await supabase
              .from("users")
              .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown")
              .eq('id', userTableId)
              .single();
            
            data = result.data;
            error = result.error;
            
            if (data) {
              console.log('[useUser] ✅ Dados completos obtidos via RPC');
            }
          } else {
            console.warn('[useUser] RPC não retornou ID válido:', rpcError);
          }
        } catch (rpcError) {
          console.warn('[useUser] Função RPC falhou, usando fallback:', rpcError);
        }
        
        // FALLBACK: Métodos tradicionais com validação
        if (!data) {
          console.log('[useUser] Usando métodos fallback...');
          
          // Tentar por auth_id primeiro
          try {
            const result = await supabase.rpc('get_user_by_auth_id', { p_auth_id: user.id });
            if (result.data && result.data.length > 0 && !result.error) {
              data = result.data[0];
              console.log('[useUser] ✅ Busca por auth_id funcionou');
            }
          } catch (authIdError) {
            console.log('[useUser] Busca por auth_id falhou:', authIdError);
          }
          
          // Se ainda não encontrou, tentar por email
          if (!data) {
            console.log('[useUser] Tentando busca por email:', user.email);
            const result = await supabase
              .from("users")
              .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown")
              .match({ email: user.email })
              .single();
            
            data = result.data;
            error = result.error;
          }
        }
        
        if (data && !error && data.id) {
          // VALIDAÇÃO RIGOROSA: Verificar se o ID realmente existe
          const { data: validationCheck } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.id)
            .single();
          
          if (validationCheck) {
            console.log('[useUser] ✅ Usuário validado:', { email: user.email, role: data.role, id: data.id });
            
            setRole(data.role);
            setNome(data.nome || "");
            
            // ESTRUTURA SEGURA com ID validado
            const userWithUsersData = { 
              ...user, 
              id: user.id, // ID original do auth.users para RLS
              auth_id: user.id, // Para referência
              users_table_id: data.id, // ID VALIDADO da tabela users
              role: data.role,
              whatsapp_group_joined: data.whatsapp_group_joined,
              whatsapp_modal_shown: data.whatsapp_modal_shown
            };
            
            console.log('[useUser] ✅ Dados seguros integrados - users_table_id:', data.id);
            setUser(userWithUsersData);
          } else {
            console.error('[useUser] 🚨 ERRO CRÍTICO: ID não passou na validação!');
            // NÃO definir usuário com users_table_id inválido
            setUser(null);
            setRole(null);
            setNome("");
          }
        } else {
          console.warn('[useUser] ⚠️ Usuário não encontrado na tabela users:', user.email);
          console.warn('[useUser] 🛡️ SEGURANÇA: Não definindo users_table_id para evitar foreign key errors');
          
          // SEGURANÇA: Não retornar usuário sem users_table_id válido
          // Isso evita foreign key errors em operações subsequentes
          setUser(null);
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