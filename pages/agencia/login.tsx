import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import Link from "next/link";

export default function AgenciaLogin() {
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
    
    // Verifica se o e-mail está na tabela users com role agencia
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, primeira_senha")
      .eq("email", email)
      .single();
    
    if (!userData || userData.role !== "agencia") {
      setError("Acesso negado: esta área é restrita para agências.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    
    setLoading(false);
    
    // Se é primeira senha (temporária), redirecionar para troca de senha
    if (userData.primeira_senha) {
      router.push("/agencia/trocar-senha");
    } else {
      router.push("/agencia/dashboard");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    
    if (!resetEmail) {
      setResetMsg("Digite seu e-mail para redefinir a senha.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/agencia/nova-senha`,
    });

    if (error) {
      setResetMsg("Erro ao enviar e-mail de redefinição.");
    } else {
      setResetMsg("E-mail de redefinição enviado com sucesso!");
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
          <h2 className="text-xl font-semibold">Login Agência</h2>
          <p className="text-gray-600 text-sm">Acesse sua área restrita</p>
        </CardHeader>
        
        <CardContent>
          {!showReset ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="agencia@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  placeholder="Sua senha"
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          ) : (
            <div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium mb-1">
                    E-mail para redefinição
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    placeholder="agencia@email.com"
                  />
                </div>
                
                {resetMsg && (
                  <div className={`px-4 py-3 rounded-lg text-sm ${
                    resetMsg.includes("sucesso") 
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}>
                    {resetMsg}
                  </div>
                )}
                
                <Button type="submit" className="w-full">
                  Enviar e-mail de redefinição
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Voltar ao login
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-600">
              É um piloto? 
              <Link href="/piloto/login" className="text-blue-600 hover:underline ml-1">
                Clique aqui
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <Link href="/" className="text-blue-600 hover:underline">
                Voltar para a home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}