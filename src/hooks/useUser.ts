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
          .select("id, role, nome")
          .match({ email: user.email })
          .single();
        console.log('[useUser] resultado da busca na tabela users:', data, error);
        if (data && !error) {
          setRole(data.role);
          setNome(data.nome || "");
          // IMPORTANTE: Substituir o ID do auth pelo ID da tabela users
          const userWithCorrectId = { ...user, id: data.id };
          console.log('[useUser] ID CORRIGIDO - auth ID:', user.id, '-> users table ID:', data.id);
          console.log('[useUser] user final:', userWithCorrectId);
          setUser(userWithCorrectId);
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