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
    // Processar tokens de recovery da URL
    const handleAuthCallback = async () => {
      // Verificar se há hash fragments na URL (tokens do Supabase)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        // Estabelecer sessão com os tokens de recovery
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        if (error) {
          setError("Erro ao processar link de redefinição: " + error.message);
          return;
        }

        if (data.session?.user) {
          setUserEmail(data.session.user.email || "");
          // Limpar URL dos tokens por segurança
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }

      // Se não há tokens na URL, verificar sessão existente
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Link inválido ou expirado. Solicite um novo link de redefinição.");
        return;
      }
      setUserEmail(session.user?.email || "");
    };

    handleAuthCallback();
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
    console.log("🔧 [DEBUG] Iniciando redefinição de senha...");
    setError("");
    
    // Validar senha forte
    const { valid, errors } = validatePassword(password);
    if (!valid) {
      console.log("❌ [DEBUG] Senha inválida:", errors);
      setError("Senha inválida: " + errors.join(", "));
      return;
    }
    
    if (password !== confirmPassword) {
      console.log("❌ [DEBUG] Senhas não coincidem");
      setError("As senhas não coincidem.");
      return;
    }

    console.log("✅ [DEBUG] Validações passou, iniciando atualização...");
    setLoading(true);
    
    try {
      // Atualizar senha no Supabase Auth
      console.log("🔧 [DEBUG] Atualizando senha no Supabase Auth...");
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) {
        console.log("❌ [DEBUG] Erro no Supabase Auth:", authError);
        setError("Erro ao atualizar senha na autenticação: " + authError.message);
        setLoading(false);
        return;
      }

      console.log("✅ [DEBUG] Senha atualizada no Supabase Auth");

      // Hash da nova senha para salvar na tabela users
      console.log("🔧 [DEBUG] Gerando hash da nova senha...");
      const senhaHash = await bcrypt.hash(password, 12);

      // Atualizar senha na tabela users
      console.log("🔧 [DEBUG] Atualizando tabela users com email:", userEmail);
      const { error: dbError } = await supabase
        .from("users")
        .update({
          senha_hash: senhaHash,
          primeira_senha: false,
          updated_at: new Date().toISOString()
        })
        .eq("email", userEmail);

      if (dbError) {
        console.log("❌ [DEBUG] Erro na tabela users:", dbError);
        setError("Erro ao atualizar dados do usuário: " + dbError.message);
        setLoading(false);
        return;
      }

      console.log("✅ [DEBUG] Tabela users atualizada com sucesso");

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