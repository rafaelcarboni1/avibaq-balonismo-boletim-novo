import { useEffect, useState } from "react";
import { Header } from "../src/components/Layout/Header";
import { Card, CardContent } from "../src/components/ui/card";
import { supabase } from "../src/integrations/supabase/client";

const Acessibilidade = () => {
  const [conteudo, setConteudo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConteudo = async () => {
      try {
        const { data, error } = await supabase
          .from("paginas_cms")
          .select("conteudo")
          .eq("slug", "acessibilidade")
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Acessibilidade</h1>
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
                  <h2>Compromisso com a Acessibilidade</h2>
                  <p>A AVIBAQ está comprometida em tornar nosso site acessível a todos os usuários, incluindo pessoas com deficiência.</p>
                  <h3>Recursos de Acessibilidade</h3>
                  <p>Nosso site foi desenvolvido seguindo as diretrizes de acessibilidade web (WCAG 2.1) e inclui:</p>
                  <ul>
                    <li>Navegação por teclado</li>
                    <li>Alto contraste de cores</li>
                    <li>Textos alternativos para imagens</li>
                    <li>Estrutura semântica adequada</li>
                    <li>Compatibilidade com leitores de tela</li>
                  </ul>
                  <h3>Atalhos de Teclado</h3>
                  <ul>
                    <li><strong>Tab:</strong> Navegar pelos elementos</li>
                    <li><strong>Enter/Espaço:</strong> Ativar botões e links</li>
                    <li><strong>Esc:</strong> Fechar modais e menus</li>
                  </ul>
                  <h3>Feedback e Sugestões</h3>
                  <p>Se você encontrar barreiras de acessibilidade em nosso site ou tiver sugestões de melhoria, entre em contato conosco:</p>
                  <ul>
                    <li>E-mail: acessibilidade@avibaq.org</li>
                    <li>Telefone: (11) 9999-9999</li>
                  </ul>
                  <h3>Melhoria Contínua</h3>
                  <p>Estamos constantemente trabalhando para melhorar a acessibilidade de nosso site e valorizamos seu feedback para tornar nossa plataforma mais inclusiva.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Acessibilidade;