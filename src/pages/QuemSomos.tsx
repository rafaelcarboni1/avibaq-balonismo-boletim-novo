
import { useEffect, useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const QuemSomos = () => {
  const [conteudo, setConteudo] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConteudo = async () => {
      try {
        const { data, error } = await supabase
          .from("paginas_cms")
          .select("conteudo")
          .eq("slug", "quem-somos")
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Quem Somos</h1>
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
              ) : (
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: conteudo }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default QuemSomos;
