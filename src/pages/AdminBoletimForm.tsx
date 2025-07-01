import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const bandeiraToStatus = {
  verde: "VOO LIBERADO",
  amarela: "EM AVALIAÇÃO",
  vermelha: "VOO CANCELADO",
};

const bandeiraToStatusVoo = {
  verde: "liberado" as const,
  amarela: "em_avaliacao" as const,
  vermelha: "cancelado" as const,
};

// Helper para garantir o valor correto do enum no banco
export const toDbPeriodo = (value: string) =>
  value.trim().toLowerCase().normalize("NFD").replace(/\u0300|\u0301|\u0302|\u0303|\u0308|\u0304|\u0306|\u0307|\u030A|\u030B|\u030C|\u0327|\u0328|\u0342|\u0345|\u0361|\u036F/g, "").replace(/\u0300-\u036f/g, "");

export default function AdminBoletimForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    data: "",
    periodo: "manha",
    bandeira: "verde",
    motivo: "",
    titulo_curto: "VOO LIBERADO",
  });
  const [loading, setLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [savedAudios, setSavedAudios] = useState<string[]>([]);
  const [savedFotos, setSavedFotos] = useState<string[]>([]);
  const [audiosToDelete, setAudiosToDelete] = useState<string[]>([]);
  const [fotosToDelete, setFotosToDelete] = useState<string[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      supabase.from("boletins").select("*", { count: "exact" }).eq("id", id).single().then(({ data }) => {
        if (data) {
          setForm({
            data: data.data,
            periodo: data.periodo,
            bandeira: data.bandeira,
            motivo: data.motivo,
            titulo_curto: data.titulo_curto || bandeiraToStatus[data.bandeira],
          });
          setSavedAudios(data['audios_urls'] || []);
          setSavedFotos(data['fotos_urls'] || []);
        }
      });
    }
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => {
      if (name === "bandeira") {
        return {
          ...f,
          bandeira: value,
          titulo_curto: bandeiraToStatus[value],
        };
      }
      return { ...f, [name]: value };
    });
  }

  function handleAddAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length + audioFiles.length > 5) {
      toast.error("Máximo de 5 áudios por boletim.");
      return;
    }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Áudio muito grande: ${file.name}`);
        return;
      }
    }
    setAudioFiles((prev: File[]) => [...prev, ...files].slice(0, 5));
    if (audioInputRef.current) audioInputRef.current.value = "";
  }

  function handleRemoveAudio(idx: number) {
    setAudioFiles((prev: File[]) => prev.filter((_, i) => i !== idx));
  }

  function handleAddFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length + fotoFiles.length > 4) {
      toast.error("Máximo de 4 fotos por boletim.");
      return;
    }
    for (const file of files) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error(`Foto muito grande: ${file.name}`);
        return;
      }
    }
    setFotoFiles((prev: File[]) => [...prev, ...files].slice(0, 4));
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  }

  function handleRemoveFoto(idx: number) {
    setFotoFiles((prev: File[]) => prev.filter((_, i) => i !== idx));
  }

  function handleRemoveSavedAudio(idx: number) {
    setAudiosToDelete((prev) => [...prev, savedAudios[idx]]);
    setSavedAudios((prev) => prev.filter((_, i) => i !== idx));
  }
  function handleRemoveSavedFoto(idx: number) {
    setFotosToDelete((prev) => [...prev, savedFotos[idx]]);
    setSavedFotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function deleteFromStorage(urls: string[]) {
    if (!urls.length) return;
    const paths = urls.map(u => {
      const parts = u.split("/boletim-media/");
      return parts[1] ? `boletim-media/${parts[1]}` : null;
    }).filter(Boolean);
    if (paths.length) {
      await supabase.storage.from("boletim-media").remove(paths as string[]);
    }
  }

  async function uploadFiles(boletimId: string) {
    // Upload dos áudios
    const audioUrls: (string|null)[] = [];
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const ext = file.name.split('.').pop();
      const path = `${boletimId}/audio_${i + 1}.${ext}`;
      try {
        const { data, error } = await supabase.storage.from("boletim-media").upload(path, file, { upsert: true, contentType: file.type });
        if (error) throw error;
        const { data: signed, error: signError } = await supabase.storage.from("boletim-media").createSignedUrl(data.path, 60 * 60 * 24 * 7);
        if (signError) throw signError;
        audioUrls.push(signed.signedUrl);
      } catch (error: any) {
        console.error("UPLOAD ERROR", path, { code: error.statusCode, msg: error.message });
        toast.error(error.message || error.error_description || "Erro ao enviar áudio");
        throw error;
      }
    }
    // Upload das fotos
    const fotoUrls: (string|null)[] = [];
    for (let i = 0; i < fotoFiles.length; i++) {
      const file = fotoFiles[i];
      const ext = file.name.split('.').pop();
      const path = `${boletimId}/foto_${i + 1}.${ext}`;
      try {
        const { data, error } = await supabase.storage.from("boletim-media").upload(path, file, { upsert: true, contentType: file.type });
        if (error) throw error;
        const { data: signed, error: signError } = await supabase.storage.from("boletim-media").createSignedUrl(data.path, 60 * 60 * 24 * 7);
        if (signError) throw signError;
        fotoUrls.push(signed.signedUrl);
      } catch (error: any) {
        console.error("UPLOAD ERROR", path, { code: error.statusCode, msg: error.message });
        toast.error(error.message || error.error_description || "Erro ao enviar foto");
        throw error;
      }
    }
    return { audioUrls: audioUrls.filter(Boolean), fotoUrls: fotoUrls.filter(Boolean) };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    // Normalizar valores para o banco
    const periodoDb = toDbPeriodo(form.periodo) as "manha" | "tarde";
    const dataDb = form.data;
    const bandeiraDb = form.bandeira as "verde" | "amarela" | "vermelha";
    // Validação unicidade
    let count = 0;
    if (isEdit) {
      const { count: c } = await supabase
        .from("boletins")
        .select("*", { count: "exact", head: true })
        .eq("data", dataDb)
        .eq("periodo", periodoDb)
        .neq("id", id || "");
      count = c || 0;
    } else {
      const { count: c } = await supabase
        .from("boletins")
        .select("*", { count: "exact", head: true })
        .eq("data", dataDb)
        .eq("periodo", periodoDb);
      count = c || 0;
    }
    if (count > 0) {
      toast.error("Já existe um boletim para esta data e período.");
      setLoading(false);
      return;
    }
    // Insert ou update
    let boletimId = id;
    if (isEdit) {
      const { data: updated, error } = await supabase.from("boletins").update({
        data: dataDb,
        periodo: periodoDb,
        bandeira: bandeiraDb,
        motivo: form.motivo,
        status_voo: bandeiraToStatusVoo[bandeiraDb],
        titulo_curto: form.titulo_curto,
        atualizado_em: new Date().toISOString(),
        publicado: true,
      }).eq("id", id).select("id").single();
      if (error) {
        toast.error("Erro ao salvar boletim");
        setLoading(false);
        return;
      }
      boletimId = updated.id;
    } else {
      const payload = {
        data: dataDb,
        periodo: periodoDb,
        bandeira: bandeiraDb,
        motivo: form.motivo,
        status_voo: bandeiraToStatusVoo[bandeiraDb],
        titulo_curto: form.titulo_curto,
        publicado_em: new Date().toISOString(),
        publicado: true,
      };
      const { data: inserted, error } = await supabase
        .from("boletins")
        .insert([payload])
        .select("id")
        .single();
      if (error) {
        toast.error("Erro ao salvar boletim");
        setLoading(false);
        return;
      }
      boletimId = inserted.id;
    }
    // Upload dos arquivos
    let audioUrls: string[] = savedAudios;
    let fotoUrls: string[] = savedFotos;
    try {
      const uploaded = await uploadFiles(boletimId);
      audioUrls = [...savedAudios, ...uploaded.audioUrls];
      fotoUrls = [...savedFotos, ...uploaded.fotoUrls];
    } catch (e: any) {
      setLoading(false);
      return;
    }
    // Deletar arquivos removidos
    await deleteFromStorage(audiosToDelete);
    await deleteFromStorage(fotosToDelete);
    // Atualizar boletim com arrays de URLs
    const updatePayload = {
      audios_urls: audioUrls,
      fotos_urls: fotoUrls,
    };
    const { data: updateData, error: updateError } = await supabase.from("boletins").update(updatePayload as any).eq("id", boletimId).select("id");
    if (updateError) {
      console.error("UPDATE boletim error ↴", updateError);
      toast.error(updateError.message + (updateError.details ? `: ${updateError.details}` : ""));
      setLoading(false);
      return;
    }
    toast.success("Anexos salvos");
    navigate("/admin/boletins");
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? "Editar Boletim" : "Novo Boletim"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Data do Voo</label>
          <Input type="date" name="data" value={form.data} onChange={handleChange} required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Período</label>
          <select name="periodo" value={form.periodo} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Bandeira</label>
          <select name="bandeira" value={form.bandeira} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="verde">Verde</option>
            <option value="amarela">Amarela</option>
            <option value="vermelha">Vermelha</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Status Resumido</label>
          <Input name="titulo_curto" value={form.titulo_curto} readOnly required />
        </div>
        <div>
          <label className="block mb-1 font-medium">Motivo</label>
          <Textarea name="motivo" value={form.motivo} onChange={handleChange} required rows={4} />
        </div>
        <div>
          <label className="block mb-1 font-medium">Áudios (máx 5, até 10MB cada)</label>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAddAudio}
            multiple
            disabled={audioFiles.length >= 5}
          />
          <ul className="mt-2 space-y-1">
            {audioFiles.map((file, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span>🎤 {file.name} ({(file.size/1024/1024).toFixed(1)}MB)</span>
                <button type="button" className="text-red-600" onClick={() => handleRemoveAudio(idx)}>Remover</button>
              </li>
            ))}
          </ul>
          {audioFiles.length < 5 && (
            <button type="button" className="mt-2 text-blue-600 underline" onClick={() => audioInputRef.current?.click()}>Adicionar áudio</button>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium">Fotos (máx 4, até 1MB cada)</label>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleAddFotos}
            multiple
            disabled={fotoFiles.length >= 4}
          />
          <div className="flex gap-2 mt-2">
            {fotoFiles.map((file, idx) => (
              <div key={idx} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-20 h-20 object-cover rounded border cursor-pointer"
                  onClick={() => setLightboxUrl(URL.createObjectURL(file))}
                />
                <button type="button" className="absolute top-0 right-0 bg-white text-red-600 rounded-full px-1" onClick={() => handleRemoveFoto(idx)}>x</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Áudios já salvos</label>
          <ul className="mt-2 space-y-1">
            {savedAudios.map((url, idx) => (
              <li key={url} className="flex items-center gap-2">
                <audio controls src={url} className="w-40" />
                <button type="button" className="text-red-600" onClick={() => handleRemoveSavedAudio(idx)}>Remover</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="block mb-1 font-medium">Fotos já salvas</label>
          <div className="flex gap-2 mt-2">
            {savedFotos.map((url, idx) => (
              <div key={url} className="relative">
                <img src={url} alt="Foto do boletim" loading="lazy" className="w-20 h-20 object-cover rounded border cursor-pointer" onClick={() => setLightboxUrl(url)} />
                <button type="button" className="absolute top-0 right-0 bg-white text-red-600 rounded-full px-1" onClick={() => handleRemoveSavedFoto(idx)}>x</button>
              </div>
            ))}
          </div>
        </div>
        {lightboxUrl && (
          <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
            <DialogContent className="flex flex-col items-center justify-center bg-black/90 p-4">
              <img
                src={lightboxUrl}
                alt="Foto ampliada"
                className="max-h-[80vh] max-w-[90vw] rounded shadow-lg"
                style={{ objectFit: "contain" }}
              />
              <Button
                className="mt-4"
                variant="destructive"
                onClick={() => setLightboxUrl(null)}
              >
                Fechar
              </Button>
            </DialogContent>
          </Dialog>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/boletins")}>Cancelar</Button>
          <Button type="submit" {...(loading ? { disabled: true } : {})}>{isEdit ? "Salvar Alterações" : "Criar Boletim"}</Button>
        </div>
      </form>
    </div>
  );
} 