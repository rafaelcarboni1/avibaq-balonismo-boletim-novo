import { Header } from "../src/components/Layout/Header";

export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-10">
        <article
          id="about-body"
          className="prose prose-slate max-w-4xl mx-auto px-4 sm:px-0 space-y-6 [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:mt-8 [&_h3]:mb-3"
        >
          <h1 className="text-center">Quem Somos</h1>
          <h3>Nossa História</h3>
          <p>Fundada em <strong>2021</strong>, a <strong>AVIBAQ – Associação de Pilotos e Empresas de Balonismo de Praia Grande/SC</strong> nasceu da união de pilotos, instrutores e operadores de balões que atuam no principal polo de balonismo do Sul do Brasil. O objetivo era criar um canal oficial para divulgar boletins meteorológicos confiáveis, dialogar com o poder público municipal e padronizar procedimentos de segurança para todos os voos na região.</p>
          <h3>Missão</h3>
          <blockquote>
            <strong>Promover a segurança e a excelência do balonismo em Praia Grande/SC, fornecendo informação técnica de qualidade, <em>implementando regras e protocolos de segurança cada vez mais aprimorados</em> e representando os interesses coletivos de pilotos e empresas.</strong>
          </blockquote>
          <h3>Visão</h3>
          <p>Ser reconhecida, até 2030, como a principal referência regional em padronização operacional, treinamento e divulgação de informações meteorológicas para o voo de balão.</p>
          <h3>Valores</h3>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Valor</th><th>O que significa para nós</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>Segurança</strong></td><td>Nenhum voo vale um risco desnecessário.</td></tr>
                <tr><td><strong>Transparência</strong></td><td>Boletins e decisões sempre publicados de forma pública e justificada.</td></tr>
                <tr><td><strong>Colaboração</strong></td><td>Pilotos, meteorologistas e poder público trabalhando juntos.</td></tr>
                <tr><td><strong>Sustentabilidade</strong></td><td>Operar com respeito ao meio ambiente e às comunidades sobrevoadas.</td></tr>
              </tbody>
            </table>
          </div>
          <h3>O que fazemos</h3>
          <ul>
            <li><strong>Boletim Meteorológico Diário</strong> – publicado às 19h com bandeira Verde, Amarela ou Vermelha, válido exclusivamente para Praia Grande/SC e entorno.</li>
            <li><strong>Comissão de Meteorologia e Segurança</strong> – grupo de especialistas que analisa dados de vento, visibilidade e teto de nuvem na região.</li>
            <li><strong>Treinamentos</strong> – workshops semestrais de segurança operacional, meteorologia aplicada e legislação aeronáutica.</li>
            <li><strong>Protocolos de Segurança</strong> – desenvolvimento contínuo de SOPs, check-lists e regras operacionais alinhados às melhores práticas internacionais de balonismo.</li>
            <li><strong>Representação Setorial</strong> – diálogo com Prefeitura, Defesa Civil, imprensa, ANAC e órgãos de turismo locais.</li>
          </ul>
          <h3>Estrutura Organizacional</h3>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Cargo</th><th>Responsável</th></tr>
              </thead>
              <tbody>
                <tr><td>Presidente</td><td><strong>Murilo Gonçalves</strong></td></tr>
                <tr><td>Vice-Presidente</td><td><strong>João Vitor dos Santos Justo</strong></td></tr>
                <tr><td>Secretário</td><td><strong>Gabriel Ramos</strong></td></tr>
                <tr><td>Vice Secretário</td><td><strong>João Paulo</strong></td></tr>
                <tr><td>Tesoureiro</td><td><strong>Daniel Zeferino Carlos</strong></td></tr>
                <tr><td>Vice Tesoureiro</td><td><strong>Rodrigo Peretto</strong></td></tr>
                <tr><td>Conselho Fiscal 1</td><td>Gabriel Rocha</td></tr>
                <tr><td>Conselho Fiscal 2</td><td>Rafael Cirimbelli da Luz</td></tr>
              </tbody>
            </table>
          </div>
          <h3>Associe-se</h3>
          <p>Pilotos comerciais, instrutores e empresas de balonismo que operam em Praia Grande/SC podem solicitar filiação enviando e-mail para <strong>contato@avibaq.org</strong>. Os associados têm acesso a treinamentos exclusivos, material didático e participação nas reuniões da entidade.</p>
          <h3>Contato</h3>
          <ul>
            <li><strong>E-mail geral:</strong> contato@avibaq.org</li>
            <li><strong>Telefone/WhatsApp:</strong> (48) 99985-1133</li>
            <li><strong>Endereço:</strong> Praia Grande/SC – 88990-000</li>
          </ul>
        </article>
      </main>
    </div>
  );
}
