import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import bcrypt from "bcryptjs";

export default function TrocarSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndUser();
  }, []);

  async function checkAuthAndUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      router.push("/admin/login");
      return;
    }

    // Buscar dados do usuário na tabela users
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", authUser.email)
      .single();

    if (error || !userData) {
      toast.error("Erro ao carregar dados do usuário");
      router.push("/admin/login");
      return;
    }

    setUser(userData);

    // Se não precisa trocar senha, redirecionar para dashboard
    if (!userData.primeira_senha) {
      router.push("/admin/dashboard");
    }
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar senha atual
      if (!user?.senha_hash) {
        toast.error("Erro: dados do usuário inválidos");
        setLoading(false);
        return;
      }

      const senhaAtualValida = await bcrypt.compare(senhaAtual, user.senha_hash);
      if (!senhaAtualValida) {
        toast.error("Senha atual incorreta");
        setLoading(false);
        return;
      }

      // Validar nova senha
      const { valid, errors } = validatePassword(novaSenha);
      if (!valid) {
        toast.error("Nova senha inválida: " + errors.join(", "));
        setLoading(false);
        return;
      }

      // Confirmar senhas
      if (novaSenha !== confirmarSenha) {
        toast.error("As senhas não coincidem");
        setLoading(false);
        return;
      }

      // Verificar se nova senha é diferente da atual
      const mesmaSeha = await bcrypt.compare(novaSenha, user.senha_hash);
      if (mesmaSeha) {
        toast.error("A nova senha deve ser diferente da senha atual");
        setLoading(false);
        return;
      }

      // Hash da nova senha
      const novaSenhaHash = await bcrypt.hash(novaSenha, 12);

      // Atualizar senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (authError) {
        toast.error("Erro ao atualizar senha na autenticação: " + authError.message);
        setLoading(false);
        return;
      }

      // Atualizar na tabela users
      const { error: dbError } = await supabase
        .from("users")
        .update({ 
          senha_hash: novaSenhaHash,
          primeira_senha: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (dbError) {
        toast.error("Erro ao atualizar dados do usuário: " + dbError.message);
        setLoading(false);
        return;
      }

      toast.success("Senha alterada com sucesso! Redirecionando...");
      
      // Redirecionar para dashboard após 2 segundos
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 2000);

    } catch (err) {
      toast.error("Erro interno: " + (err as Error).message);
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold mb-2">🔐 Trocar Senha</h2>
          <p className="text-gray-600 text-sm mb-2">
            Olá, <strong>{user.nome}</strong>!
          </p>
          <p className="text-orange-600 text-sm">
            Por segurança, você deve alterar sua senha temporária antes de continuar.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Senha Atual</label>
              <Input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                required
                autoFocus
                placeholder="Digite sua senha temporária"
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Nova Senha</label>
              <Input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                required
                placeholder="Mín. 8 chars, maiúsc., minúsc., núm., símbolo"
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Confirmar Nova Senha</label>
              <Input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                required
                placeholder="Digite a nova senha novamente"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}