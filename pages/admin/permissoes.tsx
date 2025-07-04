import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { useUser } from "@/hooks/useUser";

export default function PermissoesAdmin() {
  const { role } = useUser();
  const [permissoes, setPermissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    fetchPermissoes();
  }, []);

  async function fetchPermissoes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("permissoes")
      .select("id, role, recurso, acao, permitido")
      .order("role", { ascending: true })
      .order("recurso", { ascending: true })
      .order("acao", { ascending: true });
    if (!error && data) {
      setPermissoes(data);
      // Seleciona a primeira role por padrão
      if (!selectedRole && data.length > 0) {
        setSelectedRole(data[0].role);
      }
    }
    setLoading(false);
    setDirty(false);
  }

  // Agrupar por role > recurso > ação
  const roles = Array.from(new Set(permissoes.map(p => p.role)));
  const recursos = Array.from(new Set(permissoes.map(p => p.recurso)));
  const acoes = Array.from(new Set(permissoes.map(p => p.acao)));

  // Permissões filtradas pela role selecionada
  const permissoesDaRole = permissoes.filter(p => p.role === selectedRole);

  // Montar matriz: recurso x ação para a role selecionada
  function getPermissao(recurso: string, acao: string) {
    return permissoesDaRole.find(p => p.recurso === recurso && p.acao === acao);
  }

  function handleTogglePermissao(id: string, novoValor: boolean) {
    setPermissoes(permissoes => permissoes.map(p => p.id === id ? { ...p, permitido: novoValor } : p));
    setDirty(true);
  }

  async function handleSalvar() {
    setSaving(true);
    let erro = false;
    for (const perm of permissoes) {
      const { error } = await supabase.from("permissoes").update({ permitido: perm.permitido, atualizado_em: new Date().toISOString() }).eq("id", perm.id);
      if (error) erro = true;
    }
    setSaving(false);
    setDirty(false);
    if (erro) {
      toast.error("Erro ao salvar permissões!");
    } else {
      toast.success("Permissões salvas com sucesso!");
      fetchPermissoes();
    }
  }

  if (role !== 'admin') {
    return <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">Acesso restrito a administradores.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Permissões do Sistema">
        <div className="max-w-4xl mx-auto mt-8">
          <h1 className="text-2xl font-bold mb-6">Permissões do Sistema</h1>
          {loading ? (
            <div className="text-center py-8">Carregando permissões...</div>
          ) : (
            <>
              {/* Navegação por roles */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {roles.map(r => (
                  <Button
                    key={r}
                    variant={selectedRole === r ? "default" : "outline"}
                    onClick={() => setSelectedRole(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
              {/* Tabela de permissões da role selecionada */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left">Recurso</th>
                      {acoes.map(acao => (
                        <th key={acao} className="px-3 py-2 text-center">{acao}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recursos.map(recurso => (
                      <tr key={recurso} className="border-b">
                        <td className="px-3 py-2 font-mono text-xs">{recurso}</td>
                        {acoes.map(acao => {
                          const perm = getPermissao(recurso, acao);
                          return (
                            <td key={acao} className="px-3 py-2 text-center">
                              {perm ? (
                                <input
                                  type="checkbox"
                                  checked={!!perm.permitido}
                                  onChange={e => handleTogglePermissao(perm.id, e.target.checked)}
                                />
                              ) : (
                                <input type="checkbox" disabled />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="mt-8 flex gap-4 items-center">
            <Button onClick={handleSalvar} disabled={!dirty || saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
            {dirty && <span className="text-yellow-600 text-sm">Há alterações não salvas</span>}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 