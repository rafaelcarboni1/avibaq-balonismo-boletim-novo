"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function MinhaContaForm() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ nome: "", telefone: "" });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenha2, setNovaSenha2] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      // tenta buscar em users_profiles
      const { data } = await supabase
        .from("users_profiles")
        .select("nome, telefone")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
      else if (user.user_metadata) {
        setProfile({
          nome: user.user_metadata.nome ?? "",
          telefone: user.user_metadata.telefone ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  async function saveProfile() {
    setLoading(true);
    // update table se existir
    await supabase
      .from("users_profiles")
      .upsert({ id: user.id, ...profile });
    // update metadata
    await supabase.auth.updateUser({ data: profile });
    // update tabela users para sincronizar nome/telefone
    await supabase.from("users").update({ nome: profile.nome, telefone: profile.telefone }).eq("id", user.id);
    toast.success("Perfil salvo!");
    setLoading(false);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setAvatarUploading(true);
    const file = e.target.files[0];
    const path = `avatars/${user.id}.png`;
    await supabase.storage
      .from("public-assets")
      .upload(path, file, { upsert: true });
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("public-assets")
      .getPublicUrl(path);
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    toast.success("Avatar atualizado");
    setAvatarUploading(false);
  }

  async function changePassword() {
    if (!novaSenha || novaSenha !== novaSenha2) {
      toast.error("As senhas não coincidem");
      return;
    }
    await supabase.auth.updateUser({ password: novaSenha });
    toast.success("Senha alterada — faça login novamente");
    location.href = "/login";
  }

  async function logoutAll() {
    await supabase.auth.signOut({ scope: "global" });
    location.href = "/login";
  }

  if (loading) return <p className="text-center py-10">Carregando…</p>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg ring-1 ring-black/5 px-8 py-10 space-y-8">
      <h2 className="text-2xl font-semibold">Minha Conta</h2>

      {/* PERFIL */}
      <section className="space-y-4">
        <label className="block">
          <span className="text-sm text-gray-600">Nome completo</span>
          <input
            className="input"
            value={profile.nome}
            onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Telefone</span>
          <input
            className="input"
            value={profile.telefone}
            onChange={(e) =>
              setProfile({ ...profile, telefone: e.target.value })
            }
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">E-mail</span>
          <input className="input bg-gray-100" disabled value={user.email} />
        </label>
        <button className="btn-primary" onClick={saveProfile} disabled={loading}>
          Salvar
        </button>
      </section>

      {/* AVATAR */}
      <section className="space-y-2">
        <p className="text-sm text-gray-600">Avatar</p>
        <img
          src={user.user_metadata?.avatar_url ?? "/avatar-placeholder.png"}
          className="h-20 w-20 rounded-full ring-1 ring-black/5"
        />
        <input
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={avatarUploading}
        />
      </section>

      {/* SEGURANÇA */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Segurança</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            className="input"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
          />
          <input
            type="password"
            className="input"
            placeholder="Confirmar nova senha"
            value={novaSenha2}
            onChange={e => setNovaSenha2(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={changePassword}>
          Alterar senha
        </button>

        <button className="btn-secondary mt-4" onClick={logoutAll}>
          Sair de todos os dispositivos
        </button>
      </section>
    </div>
  );
} 