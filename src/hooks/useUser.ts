import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useUser] user do supabase:', user);
      if (user) {
        setUser(user);
        // Busca o papel na tabela users
        const { data, error } = await supabase
          .from("users")
          .select("role, nome")
          .match({ email: user.email })
          .single();
        console.log('[useUser] resultado da busca na tabela users:', data, error);
        if (data) {
          setRole(data.role);
          setNome(data.nome || "");
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    console.log('[useUser] Estado final:', { user, role, nome, loading });
  }, [user, role, nome, loading]);

  return { user, role, nome, loading };
} 