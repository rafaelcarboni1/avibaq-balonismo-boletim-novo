Documento-guia – Módulo para implementação do “Registro de Voos” da AVIBAQ

1 · Propósito
Criar, no site da AVIBAQ, um sistema único de registro de voos que:

abranja o planejamento feito no dia anterior (as empresas e pilotos que irão voar no próximo dia devem aparecer na home do site publicamente com algumas informacoes),

obrigue o preenchimento dos três blocos do Checklist oficial da AVIBAQ,

permita concluir o pós-voo com dados técnicos e anexos,

funcione mesmo sem internet (PWA com sincronização posterior),

envie lembrete diário às 19 h para quem pretende voar na manhã ou tarde seguintes,

garanta que agências possam vincular pilotos sem duplicar dados,

armazene, se desejado, imagens ou PDF dos formulários assinados pelos passageiros.

A empresa ou piloto só poderá realizar acessar ao dashboard se estiver em dia na mensalidade com a associação (que será cobrada todo dia 01 de cada mês)

2 · Perfis e painéis de acesso
Piloto individual → /piloto
Agência / operadora → /agencia
Admin · Tesoureiro · Equipe Meteo → /admin
(O administrador pode conceder menus extras, por usuário, como “ver boletins” ou “ver associados”. Quando ativada, a permissão faz o menu aparecer apenas para quem recebeu o privilégio.)

3 · Cadastros prévios indispensáveis
Balões – cada registro contém prefixo, volume em m³ e nome de batismo (opcional). Pilotos mantêm os seus; agências mantêm a frota.

Vínculo agência ⇄ piloto – a agência convida pelo nome email do piloto, o piloto aceita no próprio painel; depois disso a agência poderá escolhê-lo nos voos.

4 · Fluxo completo de um voo
4.1 Cadastro básico (rascunho) – realizado até 22 h do dia anterior
Dados solicitados: data, período (manhã ou tarde), horário previsto, local de decolagem previsto, balão (ou vários balões) e piloto (se for agência), número previsto de adultos e crianças por balão. O rascunho pode ser editado até o primeiro checklist.

4.2 Lembrete diário às 19 h
E-mail automático: “Você vai voar amanhã? Clique para registrar. O cadastro deve ser enviado até 1 h antes do horário previsto.”

4.3 Check-lists em campo (três blocos íntegros do PDF AVIBAQ)
Para cada item NÃO marcado, o piloto deve registrar um Motivo da não marcação antes de prosseguir.

Bloco 1 – Antes do tombamento do cesto
Verificação de fixação e estrutura do queimador e tanques.
Verificar os cabos/mosquetões do cesto.
Verificar fitas de tanques bem ajustadas e presas; manter a presilha num local de acesso fácil para remoção rápida.
Verificar válvulas do suspiro cheias.
Garantir mangueiras com folgas para manobra necessária no queimador.
Verificar mangueiras fora da borda do cesto ou em local não apropriado.
Confirmar registros dos tanques devidamente fechados (linha líquida e linha vapor).
Verificar todas as conexões entre queimador e tanques bem fixadas e sem vazamento.
Caso exista tanque auxiliar para inflagem, mantê-lo dentro do cockpit devidamente fixado.
Verificar pressão do extintor 1 (ponteiro no verde).
Verificar pressão do extintor 2 (ponteiro no verde).
Conferir kit de primeiros socorros completo.
Fazer primeiro acionamento do queimador (teste).
Esgotar (esvaziar) todo o sistema de gás após o teste.

