import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import RequireAdmin from "@/components/RequireAdmin";

export default function AdminRegister() {
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!form.nome || !form.email || !form.senha) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    // 1. Cria usuário no Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha,
    });
    if (signUpError) {
      setError("Erro ao criar usuário: " + signUpError.message);
      setLoading(false);
      return;
    }
    // 2. Insere na tabela usuarios_admin
    const userId = data?.user?.id;
    if (!userId) {
      setError("Usuário criado, mas não foi possível obter o ID.");
      setLoading(false);
      return;
    }
    const { error: dbError } = await supabase.from("usuarios_admin").insert({
      id: userId,
      email: form.email,
      nome: form.nome,
      perfil: 'administrador',
      ativo: true,
      senha_hash: '' // não usada, login é pelo Auth
    });
    if (dbError) {
      setError("Usuário criado no Auth, mas erro ao salvar no banco: " + dbError.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setForm({ nome: "", email: "", senha: "" });
    setLoading(false);
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Cadastrar Novo Administrador</CardTitle>
            <p className="text-gray-600 text-sm">Preencha os dados abaixo para criar um novo admin</p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center text-green-600 font-semibold mb-4">Administrador cadastrado com sucesso!</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" name="nome" value={form.nome} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" name="senha" type="password" value={form.senha} onChange={handleChange} required />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar Admin"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAdmin>
  );
} 