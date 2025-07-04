"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function MinhaContaForm() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ nome: "", telefone: "" });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenha2, setNovaSenha2] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
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
    await supabase
      .from("users_profiles")
      .upsert({ id: user.id, ...profile });
    await supabase.auth.updateUser({ data: profile });
    await supabase.from("users").update({ nome: profile.nome, telefone: profile.telefone }).eq("id", user.id);
    toast.success("Perfil salvo!");
    setLoading(false);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setAvatarUploading(true);
    const file = e.target.files[0];
    const path = `avatars/${user.id}.png`;
    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Erro ao fazer upload do avatar: " + uploadError.message);
      setAvatarUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("public-assets")
      .getPublicUrl(path);
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setAvatarUrl(publicUrl);
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
    <div className="max-w-xl w-full px-4 mx-auto bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-2xl shadow-xl ring-1 ring-black/5 px-8 py-14 space-y-8 sm:space-y-10">
      <header className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Minha Conta</h1>
        <Link href="/admin/dashboard" className="btn-secondary flex items-center gap-2 !px-5 !py-2 text-base">
          <ArrowLeftIcon className="w-5 h-5" /> Voltar
        </Link>
      </header>
      <hr className="border-gray-100 mb-2" />

      {/* PERFIL */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Perfil</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <label className="block font-medium mb-1 text-gray-700">
            Nome completo
            <input
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              value={profile.nome}
              onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              placeholder="Digite seu nome completo"
              disabled={loading}
            />
          </label>
          <label className="block font-medium mb-1 text-gray-700">
            Telefone
            <input
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              value={profile.telefone}
              onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
              placeholder="(48) 99999-1234"
              disabled={loading}
            />
          </label>
          <label className="block font-medium mb-1 text-gray-700 col-span-full">
            E-mail
            <input className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 mt-1" disabled value={user.email} />
          </label>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={saveProfile}
            className="bg-primary text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-primary2 transition disabled:opacity-60 ml-auto"
            aria-label="Salvar perfil"
            disabled={loading}
          >
            Salvar
          </button>
        </div>
      </section>

      {/* SEGURANÇA */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Segurança</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
            placeholder="Confirmar nova senha"
            value={novaSenha2}
            onChange={e => setNovaSenha2(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={changePassword}
            className="bg-primary text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-primary2 transition disabled:opacity-60"
            aria-label="Alterar senha"
            disabled={loading}
          >
            Alterar senha
          </button>
          <button
            onClick={logoutAll}
            className="bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition disabled:opacity-60"
            aria-label="Sair de todos os dispositivos"
            disabled={loading}
          >
            Sair de todos os dispositivos
          </button>
        </div>
      </section>
    </div>
  );
} 