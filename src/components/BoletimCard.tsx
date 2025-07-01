import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Volume2, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useState, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

type BandeiraType = "verde" | "amarela" | "vermelha";
type StatusVoo = "liberado" | "em_avaliacao" | "cancelado";

interface BoletimData {
  id: string;
  data: string;
  periodo: "manha" | "tarde";
  bandeira: BandeiraType;
  status_voo: StatusVoo;
  titulo_curto: string;
  motivo: string;
  audio_url?: string;
  fotos?: string[];
  publicado_em?: string;
  audios_urls?: string[];
  fotos_urls?: string[];
}

interface BoletimCardProps {
  boletim?: BoletimData;
}

const getBandeiraConfig = (bandeira: BandeiraType) => {
  switch (bandeira) {
    case "verde":
      return {
        color: "bg-green-500",
        text: "BANDEIRA VERDE - VOO LIBERADO",
        icon: CheckCircle,
        textColor: "text-green-700"
      };
    case "amarela":
      return {
        color: "bg-yellow-500",
        text: "BANDEIRA AMARELA - VOO EM AVALIAÇÃO",
        icon: Clock,
        textColor: "text-yellow-700"
      };
    case "vermelha":
      return {
        color: "bg-red-500",
        text: "BANDEIRA VERMELHA - VOO CANCELADO",
        icon: AlertTriangle,
        textColor: "text-red-700"
      };
  }
};

