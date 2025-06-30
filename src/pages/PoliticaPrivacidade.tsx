
import { useEffect, useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const PoliticaPrivacidade = () => {
  const [conteudo, setConteudo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConteudo = async () => {
      try {
        const { data, error } = await supabase
          .from("paginas_cms")
          .select("conteudo")
          .eq("slug", "politica-privacidade")
          .single();

        if (error) {
          console.error("Erro ao buscar conteúdo:", error);
        } else {
          setConteudo(data?.conteudo || "");
        }
      } catch (error) {
        console.error("Erro ao buscar conteúdo:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConteudo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Política de Privacidade</h1>
          </div>

          <Card>
            <CardContent className="p-8">
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : conteudo ? (
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: conteudo }}
                />
              ) : (
                <div className="prose prose-lg max-w-none">
                  <h2>Política de Privacidade da AVIBAQ</h2>
                  <p>A AVIBAQ - Associação de Pilotos e Empresas de Balonismo se compromete a proteger e respeitar sua privacidade.</p>
                  
                  <h3>Coleta de Informações</h3>
                  <p>Coletamos apenas as informações necessárias para o envio do nosso boletim meteorológico:</p>
                  <ul>
                    <li>Nome completo</li>
                    <li>Endereço de e-mail</li>
                    <li>Informação se é piloto (opcional)</li>
                  </ul>

                  <h3>Uso das Informações</h3>
                  <p>Suas informações são utilizadas exclusivamente para:</p>
                  <ul>
                    <li>Envio do boletim meteorológico diário</li>
                    <li>Comunicações relacionadas à segurança de voo</li>
                    <li>Gestão da lista de assinantes</li>
                  </ul>

                  <h3>Compartilhamento de Dados</h3>
                  <p>Não compartilhamos, vendemos ou cedemos suas informações pessoais a terceiros.</p>

                  <h3>Seus Direitos</h3>
                  <p>Você tem o direito de:</p>
                  <ul>
                    <li>Cancelar sua inscrição a qualquer momento</li>
                    <li>Solicitar a exclusão de seus dados</li>
                    <li>Atualizar suas informações</li>
                  </ul>

                  <h3>Contato</h3>
                  <p>Para questões sobre privacidade, entre em contato conosco através do e-mail: contato@avibaq.org</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PoliticaPrivacidade;
