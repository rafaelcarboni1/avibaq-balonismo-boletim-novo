import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../src/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
import { Input } from "../src/components/ui/input";
import { toast } from "react-hot-toast";

export default function RedefinirSenha() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔧 [DEBUG] Iniciando processamento de tokens de recovery');
      console.log('🔧 [DEBUG] URL completa:', window.location.href);
      console.log('🔧 [DEBUG] Hash da URL:', window.location.hash);
      
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      console.log('🔧 [DEBUG] Tokens extraídos:', {
        accessToken: accessToken ? 'presente' : 'ausente',
        refreshToken: refreshToken ? 'presente' : 'ausente',
        type: type
      });

      if (accessToken && type === 'recovery') {
        console.log('✅ [DEBUG] Tokens válidos encontrados, estabelecendo sessão...');
        
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        if (error) {
          console.log('❌ [DEBUG] Erro ao estabelecer sessão:', error);
          setError("Erro ao processar link de redefinição: " + error.message);
          return;
        }
        
        console.log('✅ [DEBUG] Sessão estabelecida com sucesso:', data.session?.user?.email);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.log('⚠️ [DEBUG] Tokens não encontrados, verificando sessão existente...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔧 [DEBUG] Sessão atual:', session ? 'ativa' : 'inativa');
        
        if (!session) {
          console.log('❌ [DEBUG] Nenhuma sessão encontrada');
          setError("Link inválido ou expirado. Solicite um novo link de redefinição.");
        }
      }
    };

    handleAuthCallback();
  }, []);

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
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      });

      if (authError) {
        setError("Erro ao atualizar senha: " + authError.message);
        setLoading(false);
        return;
      }

      console.log('✅ [DEBUG] Senha redefinida com sucesso');
      
      // Obter dados do usuário para determinar o redirecionamento correto
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔧 [DEBUG] Dados do usuário:', user?.email);
      
      // Buscar role do usuário para redirecionamento correto
      let redirectPath = '/admin/login'; // default
      
      if (user?.email) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', user.email)
          .single();
          
        console.log('🔧 [DEBUG] Role do usuário:', userData?.role);
        
        if (userData?.role === 'piloto') {
          redirectPath = '/piloto/login';
        } else if (userData?.role === 'agencia') {
          redirectPath = '/agencia/login';
        }
      }
      
      toast.success("Senha redefinida com sucesso!");
      setSuccess(true);
      setTimeout(() => {
        console.log('🔧 [DEBUG] Redirecionando para:', redirectPath);
        router.push(redirectPath);
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
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png" 
              alt="Logo AVIBAQ" 
              className="w-12 h-12 rounded-full object-cover bg-white"
            />
            <h1 className="text-2xl font-bold text-primary">AVIBAQ</h1>
          </div>
          <h2 className="text-xl font-bold mb-2">Redefinir Senha</h2>
          <p className="text-gray-600 text-sm">Digite sua nova senha de acesso</p>
          {/* Deploy test: hook URL working 2025-07-23 18:30 */}
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center">
              <div className="text-green-600 font-semibold mb-4">Senha redefinida com sucesso!</div>
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
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
              <div className="text-center space-y-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-sm" 
                  onClick={() => router.push("/admin/login")}
                >
                  Voltar ao Login Admin
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm"
                    className="flex-1" 
                    onClick={() => router.push("/piloto/login")}
                  >
                    Login Piloto
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm"
                    className="flex-1" 
                    onClick={() => router.push("/agencia/login")}
                  >
                    Login Agência
                  </Button>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}