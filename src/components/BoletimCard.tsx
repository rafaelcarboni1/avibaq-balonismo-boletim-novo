
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Volume2, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

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

  if (!boletim) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
        <CardHeader className="text-center bg-white/80 rounded-t-lg">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
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
  
  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
      <CardHeader className="text-center bg-white/80 rounded-t-lg">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Boletim Meteorológico - AVIBAQ</h2>
        </div>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(boletim.data).toLocaleDateString('pt-BR')}</span>
          </div>
          <Badge variant="outline">
            Período da {boletim.periodo === "manha" ? "Manhã" : "Tarde"}
          </Badge>
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Áudio do Boletim</span>
                  <Button
                    size="sm"
                    variant={isPlaying ? "destructive" : "default"}
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    {isPlaying ? "Pausar" : "Reproduzir"}
                  </Button>
                </div>
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
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
            {boletim.audio_url && (
              <Button variant="outline" size="sm">
                <Volume2 className="w-4 h-4 mr-2" />
                Ouvir Áudio
              </Button>
            )}
            <Button variant="outline" size="sm">
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
    </Card>
  );
};
