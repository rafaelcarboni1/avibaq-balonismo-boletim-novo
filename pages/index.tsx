import { useEffect, useState } from "react";
import { Header } from "../src/components/Layout/Header";
import { BoletimCard } from "../src/components/BoletimCard";
import { AssinantesForm } from "../src/components/AssinantesForm";
import { Card, CardContent } from "../src/components/ui/card";
import { supabase } from "../src/integrations/supabase/client";
import HomeSectionMembros from "../src/components/HomeSectionMembros";

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
        // 1. Buscar o boletim do próximo dia (data > hoje)
        let { data: futuros, error: errorFuturos } = await supabase
          .from("boletins")
          .select("*")
          .gt("data", localDate)
          .order("data", { ascending: true })
          .order("periodo", { ascending: true })
          .limit(1);
        if (errorFuturos) {
          console.error("Erro ao buscar boletim futuro:", errorFuturos);
        }
        if (futuros && futuros.length > 0) {
          setBoletimHoje(futuros[0]);
        } else {
          // 2. Se não houver boletim futuro, buscar o de hoje
          const { data: hojeData, error: errorHoje } = await supabase
            .from("boletins")
            .select("*")
            .eq("data", localDate)
            .order("periodo", { ascending: true })
            .limit(1);
          if (errorHoje) {
            console.error("Erro ao buscar boletim de hoje:", errorHoje);
          }
          if (hojeData && hojeData.length > 0) {
            setBoletimHoje(hojeData[0]);
          } else {
            // 3. Se não houver, buscar o mais recente do passado
            const { data: ultimos, error: err2 } = await supabase
              .from("boletins")
              .select("*")
              .lt("data", localDate)
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

        {/* Links Úteis */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
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
              <a href="/admin/login" className="text-blue-600 hover:underline">
                Fazer Login →
              </a>
            </CardContent>
          </Card>
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

        {/* Vitrine de Associados em Dia */}
        <HomeSectionMembros />

        {/* Protocolos de Segurança – AVIBAQ */}
        <section className="mt-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-black/5 px-8 py-10 space-y-6">
              <h2 className="text-2xl font-semibold text-center">
                Protocolos de Segurança – AVIBAQ
              </h2>

              {/* Visor PDF responsivo */}
              <div className="aspect-video w-full max-h-[600px] overflow-hidden ring-1 ring-black/5 rounded-lg">
                <iframe
                  src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets//AVIBAQ-protocolos-seguranca.pdf#toolbar=0&navpanes=0"
                  title="Protocolos de Segurança"
                  className="w-full h-full"
                />
              </div>

              <div className="text-center">
                <a
                  href="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets//AVIBAQ-protocolos-seguranca.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white hover:bg-primary2 transition-colors text-sm font-medium"
                >
                  Baixar PDF
                </a>
              </div>
            </div>
          </div>
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