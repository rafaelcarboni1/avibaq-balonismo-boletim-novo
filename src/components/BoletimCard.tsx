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
    if (!cardRef.current) return;
    // Esconde os botões temporariamente
    const btns = cardRef.current.querySelector('.no-print') as HTMLElement;
    const originalDisplay = btns?.style.display;
    if (btns) btns.style.display = 'none';
    // Aguarda o reflow
    await new Promise(r => setTimeout(r, 50));
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#f8fafc', scale: 2, useCORS: true });
    if (btns) btns.style.display = originalDisplay || '';
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
    <div ref={cardRef} className="w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 font-sans tracking-normal">
      <CardHeader className="text-center bg-white/80 rounded-t-lg pb-0">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex items-center justify-center gap-10 mb-6 items-center">
            <img src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png" alt="Logo AVIBAQ" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', background: '#fff' }} />
            <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap flex items-center leading-tight mt-1" style={{lineHeight: 1.1, letterSpacing: 0}}>Boletim Meteorológico - AVIBAQ</h2>
          </div>
          <div className="flex items-center gap-6 text-base text-gray-600 mb-2 items-center">
            <div className="flex items-center gap-2 items-center">
              <Calendar className="w-7 h-7" />
              <span className="text-2xl font-bold text-gray-900">{boletim.data.split('-').reverse().join('/')}</span>
            </div>
            <Badge variant="outline" className="text-base px-3 py-1">
              Período da {boletim.periodo === "manha" ? "Manhã" : "Tarde"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Faixa da Bandeira */}
        <div className={`${bandeiraConfig.color} text-white p-4`}>
          <div className="flex items-center justify-center space-x-3">
            <Icon className="w-6 h-6" />
            <span className="text-lg font-bold">{bandeiraConfig.text}</span>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 bg-white">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Motivo:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 leading-relaxed">{boletim.motivo}</p>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {boletim.fotos_urls.map((u: string, idx: number) => (
                    <div key={u} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <img src={u} alt="Foto do boletim" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
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