export const BoletimCard = ({ boletim }: BoletimCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!boletim) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
        <CardHeader className="text-center bg-white/80 rounded-t-lg">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <img src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png" alt="Logo AVIBAQ" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', background: '#fff' }} />
            <h2 className="text-2xl font-bold text-gray-900">Boletim Meteorológico - AVIBAQ</h2>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 text-lg">Nenhum boletim publicado hoje</p>
          <p className="text-gray-500 text-sm mt-2">O boletim será disponibilizado até às 19h</p>
        </CardContent>
      </Card>
    );
  }

  const bandeiraConfig = getBandeiraConfig(boletim.bandeira);
  const Icon = bandeiraConfig.icon;
  
  function handleDownloadPDF() {
    if (!boletim) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Boletim Meteorológico - AVIBAQ", 14, 18);
    doc.setFontSize(12);
    doc.text(`Data: ${boletim.data.split('-').reverse().join('/')} - Período: ${boletim.periodo === 'manha' ? 'Manhã' : 'Tarde'}`, 14, 30);
    doc.text(`Bandeira: ${boletim.bandeira.toUpperCase()}`, 14, 38);
    doc.text(`Status: ${boletim.titulo_curto}`, 14, 46);
    doc.text("Motivo:", 14, 56);
    doc.setFontSize(11);
    doc.text(boletim.motivo, 14, 64, { maxWidth: 180 });
    if (boletim.fotos_urls && boletim.fotos_urls.length > 0) {
      doc.setFontSize(12);
      doc.text("Fotos anexadas:", 14, 80);
      boletim.fotos_urls.forEach((url, idx) => {
        doc.text(`- ${url}`, 18, 88 + idx * 8, { maxWidth: 180 });
      });
    }
    if (boletim.audios_urls && boletim.audios_urls.length > 0) {
      doc.setFontSize(12);
      const y = 88 + (boletim.fotos_urls?.length || 0) * 8 + 8;
      doc.text("Áudios anexados:", 14, y);
      boletim.audios_urls.forEach((url, idx) => {
        doc.text(`- ${url}`, 18, y + 8 + idx * 8, { maxWidth: 180 });
      });
    }
    doc.save(`Boletim_AVIBAQ_${boletim.data.split('-').reverse().join('_')}_${boletim.periodo}.pdf`);
  }

  async function handleDownloadImage() {
    if (!boletim) return;
    // Cria um card fantasma offscreen
    const ghost = document.createElement('div');
    ghost.style.position = 'fixed';
    ghost.style.left = '-9999px';
    ghost.style.top = '0';
    ghost.style.width = '1080px';
    ghost.style.height = '1350px';
    ghost.style.background = '#F5F7FA';
    ghost.style.zIndex = '9999';
    ghost.style.padding = '0';
    ghost.style.display = 'flex';
    ghost.style.alignItems = 'center';
    ghost.style.justifyContent = 'center';
    document.body.appendChild(ghost);
    // Renderiza o conteúdo do card no ghost
    ghost.innerHTML = `
      <div style="width:1040px;height:1310px;background:white;border-radius:24px;box-shadow:0 4px 24px #0001;padding:24px 28px 20px 28px;display:flex;flex-direction:column;align-items:center;font-family:Inter,sans-serif;">
        <div style='display:flex;align-items:center;gap:24px;margin-bottom:20px;'>
          <img src='https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png' alt='Logo AVIBAQ' style='width:68px;height:68px;border-radius:50%;background:#fff;'/>
          <div style='display:flex;flex-direction:column;align-items:flex-start;'>
            <span style='font-size:28px;font-weight:700;color:#111;line-height:1.1;'>Boletim Meteorológico - AVIBAQ</span>
            <div style='display:flex;align-items:center;gap:12px;margin-top:6px;'>
              <span style='font-size:18px;font-weight:700;color:#111;display:flex;align-items:center;gap:6px;'><svg width='22' height='22' fill='none' stroke='#222'><rect width='22' height='22' rx='5' fill='#f5f7fa'/><path d='M5 8h12M5 11h7M5 14h5' stroke='#222' stroke-width='2' stroke-linecap='round'/></svg>${boletim.data.split('-').reverse().join('/')}</span>
              <span style='font-size:15px;padding:3px 12px;border-radius:999px;border:1.2px solid #eee;background:#f5f7fa;'>Período da ${boletim.periodo === "manha" ? "Manhã" : "Tarde"}</span>
            </div>
          </div>
        </div>
        <div style='width:100%;margin-bottom:16px;padding:0;'>
          <div style='background:#3AA655;color:white;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding:10px 0;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;'>
            <span style='font-size:18px;'>✔️</span> BANDEIRA ${boletim.bandeira.toUpperCase()} - ${boletim.titulo_curto.toUpperCase()}
          </div>
        </div>
        <div style='width:100%;margin-bottom:16px;'>
          <span style='font-size:16px;font-weight:600;color:#222;'>Motivo:</span>
          <div style='background:#f5f7fa;border-radius:8px;padding:12px 14px;margin-top:7px;'>
            <pre style='font-size:13px;color:#222;line-height:1.5;margin:0;white-space:pre-wrap;'>${boletim.motivo}</pre>
          </div>
        </div>
        <div style='width:100%;margin-bottom:16px;'>
          <span style='font-size:13px;font-weight:500;color:#222;'>Fotos Anexadas</span>
          <div style='display:flex;gap:8px;margin-top:6px;'>
            ${(boletim.fotos_urls||[]).map(u => `<img src='${u}' style='width:150px;height:100px;object-fit:cover;border-radius:7px;box-shadow:0 1px 4px #0001;'/>`).join('')}
          </div>
        </div>
        <div style='width:100%;margin-top:auto;background:#f5f7fa;border-radius:7px;padding:8px 0;text-align:center;font-size:12px;color:#444;'>
          Decisão da Comissão de Meteorologia e Segurança da AVIBAQ<br/>
          <span style='font-size:11px;color:#888;'>Atualizado em ${boletim.publicado_em ? new Date(boletim.publicado_em).toLocaleString('pt-BR') : ''}</span>
        </div>
      </div>
    `;
    // Aguarda imagens carregarem
    const imgs = Array.from(ghost.querySelectorAll('img'));
    await Promise.all(imgs.map(img => new Promise(res => { img.onload = () => res(true); img.onerror = () => res(true); })));
    // Captura imagem
    const canvas = await html2canvas(ghost, { backgroundColor: '#F5F7FA', width: 1080, height: 1350, scale: 1, useCORS: true });
    document.body.removeChild(ghost);
    const link = document.createElement('a');
    link.download = `Boletim_AVIBAQ_${boletim.data.split('-').reverse().join('_')}_${boletim.periodo}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function handleDownloadAudio(url: string, idx: number) {
    if (!url) return;
    const [ano, mes, dia] = boletim.data.split('-');
    const dataFormatada = `${dia}-${mes}-${ano.slice(2)}`;
    const fileName = `Boletim-dia-${dataFormatada}-audio-${idx + 1}.mp3`;
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div ref={cardRef} className="w-full max-w-full md:max-w-4xl mx-auto bg-white rounded-2xl shadow-lg ring-1 ring-black/5 px-2 py-6 md:px-10 md:py-12 font-sans tracking-normal">
      <CardHeader className="text-center bg-white/80 rounded-t-lg pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-center mb-6 md:gap-8">
          {/* Logo em cima no mobile, ao lado no desktop */}
          <img 
            src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png"
            alt="Logo AVIBAQ"
            className="w-16 h-16 md:w-16 md:h-16 rounded-full object-cover bg-white mb-2 md:mb-0"
          />
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap flex items-center leading-tight mt-1" style={{lineHeight: 1.1, letterSpacing: 0}}>Boletim Meteorológico - AVIBAQ</h2>
            <div className="flex items-center gap-4 text-sm md:text-base text-gray-600 mt-2 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 md:w-7 md:h-7" />
                <span className="text-lg md:text-2xl font-bold text-gray-900">{boletim.data.split('-').reverse().join('/')}</span>
              </div>
              <Badge variant="outline" className="text-sm md:text-base px-3 py-1">
                Período da {boletim.periodo === "manha" ? "Manhã" : "Tarde"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Faixa da Bandeira */}
        <div className={`${bandeiraConfig.color} p-4 text-sm font-semibold tracking-wide text-white uppercase transition-colors duration-300 rounded-t-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 mr-2" />
          <span>{bandeiraConfig.text}</span>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 bg-white">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Motivo:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed mt-4" style={{ whiteSpace: 'pre-line' }}>{boletim.motivo}</p>
            </div>
          </div>

          {/* Mídia */}
          <div className="space-y-4">
            {boletim.audio_url && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-blue-900">Áudio do Boletim</span>
                </div>
                <audio controls src={boletim.audio_url} className="w-full mt-2" />
              </div>
            )}

            {boletim.fotos && boletim.fotos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fotos Meteorológicas</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {boletim.fotos.slice(0, 4).map((foto, index) => (
                    <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={foto}
                        alt={`Foto meteorológica ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos anexadas (fotos_urls) */}
            {boletim.fotos_urls && boletim.fotos_urls.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fotos Anexadas</h4>
                {/* Desktop: grid, Mobile: slider */}
                <div className="hidden md:grid grid-cols-3 gap-3">
                  {boletim.fotos_urls.map((u: string, idx: number) => (
                    <img
                      key={u}
                      src={u}
                      alt="Foto do boletim"
                      loading="lazy"
                      className="rounded-lg shadow object-cover w-full h-40 cursor-pointer"
                      onClick={() => setLightboxIdx(idx)}
                    />
                  ))}
                </div>
                <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-3 pb-2">
                  {boletim.fotos_urls.map((u: string, idx: number) => (
                    <img
                      key={u}
                      src={u}
                      alt="Foto do boletim"
                      loading="lazy"
                      className="rounded-lg shadow object-cover w-[180px] h-[120px] flex-shrink-0 snap-center cursor-pointer"
                      onClick={() => setLightboxIdx(idx)}
                    />
                  ))}
                </div>
                {/* Lightbox/Preview */}
                {lightboxIdx !== null && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <button
                      className="absolute top-6 right-6 text-white text-3xl font-bold bg-black/60 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/80 transition"
                      onClick={() => setLightboxIdx(null)}
                      aria-label="Fechar preview"
                    >×</button>
                    <button
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold bg-black/40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition disabled:opacity-30"
                      onClick={() => setLightboxIdx(i => (i !== null && i > 0 ? i - 1 : i))}
                      disabled={lightboxIdx === 0}
                      aria-label="Foto anterior"
                    >‹</button>
                    <img
                      src={boletim.fotos_urls[lightboxIdx]}
                      alt={`Foto ${lightboxIdx + 1}`}
                      className="max-h-[80vh] max-w-[90vw] rounded-xl shadow-2xl border-4 border-white object-contain"
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold bg-black/40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition disabled:opacity-30"
                      onClick={() => setLightboxIdx(i => (i !== null && i < boletim.fotos_urls.length - 1 ? i + 1 : i))}
                      disabled={lightboxIdx === boletim.fotos_urls.length - 1}
                      aria-label="Próxima foto"
                    >›</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Áudios anexados */}
          {boletim.audios_urls?.length > 0 && (
            <div className="my-4 space-y-2">
              {boletim.audios_urls.map((u: string, idx: number) => (
                <audio key={u} controls src={u} className="w-full my-2" />
              ))}
            </div>
          )}

          {/* Botões de Ação - não aparecem no print */}
          <div className="flex flex-wrap gap-3 mt-6 no-print">
            <Button variant="outline" size="sm" onClick={handleDownloadImage}>
              <Download className="w-4 h-4 mr-2" />
              Baixar Imagem
            </Button>
            {boletim.audios_urls && boletim.audios_urls.length > 0 && boletim.audios_urls.map((url, idx) => (
              <Button key={url} variant="outline" size="sm" onClick={() => handleDownloadAudio(url, idx)}>
                <Volume2 className="w-4 h-4 mr-2" />
                Baixar Áudio {boletim.audios_urls.length > 1 ? idx + 1 : ''}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => navigate('/historico')}>
              <Calendar className="w-4 h-4 mr-2" />
              Ver Histórico
            </Button>
          </div>
        </div>

        {/* Rodapé */}
        <div className="bg-gray-50 px-6 py-4 text-center border-t">
          <p className="text-sm text-gray-600">
            Decisão da Comissão de Meteorologia e Segurança da AVIBAQ
          </p>
          {boletim.publicado_em && (
            <p className="text-xs text-gray-500 mt-1">
              Atualizado em {new Date(boletim.publicado_em).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>
    </div>
  );
};
