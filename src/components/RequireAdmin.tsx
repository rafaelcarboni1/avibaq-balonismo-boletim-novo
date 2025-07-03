import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) {
        router.push("/admin/login");
        return;
      }
      const { data: adminData } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();
      if (!adminData) {
        await supabase.auth.signOut();
        router.push("/admin/login");
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