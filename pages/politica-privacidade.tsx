import { useEffect, useState } from "react";
import { Header } from "../src/components/Layout/Header";
import { Card, CardContent } from "../src/components/ui/card";
import { supabase } from "../src/integrations/supabase/client";

const fallbackConteudo = `
<h2 id="quem-somos">1. Quem somos</h2>
<p>A <strong>AVIBAQ – Associação de Pilotos e Empresas de Balonismo</strong> (CNPJ XX.XXX.XXX/0001-XX), sediada em Praia Grande/SC, é responsável pelo site <strong>avibaq.org</strong> e pelos boletins meteorológicos divulgados aqui.</p>
<h2 id="quais-dados">2. Quais dados coletamos e por quê</h2>
<table>
  <thead>
    <tr><th>Categoria</th><th>Quando é coletado</th><th>Finalidade</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Nome</strong></td><td>Cadastro para receber boletim</td><td>Personalizar comunicação</td></tr>
    <tr><td><strong>E-mail</strong></td><td>Cadastro ou contato</td><td>Envio de boletins / respostas</td></tr>
    <tr><td><strong>Sou piloto?</strong></td><td>Check-box opcional</td><td>Segmentar mensagens</td></tr>
    <tr><td><strong>Logs de acesso (IP, navegador)</strong></td><td>Navegação</td><td>Segurança e estatísticas</td></tr>
    <tr><td><strong>Cookies essenciais</strong></td><td>Navegação</td><td>Manter sessão e preferências</td></tr>
    <tr><td><strong>Cookies analíticos</strong></td><td>Somente com consentimento</td><td>Métricas anônimas</td></tr>
  </tbody>
</table>
<p><em>Não coletamos dados sensíveis nem vendemos informações.</em></p>
<h2 id="base-legal">3. Base legal de tratamento</h2>
<table>
  <thead>
    <tr><th>Atividade</th><th>Base legal (LGPD)</th></tr>
  </thead>
  <tbody>
    <tr><td>Envio do boletim</td><td>Consentimento (art. 7º I)</td></tr>
    <tr><td>Resposta a contato</td><td>Execução de contrato (art. 7º V)</td></tr>
    <tr><td>Logs de segurança</td><td>Legítimo interesse (art. 7º IX)</td></tr>
  </tbody>
</table>
<h2 id="armazenamento">4. Armazenamento e proteção</h2>
<p>Dados hospedados na <strong>Supabase</strong> (UE) com criptografia em repouso; acesso restrito a administradores autenticados. Backups diários por 30 dias.</p>
<h2 id="compartilhamento">5. Compartilhamento</h2>
<table>
  <thead>
    <tr><th>Terceiro</th><th>Motivo</th><th>País</th></tr>
  </thead>
  <tbody>
    <tr><td>SendGrid</td><td>Envio de e-mails</td><td>EUA</td></tr>
    <tr><td>Supabase</td><td>Hospedagem & BD</td><td>UE</td></tr>
    <tr><td>Plausible (opt-in)</td><td>Analytics</td><td>UE</td></tr>
  </tbody>
</table>
<h2 id="direitos">6. Seus direitos</h2>
<p>Você pode confirmar, acessar, corrigir, portar ou excluir seus dados. Utilize <strong>privacidade@avibaq.org</strong>.</p>
<h2 id="retencao">7. Retenção</h2>
<table>
  <thead>
    <tr><th>Dado</th><th>Prazo</th><th>Exclusão</th></tr>
  </thead>
  <tbody>
    <tr><td>Nome/e-mail</td><td>Até opt-out</td><td>Imediata</td></tr>
    <tr><td>Backups</td><td>30 dias</td><td>Rotação</td></tr>
    <tr><td>Logs</td><td>6 meses</td><td>Rotação</td></tr>
  </tbody>
</table>
<h2 id="cookies">8. Cookies</h2>
<p>Essenciais (não desativáveis) e analíticos (opt-in no banner).</p>
<h2 id="criancas">9. Crianças e adolescentes</h2>
<p>Não direcionado a menores de 18 anos; dados identificados serão removidos.</p>
<h2 id="alteracoes">10. Alterações</h2>
<p>Publicaremos nova versão com data de revisão; avisaremos assinantes se houver mudanças substanciais.</p>
<h2 id="encarregado">11. Encarregado (DPO)</h2>
<div className="bg-gray-50 rounded-md p-4">
  <strong>Rafael Carvalho</strong> – <em>privacidade@avibaq.org</em> – Praia Grande/SC
</div>
`;

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
      <main className="max-w-3xl mx-auto px-4 py-10 prose prose-lg">
        <h1>Política de Privacidade – AVIBAQ</h1>
        <p><em>Versão 1.0 · Última atualização: 02 de julho de 2025</em></p>
        <hr />
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ) : conteudo ? (
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: conteudo }} />
        ) : (
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: fallbackConteudo }} />
        )}
      </main>
    </div>
  );
};

export default PoliticaPrivacidade;