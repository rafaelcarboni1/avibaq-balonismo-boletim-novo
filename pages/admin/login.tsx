import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    // Verifica se o e-mail está na tabela users com role permitida OU na usuarios_admin (legado)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("email", email)
      .single();
    const allowedRoles = ["admin", "meteo", "tesouraria"];
    if ((!userData || !allowedRoles.includes(userData.role))) {
      setError("Acesso negado: seu e-mail não está autorizado como administrador.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    setLoading(false);
    router.push("/admin/dashboard");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    if (!resetEmail) {
      setResetMsg("Digite seu e-mail para redefinir a senha.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: typeof window !== "undefined" ? window.location.origin + "/admin/definir-senha" : undefined
    });
    if (error) {
      setResetMsg("Erro ao enviar e-mail de redefinição: " + error.message);
    } else {
      setResetMsg("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold mb-2">Área Administrativa</h2>
          <p className="text-gray-600 text-sm mb-2">Acesso restrito a administradores</p>
        </CardHeader>
        <CardContent>
          {showReset ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">E-mail</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {resetMsg && <div className={resetMsg.startsWith("Erro") ? "text-red-600 text-sm" : "text-green-600 text-sm"}>{resetMsg}</div>}
              <Button type="submit" className="w-full">Enviar redefinição</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setShowReset(false)}>Voltar ao login</Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">E-mail</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Senha</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <Button type="button" variant="link" className="w-full mt-2" onClick={() => setShowReset(true)}>
                Esqueci minha senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 