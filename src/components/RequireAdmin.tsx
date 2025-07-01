import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) {
        navigate("/admin/login");
        return;
      }
      const { data: adminData } = await supabase
        .from("usuarios_admin")
        .select("email")
        .eq("email", email)
        .single();
      if (!adminData) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }
      setAuthorized(true);
      setLoading(false);
    };
    checkAdmin();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  if (!authorized) {
    return null;
  }
  return <>{children}</>;
} 