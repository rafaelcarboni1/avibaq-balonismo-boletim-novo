import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../src/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { toast } from "react-hot-toast";
import bcrypt from "bcryptjs";

export default function AdminSetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Verificar se o usuário está autenticado e tem sessão de redefinição
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Link inválido ou expirado. Solicite um novo link de redefinição.");
        return;
      }
      setUserEmail(session.user?.email || "");
    };
    checkSession();
  }, []);

  // Função de validação de senha forte
  function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Mínimo 8 caracteres");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Pelo menos 1 letra maiúscula");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Pelo menos 1 letra minúscula");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Pelo menos 1 número");
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Pelo menos 1 símbolo (!@#$%^&*...)");
    }

    return { valid: errors.length === 0, errors };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validar senha forte
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
      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) {
        setError("Erro ao atualizar senha na autenticação: " + authError.message);
        setLoading(false);
        return;
      }

      // Hash da nova senha para salvar na tabela users
      const senhaHash = await bcrypt.hash(password, 12);

      // Atualizar senha na tabela users
      const { error: dbError } = await supabase
        .from("users")
        .update({
          senha_hash: senhaHash,
          primeira_senha: false,
          updated_at: new Date().toISOString()
        })
        .eq("email", userEmail);

      if (dbError) {
        setError("Erro ao atualizar dados do usuário: " + dbError.message);
        setLoading(false);
        return;
      }

      toast.success("Senha redefinida com sucesso!");
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
                  minLength={8}
                  autoFocus
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