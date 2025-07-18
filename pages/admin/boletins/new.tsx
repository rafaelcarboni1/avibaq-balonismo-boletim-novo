import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../src/integrations/supabase/client";
import SimpleDashboardLayout from "../../../src/components/SimpleDashboardLayout";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import { Textarea } from "../../../src/components/ui/textarea";
import { Badge } from "../../../src/components/ui/badge";
import { toast } from "../../../src/components/ui/sonner";
import { Dialog, DialogContent } from "../../../src/components/ui/dialog";

import { FileText, Plus, Mic, MicOff, Upload, Image, X, ArrowLeft } from "lucide-react";
import { useUser } from "@/hooks/useUser";

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

export const toDbPeriodo = (value: string) =>
  value.trim().toLowerCase().normalize("NFD").replace(/\u0300|\u0301|\u0302|\u0303|\u0308|\u0304|\u0306|\u0307|\u030A|\u030B|\u030C|\u0327|\u0328|\u0342|\u0345|\u0361|\u036F/g, "").replace(/\u0300-\u036f/g, "");

export default function AdminBoletimForm() {
  const router = useRouter();
  const { user } = useUser();
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
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

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
    const { count: c } = await supabase
      .from("boletins")
      .select("*", { count: "exact", head: true })
      .eq("data", dataDb)
      .eq("periodo", periodoDb);
    count = c || 0;
    if (count > 0) {
      toast.error("Já existe um boletim para esta data e período.");
      setLoading(false);
      return;
    }
    // Insert
    let boletimId = undefined;
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
    // Log de atividade
    try {
      await supabase.from('logs_atividade').insert({
        acao: `Boletim criado por ${user?.email || 'usuário desconhecido'}`,
        detalhes: {
          boletimId,
          data: form.data,
          periodo: form.periodo,
          bandeira: form.bandeira,
          titulo_curto: form.titulo_curto
        },
        usuario_id: user?.id || null
      });
    } catch (logError) {
      console.error('Erro ao registrar log de atividade (criação boletim):', logError);
    }
    // Upload dos arquivos
    let audioUrls: string[] = [];
    let fotoUrls: string[] = [];
    try {
      const uploaded = await uploadFiles(boletimId);
      audioUrls = uploaded.audioUrls;
      fotoUrls = uploaded.fotoUrls;
    } catch (e: any) {
      setLoading(false);
      return;
    }
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
    toast.success("Boletim criado com sucesso!");
    router.push("/admin/boletins");
  }

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    setRecordedChunks([]);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let localChunks: Blob[] = [];
      const recorder = new window.MediaRecorder(stream);
      setMediaRecorder(recorder);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) localChunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(localChunks, { type: "audio/webm" });
        setAudioPreviewUrl(URL.createObjectURL(blob));
        setRecordedChunks([]); // Limpa o state
        if (recordingInterval.current) clearInterval(recordingInterval.current);
      };
      recorder.start();
      setIsRecording(true);
      // Inicia contador de tempo
      recordingInterval.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      toast.error("Não foi possível acessar o microfone.");
    }
  }, []);

  // Parar gravação
  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    }
  }, [mediaRecorder, isRecording]);

  // Adicionar áudio gravado à lista
  const handleAddRecordedAudio = () => {
    if (!audioPreviewUrl) return;
    fetch(audioPreviewUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `gravacao-${Date.now()}.webm`, { type: "audio/webm" });
        setAudioFiles((prev) => [...prev, file].slice(0, 5));
        setAudioPreviewUrl(null);
        setRecordedChunks([]);
      });
  };

  // Formatar tempo mm:ss
  function formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const getBandeiraColor = (bandeira: string) => {
    switch (bandeira) {
      case "verde": return "bg-green-100 text-green-800";
      case "amarela": return "bg-yellow-100 text-yellow-800";
      case "vermelha": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <SimpleDashboardLayout 
      title="Novo Boletim"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Boletins", href: "/admin/boletins" },
        { label: "Novo", icon: FileText }
      ]}
      headerActions={
        <Button variant="outline" onClick={() => router.push("/admin/boletins")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Boletins
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Novo Boletim Meteorológico</h1>
              <p className="text-gray-600">Preencha os dados do boletim meteorológico para publicar no sistema</p>
              <div className="mt-4">
                <Badge className={getBandeiraColor(form.bandeira)}>
                  Bandeira {form.bandeira.toUpperCase()}
                </Badge>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data do Voo</label>
                  <Input
                    type="date"
                    name="data"
                    value={form.data}
                    onChange={handleChange}
                    required
                    className="w-full focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Período</label>
                  <select
                    name="periodo"
                    value={form.periodo}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="manha">☀️ Manhã</option>
                    <option value="tarde">🌇 Tarde</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bandeira</label>
                  <div className="relative">
                    <select
                      name="bandeira"
                      value={form.bandeira}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-12"
                      required
                    >
                      <option value="verde">🟢 Verde</option>
                      <option value="amarela">🟡 Amarela</option>
                      <option value="vermelha">🔴 Vermelha</option>
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                      {form.bandeira === "verde" && <span className="inline-block w-3 h-3 rounded-full bg-green-500" />}
                      {form.bandeira === "amarela" && <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />}
                      {form.bandeira === "vermelha" && <span className="inline-block w-3 h-3 rounded-full bg-red-500" />}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status Resumido</label>
                  <Input
                    name="titulo_curto"
                    value={form.titulo_curto}
                    onChange={handleChange}
                    required
                    className="w-full focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Motivo</label>
                <Textarea
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  rows={4}
                  className="w-full focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva o motivo do status do voo (opcional)"
                />
              </div>
              {/* Seção de Áudios */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Mic className="h-5 w-5 text-blue-600" />
                  <label className="text-sm font-semibold text-gray-700">Áudios</label>
                  <Badge variant="secondary" className="text-xs">
                    máx 5, até 10MB cada
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <input
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleAddAudio}
                    ref={audioInputRef}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => audioInputRef.current?.click()}
                    disabled={audioFiles.length >= 5}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Adicionar Áudio
                  </Button>
                  <Button 
                    type="button" 
                    variant={isRecording ? "destructive" : "secondary"} 
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={audioFiles.length >= 5}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-4 h-4 mr-2" />
                        Parar Gravação
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Gravar Áudio
                      </>
                    )}
                  </Button>
                  {isRecording && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-mono text-red-700">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>
                {/* Preview e confirmação do áudio gravado */}
                {audioPreviewUrl && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Preview da Gravação</h4>
                    <audio controls src={audioPreviewUrl} className="w-full mb-3" />
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={handleAddRecordedAudio}>
                        Adicionar à lista
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { setAudioPreviewUrl(null); setRecordedChunks([]); }}
                      >
                        Descartar
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Lista de áudios selecionados */}
                {audioFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Áudios selecionados:</h4>
                    {audioFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {(file.size/1024/1024).toFixed(1)}MB
                          </Badge>
                        </div>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleRemoveAudio(idx)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Seção de Fotos */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Image className="h-5 w-5 text-blue-600" />
                  <label className="text-sm font-semibold text-gray-700">Fotos</label>
                  <Badge variant="secondary" className="text-xs">
                    máx 4, até 1MB cada
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddFotos}
                    ref={fotoInputRef}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={fotoFiles.length >= 4}
                    className="w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Adicionar Fotos
                  </Button>
                </div>
                
                {/* Lista de fotos selecionadas */}
                {fotoFiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Fotos selecionadas:</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {fotoFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                          />
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="destructive" 
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveFoto(idx)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/admin/boletins')}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Boletim
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </SimpleDashboardLayout>
  );
}