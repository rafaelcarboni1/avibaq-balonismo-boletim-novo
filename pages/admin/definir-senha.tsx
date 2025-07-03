import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../src/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";

export default function AdminSetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado e tem sessão de redefinição
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Link inválido ou expirado. Solicite um novo link de redefinição.");
        return;
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError("Erro ao atualizar senha: " + error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (error: any) {
      setError("Erro inesperado: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold mb-2">Definir Nova Senha</h2>
          <p className="text-gray-600 text-sm">Digite sua nova senha de acesso</p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center">
              <div className="text-green-600 font-semibold mb-4">Senha atualizada com sucesso!</div>
              <p className="text-gray-600">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Nova Senha</label>
                <Input
                  type="password"
                  className="w-full"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Confirmar Senha</label>
                <Input
                  type="password"
                  className="w-full"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => router.push("/admin/login")}
              >
                Voltar ao Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 