Bloco 2 – Após tombamento do cesto para conexão com envelope
Conectar ancoragem em ponto fixo e resistente do veículo (preferir parte frontal, não carreta).
Usar sistema de desengate rápido apropriado ao tamanho do balão.
Inspecionar cabos do envelope íntegros, sem desfiados, dobras ou entrelaço.
Conectar cabos de forma ordenada, um de cada vez, revisando o anterior, iniciar pelos inferiores centrais.
Garantir mosquetões fechados com meia volta aberta para não travar.
Esticar o envelope no chão para checar integridade do tecido.
Posicionar ventiladores, travar rodas; puxar cordinha para verificar rotação livre das pás.
Colocar cone de segurança delimitando a área.
Acionar ventiladores; atenção a cadarços, rádios, cachecóis.
Orientar equipe de boca sobre cuidados, rajadas e procedimento de desligamento rápido a comando do piloto.
Entrar no envelope, fechar tap, desobstruir cabos e cordins nas roldanas.
Organizar e fixar cabos de tap e janelas de rotação no quadro ou cockpit.
Aguardar inflagem de pelo menos 75 % do envelope antes de começar a aquecer.

Bloco 3 – Após o balão em pé
Rever conexões bem apertadas e posicionadas.
Verificar itens obrigatórios na mala de voo: água, manta anti-chama, luvas de couro, acendedores alternativos, canivete ou faca, alicate.
Instalar instrumentos de voo.
Chamar passageiros para embarque.
Apresentar piloto e equipamento.
Confirmar com todos os passageiros que entenderam a experiência.
Repetir treinamento da posição de pouso (costas para o scoop, pernas flexionadas, mãos nas alças).
Informar na frequência 142.210 MHz a decolagem da aeronave, identificando o piloto no comando.
Verificar condições de vento; abortar se ultrapassarem limite.

Conclusão do terceiro bloco muda o voo para CHECKLIST CONCLUÍDO.

4.4 Pós-voo
Registrar adultos e crianças efetivamente transportados, local de pouso, duração em minutos, altitude máxima e observações.
Anexar, opcionalmente: track-log ou print do app de navegação (PDF/JPG/PNG), até três fotos e imagens ou PDF dos regulamentos assinados.
Salvar ➜ estado FINALIZADO.

4.5 Cancelamento (piloto OU agência, irreversível)
O botão “Cancelar voo” fica disponível enquanto o voo não estiver finalizado.
Escolher motivo (vento, chuva, teto baixo, problema técnico, passageiros ausentes).
Registrar observação livre.
Estado muda para CANCELADO. Um voo cancelado nunca é reativado; se a operação depois ocorrer deve ser criado novo voo.

5 · Modo off-line (PWA)
Todo formulário funciona sem internet: salva no aparelho, exibe selo “Dados salvos off-line – serão enviados assim que houver conexão” e sincroniza automaticamente ao reconectar.

6 · Dashboard e visual
Deve seguir o mesmo padrão que foi implementado da Magic UI nas areas de administração e piloto.
Use o MCP da Magic UI para criar o dashboard mantendo padrao.
Cartões KPI de borda suave com ícone pastel.
Coluna “Atividades recentes” e gráfico de barras verde.
Layout responsivo, grade 2 × 2 em celular.

7 · Cronograma macro de fases (nenhum código ainda)
Fase 0 – Levantamento das tabelas atuais (MCP, sem alterações).
Fase 1 – Scripts SQL de voos, anexos, balões, convites, vínculos em ambiente de teste.
Fase 2 – Menu “Meus Balões”.
Fase 3 – Fluxo de convite/aceite de pilotos.
Fase 4 – Formulário Dia-1 com múltiplos balões e passageiros previstos.
Fase 5 – Wizard dos três blocos de checklist com motivo obrigatório.
Fase 6 – Formulário pós-voo + anexos (track-log, fotos, regulamentos).
Fase 7 – Modo PWA off-line e sincronização.
Fase 8 – Dashboards KPI.
Fase 9 – E-mail diário às 19 h.
Fase 10 – Tela de edição de permissões extras no painel Admin.
Fase 11 – Aplicar o novo tema visual aos painéis administrativos.

Cada fase só será aplicada ao banco após consulta via MCP e aprovação sua, seguindo as boas práticas combinadas.