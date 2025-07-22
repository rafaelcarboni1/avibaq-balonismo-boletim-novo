import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../src/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { toast } from "react-hot-toast";
import { useUser } from "../../src/hooks/useUser";

export default function PilotoTrocarSenha() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "piloto")) {
      router.push("/piloto/login");
    }
  }, [user, userLoading, router]);

  function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) errors.push("Pelo menos 1 letra maiúscula");
    if (!/[a-z]/.test(password)) errors.push("Pelo menos 1 letra minúscula");
    if (!/[0-9]/.test(password)) errors.push("Pelo menos 1 número");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Pelo menos 1 símbolo");
    return { valid: errors.length === 0, errors };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { valid, errors } = validatePassword(password);
    if (!valid) {
      setError("Senha inválida: " + errors.join(", "));
      return;
    }
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    
    try {
      // Se é primeira senha, não precisa validar a atual
      if (user?.primeira_senha) {
        const { error: authError } = await supabase.auth.updateUser({
          password: password
        });

        if (authError) {
          setError("Erro ao atualizar senha: " + authError.message);
          setLoading(false);
          return;
        }
      } else {
        // Validar senha atual primeiro
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email || "",
          password: currentPassword
        });

        if (signInError) {
          setError("Senha atual incorreta.");
          setLoading(false);
          return;
        }

        const { error: authError } = await supabase.auth.updateUser({
          password: password
        });

        if (authError) {
          setError("Erro ao atualizar senha: " + authError.message);
          setLoading(false);
          return;
        }
      }

      toast.success("Senha alterada com sucesso!");
      setSuccess(true);
      setTimeout(() => {
        router.push("/piloto/dashboard");
      }, 2000);

    } catch (error: any) {
      setError("Erro inesperado: " + error.message);
      setLoading(false);
    }
  };

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png" 
              alt="Logo AVIBAQ" 
              className="w-12 h-12 rounded-full object-cover bg-white"
            />
            <h1 className="text-2xl font-bold text-primary">AVIBAQ</h1>
          </div>
          <h2 className="text-xl font-bold mb-2">
            {user?.primeira_senha ? "Definir Primeira Senha" : "Alterar Senha"}
          </h2>
          <p className="text-gray-600 text-sm">
            {user?.primeira_senha ? "Defina sua senha pessoal" : "Digite sua nova senha de acesso"}
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center">
              <div className="text-green-600 font-semibold mb-4">Senha alterada com sucesso!</div>
              <p className="text-gray-600">Redirecionando para o dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!user?.primeira_senha && (
                <div>
                  <label className="block mb-1 font-medium">Senha Atual</label>
                  <Input
                    type="password"
                    className="w-full"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Digite sua senha atual"
                  />
                </div>
              )}
              <div>
                <label className="block mb-1 font-medium">Nova Senha</label>
                <Input
                  type="password"
                  className="w-full"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoFocus={!!user?.primeira_senha}
                  placeholder="Mín. 8 chars, maiúsc., minúsc., núm., símbolo"
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
                  minLength={8}
                  placeholder="Digite a senha novamente"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                <strong>📋 Requisitos da senha:</strong>
                <ul className="mt-1 space-y-1 text-blue-800">
                  <li>• Mínimo 8 caracteres</li>
                  <li>• Pelo menos 1 maiúscula (A-Z)</li>
                  <li>• Pelo menos 1 minúscula (a-z)</li>
                  <li>• Pelo menos 1 número (0-9)</li>
                  <li>• Pelo menos 1 símbolo (!@#$%...)</li>
                </ul>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Alterando..." : "Alterar Senha"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => router.push(user?.primeira_senha ? "/piloto/login" : "/piloto/dashboard")}
              >
                {user?.primeira_senha ? "Voltar ao Login" : "Cancelar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}