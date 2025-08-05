import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";

/**
 * Hook useUser VERSÃO ROBUSTA
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * 1. Usa função RPC get_current_user_table_id() para obter ID válido
 * 2. Fallback para busca por email se RPC falhar
 * 3. Validação rigorosa de users_table_id antes de retornar
 * 4. Logs detalhados para debug
 * 5. Tratamento de erro robusto
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
        
        let userData = null;
        let usersTableId = null;
        
        // MÉTODO 1: Usar função RPC para obter users_table_id
        try {
          console.log('[useUser] Tentando obter users_table_id via RPC...');
          const { data: rpcResult, error: rpcError } = await supabase
            .rpc('get_current_user_table_id');
          
          if (rpcResult && !rpcError) {
            usersTableId = rpcResult;
            console.log('[useUser] ✅ RPC retornou users_table_id:', usersTableId);
            
            // Buscar dados completos do usuário
            const { data: userResult, error: userError } = await supabase
              .from("users")
              .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown, email")
              .eq('id', usersTableId)
              .single();
            
            if (userResult && !userError) {
              userData = userResult;
              console.log('[useUser] ✅ Dados do usuário obtidos via RPC');
            }
          } else {
            console.warn('[useUser] RPC falhou:', rpcError);
          }
        } catch (rpcError) {
          console.warn('[useUser] Erro na RPC:', rpcError);
        }
        
        // MÉTODO 2: Fallback - buscar por email
        if (!userData || !usersTableId) {
          console.log('[useUser] Usando fallback - busca por email:', user.email);
          const { data: emailResult, error: emailError } = await supabase
            .from("users")
            .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown, email")
            .eq('email', user.email)
            .single();
          
          if (emailResult && !emailError) {
            userData = emailResult;
            usersTableId = emailResult.id;
            console.log('[useUser] ✅ Dados obtidos por email - users_table_id:', usersTableId);
          } else {
            console.error('[useUser] ❌ Falha na busca por email:', emailError);
          }
        }
        
        // VALIDAÇÃO FINAL
        if (userData && usersTableId) {
          // Validar se o users_table_id realmente existe na tabela users
          const { data: validationResult, error: validationError } = await supabase
            .from("users")
            .select("id")
            .eq('id', usersTableId)
            .single();
          
          if (validationResult && !validationError) {
            console.log('[useUser] ✅ users_table_id validado:', usersTableId);
            
            setRole(userData.role);
            setNome(userData.nome || "");
            
            // Estrutura final do usuário
            const userWithUsersData = { 
              ...user, 
              id: user.id, // ID original do auth.users para RLS
              auth_id: user.id, // Para referência
              users_table_id: usersTableId, // ID VALIDADO da tabela users
              role: userData.role,
              whatsapp_group_joined: userData.whatsapp_group_joined,
              whatsapp_modal_shown: userData.whatsapp_modal_shown
            };
            
            console.log('[useUser] ✅ Usuário configurado com sucesso');
            console.log('[useUser] 🔍 FINAL - users_table_id:', userWithUsersData.users_table_id);
            setUser(userWithUsersData);
            
          } else {
            console.error('[useUser] ❌ users_table_id inválido na validação:', usersTableId);
            throw new Error('users_table_id inválido');
          }
          
        } else {
          console.error('[useUser] ❌ Usuário não encontrado na tabela users:', user.email);
          console.error('[useUser] 🚨 CRITICAL: Este usuário CAUSARÁ erro de foreign key!');
          
          // NÃO DEFINIR users_table_id como null - isso causa o erro!
          // Em vez disso, lançar erro para forçar correção
          throw new Error('Usuário não encontrado na tabela users');
        }
      } else {
        console.log('[useUser] Nenhum usuário logado');
        setUser(null);
        setRole(null);
        setNome("");
      }
    } catch (error) {
      console.error('[useUser] Erro crítico:', error);
      
      // Em caso de erro, não definir usuário com users_table_id null
      // Isso força o usuário a fazer login novamente ou corrigir o problema
      setUser(null);
      setRole(null);
      setNome("");
      
      // Opcional: redirecionar para login ou mostrar erro
      console.error('[useUser] 🚨 Usuário será deslogado devido a erro crítico');
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

  // Listener para mudanças de auth
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

  // Retorno com validação adicional
  const userWithRole = useMemo(() => {
    if (user && user.users_table_id) {
      return { ...user, role };
    }
    return null; // Só retorna usuário se tiver users_table_id válido
  }, [user, role]);

  return { 
    user: userWithRole, 
    role, 
    nome, 
    loading: loading || !initialized,
    // Função auxiliar para debug
    debugInfo: {
      hasUser: !!user,
      hasUsersTableId: !!(user?.users_table_id),