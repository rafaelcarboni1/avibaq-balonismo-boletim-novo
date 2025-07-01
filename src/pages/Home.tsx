import { useEffect, useState } from "react";
import { Header } from "@/components/Layout/Header";
import { BoletimCard } from "@/components/BoletimCard";
import { AssinantesForm } from "@/components/AssinantesForm";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface BoletimData {
  id: string;
  data: string;
  periodo: "manha" | "tarde";
  bandeira: "verde" | "amarela" | "vermelha";
  status_voo: "liberado" | "em_avaliacao" | "cancelado";
  titulo_curto: string;
  motivo: string;
  audio_url?: string;
  fotos?: string[];
  publicado_em?: string;
}

const Home = () => {
  const [boletimHoje, setBoletimHoje] = useState<BoletimData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoletim = async () => {
      try {
        // Ajuste para fuso horário de São Paulo (GMT-3)
        const tz = 'America/Sao_Paulo';
        const hoje = new Date();
        const localDate = hoje.toLocaleDateString('sv-SE', { timeZone: tz }); // 'YYYY-MM-DD'
        // 1. Buscar boletim de hoje
        let { data, error } = await supabase
          .from("boletins")
          .select("*")
          .eq("data", localDate)
          .order("periodo", { ascending: false })
          .limit(1);
        if (error) {
          console.error("Erro ao buscar boletim de hoje:", error);
        }
        if (data && data.length > 0) {
          setBoletimHoje(data[0]);
        } else {
          // 2. Buscar boletim do próximo dia (amanhã)
          const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
          const localAmanha = amanha.toLocaleDateString('sv-SE', { timeZone: tz });
          const { data: dataAmanha, error: errorAmanha } = await supabase
            .from("boletins")
            .select("*")
            .eq("data", localAmanha)
            .order("periodo", { ascending: false })
            .limit(1);
          if (errorAmanha) {
            console.error("Erro ao buscar boletim de amanhã:", errorAmanha);
          }
          if (dataAmanha && dataAmanha.length > 0) {
            setBoletimHoje(dataAmanha[0]);
          } else {
            // 3. Buscar o mais recente do passado
            const { data: ultimos, error: err2 } = await supabase
              .from("boletins")
              .select("*")
              .order("data", { ascending: false })
              .order("periodo", { ascending: false })
              .limit(1);
            if (!err2 && ultimos && ultimos.length > 0) {
              setBoletimHoje(ultimos[0]);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar boletim:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoletim();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Seção Principal com Missão */}
        <section className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Associação de Pilotos e Empresas de Balonismo
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Promovendo a segurança e excelência no balonismo em Praia Grande/SC através de informações meteorológicas precisas e confiáveis para nossa comunidade.
            </p>
          </div>
        </section>

        {/* Boletim do Dia */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Boletim de Hoje</h2>
            <p className="text-gray-600">
              Condições meteorológicas atualizadas diariamente até às 19h
            </p>
          </div>
          
          {isLoading ? (
            <Card className="w-full max-w-4xl mx-auto">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <BoletimCard boletim={boletimHoje} />
          )}
        </section>

        {/* Formulário de Cadastro */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Não Perca Nenhum Boletim</h2>
            <p className="text-gray-600">
              Receba as condições meteorológicas diretamente no seu e-mail
            </p>
          </div>
          
          <AssinantesForm />
        </section>

        {/* Links Úteis */}
        <section className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Histórico de Boletins</h3>
              <p className="text-gray-600 text-sm mb-4">
                Consulte boletins anteriores e analise tendências meteorológicas
              </p>
              <a href="/historico" className="text-blue-600 hover:underline">
                Ver Histórico →
              </a>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Sobre a AVIBAQ</h3>
              <p className="text-gray-600 text-sm mb-4">
                Conheça nossa missão, história e compromisso com a segurança
              </p>
              <a href="/quem-somos" className="text-blue-600 hover:underline">
                Saiba Mais →
              </a>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Área Administrativa</h3>
              <p className="text-gray-600 text-sm mb-4">
                Acesso restrito para membros da comissão de meteorologia
              </p>
              <a href="/admin" className="text-blue-600 hover:underline">
                Fazer Login →
              </a>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png" alt="Logo AVIBAQ" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#fff' }} />
            <span className="text-lg font-semibold">AVIBAQ</span>
          </div>
          <p className="text-gray-400 mb-4">
            Associação de Pilotos e Empresas de Balonismo
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="/politica-privacidade" className="text-gray-400 hover:text-white">
              Política de Privacidade
            </a>
            <a href="/acessibilidade" className="text-gray-400 hover:text-white">
              Acessibilidade
            </a>
            <a href="/contatos" className="text-gray-400 hover:text-white">
              Contatos
            </a>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            © 2025 AVIBAQ. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
