import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("Erro ao definir senha: " + error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <h2 className="text-2xl font-bold mb-2">Definir Nova Senha</h2>
          <p className="text-gray-600 text-sm mb-2">Crie sua senha de acesso à área administrativa</p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center">
              <p className="text-green-600 font-semibold mb-4">Senha definida com sucesso!</p>
              <p className="text-gray-700 mb-4">Agora você pode sair e fazer login normalmente com seu e-mail e a senha escolhida.</p>
              <Button onClick={async () => { await supabase.auth.signOut(); navigate("/admin/login"); }} className="w-full">Fazer Logout e Login</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Nova Senha</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Confirmar Senha</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Salvando..." : "Definir Senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 