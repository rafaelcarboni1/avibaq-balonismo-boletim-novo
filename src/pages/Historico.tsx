
import { useEffect, useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Volume2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BoletimHistorico {
  id: string;
  data: string;
  periodo: "manha" | "tarde";
  bandeira: "verde" | "amarela" | "vermelha";
  status_voo: "liberado" | "em_avaliacao" | "cancelado";
  titulo_curto: string;
  motivo: string;
  audio_url?: string;
  fotos?: string[];
  publicado_em: string;
}

const Historico = () => {
  const [boletins, setBoletins] = useState<BoletimHistorico[]>([]);
  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    bandeira: "",
    periodo: ""
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBoletins();
  }, []);

  const fetchBoletins = async () => {
    try {
      let query = supabase
        .from("boletins")
        .select("*")
        .eq("publicado", true)
        .order("data", { ascending: false })
        .order("periodo", { ascending: false });

      if (filtros.dataInicio) {
        query = query.gte("data", filtros.dataInicio);
      }
      if (filtros.dataFim) {
        query = query.lte("data", filtros.dataFim);
      }
      if (filtros.bandeira) {
        query = query.eq("bandeira", filtros.bandeira);
      }
      if (filtros.periodo) {
        query = query.eq("periodo", filtros.periodo);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar boletins:", error);
      } else {
        setBoletins(data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar boletins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const aplicarFiltros = () => {
    setIsLoading(true);
    fetchBoletins();
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: "",
      dataFim: "",
      bandeira: "",
      periodo: ""
    });
    setIsLoading(true);
    fetchBoletins();
  };

  const getBandeiraColor = (bandeira: string) => {
    switch (bandeira) {
      case "verde": return "bg-green-500";
      case "amarela": return "bg-yellow-500";
      case "vermelha": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getBandeiraText = (bandeira: string) => {
    switch (bandeira) {
      case "verde": return "VOO LIBERADO";
      case "amarela": return "VOO EM AVALIAÇÃO";
      case "vermelha": return "VOO CANCELADO";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Boletins</h1>
          <p className="text-gray-600">
            Consulte boletins meteorológicos anteriores e analise as condições de voo
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros de Busca</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bandeira
                </label>
                <Select
                  value={filtros.bandeira}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, bandeira: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="verde">Verde</SelectItem>
                    <SelectItem value="amarela">Amarela</SelectItem>
                    <SelectItem value="vermelha">Vermelha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <Select
                  value={filtros.periodo}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, periodo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={aplicarFiltros} disabled={isLoading}>
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Boletins */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : boletins.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Nenhum boletim encontrado com os filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {boletins.map((boletim) => (
              <Card key={boletim.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {new Date(boletim.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {boletim.periodo === "manha" ? "Manhã" : "Tarde"}
                        </Badge>
                      </div>
                      
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium mb-3 ${getBandeiraColor(boletim.bandeira)}`}>
                        <span>BANDEIRA {boletim.bandeira.toUpperCase()} - {getBandeiraText(boletim.bandeira)}</span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {boletim.titulo_curto}
                      </h3>
                      
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {boletim.motivo}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          Publicado em {new Date(boletim.publicado_em).toLocaleString('pt-BR')}
                        </span>
                        {boletim.audio_url && (
                          <Badge variant="secondary">Com áudio</Badge>
                        )}
                        {boletim.fotos && boletim.fotos.length > 0 && (
                          <Badge variant="secondary">{boletim.fotos.length} foto(s)</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4 lg:mt-0">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      {boletim.audio_url && (
                        <Button variant="outline" size="sm">
                          <Volume2 className="w-4 h-4 mr-1" />
                          Áudio
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Historico;
