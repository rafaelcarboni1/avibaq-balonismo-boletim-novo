import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";

export function useUser() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useUser] user do supabase:', user);
      
      if (user) {
        setUser(user);
        // Busca o papel E O ID na tabela users
        const { data, error } = await supabase
          .from("users")
          .select("id, role, nome, whatsapp_group_joined, whatsapp_modal_shown")
          .match({ email: user.email })
          .single();
        console.log('[useUser] resultado da busca na tabela users:', data, error);
        if (data && !error) {
          setRole(data.role);
          setNome(data.nome || "");
          // CORREÇÃO: Manter ID original do auth e adicionar dados da tabela users
          const userWithUsersData = { 
            ...user, 
            // Manter o ID original do Supabase Auth para RLS policies
            id: user.id, // Mantém o ID original do auth para RLS
            auth_id: user.id, // Preserva o ID original para logs
            users_table_id: data.id, // ID da tabela users para referências
            role: data.role,
            whatsapp_group_joined: data.whatsapp_group_joined,
            whatsapp_modal_shown: data.whatsapp_modal_shown
          };
          console.log('[useUser] DADOS INTEGRADOS - auth ID:', user.id, 'users table ID:', data.id);
          console.log('[useUser] user final:', userWithUsersData);
          setUser(userWithUsersData);
        }
      } else {
        setUser(null);
        setRole(null);
        setNome("");
      }
    } catch (error) {
      console.error('[useUser] Erro ao buscar usuário:', error);
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

  // Retorna user com role anexado para compatibilidade - memoizado para evitar re-renders
  const userWithRole = useMemo(() => {
    return user ? { ...user, role } : null;
  }, [user, role]);

  return { user: userWithRole, role, nome, loading: loading || !initialized };
} 