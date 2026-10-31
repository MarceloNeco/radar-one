# Referências de produto (sites que o dono indicou)

Lidos em 31/10/2026 por um leitor automático (só a página inicial e a de metodologia; subpáginas não lidas estão listadas no fim).
Regra para todos: **copia-se a ideia e usam-se dados abertos; nunca o código, o desenho, os textos ou as notas de terceiros.**
Fontes oficiais continuam sendo as do `docs/fontes/registro-de-fontes.md`.

| Site | O que é | Onde entra no RadarONE | Fase |
|---|---|---|---|
| Ranking dos Políticos (ranking.org.br) | ranking de deputados e senadores com nota 0–10 | método de comparação de mandatos: composição da nota visível, filtros combinados, "última atualização" no topo; **sem nota única de pessoa** (ADR 0007 e regra das quatro camadas) | F3 (mandatos) |
| Em quem votar (em-quem-votar.onrender.com) | comparador de candidatos por afinidade de pautas, com cédula e acompanhamento | já é o modelo do nosso Congresso → afinidade e da Colinha; entra o "ordene as pautas antes de ver candidatos" e o consentimento explícito para favoritos | F1-PR6 (módulo Eleições) e F3 |
| Global Election Simulator (globalelectionsimulator.com) | simuladores de eleição no navegador para mais de 70 países, calendário, atlas de resultados | **ideia nova, fora da especificação**: simulador de eleição e calendário/resultados; ver proposta de escopo abaixo (pendência 23) | decisão do dono |

## 1. Ranking dos Políticos

- **O que é.** Organização que pontua deputados federais e senadores desde 2011 ("independente", mantida desde 30/10/2026 pela Agência Nabuco, segundo o próprio site; a metodologia diz "não somos imparciais"). Feito pela Olivas; Next.js com login e notificações (tem servidor).
- **Funções.** Ranking (Câmara/Senado, partido, UF, acumulado ou por ano), Partidos, Estados, Parlamentar em Foco, Votações, Parlamentares Premiados; "Composição da pontuação" e "Notas por ano" expansíveis; "Meu Ranking" e "Comparar Parlamentares" exigem login. Sem exportação visível. "Última atualização: 27/07/2026".
- **Dados.** APIs da Câmara e do Senado (votações, gastos de gabinete, processos). 594 parlamentares.
- **Método publicado.** NOTA = [(V × 0,75) + (G × 0,1) + (PRE × 0,1) + (PRI × 0,05)] + [PL + AL] − [PRO]: votações até 7,5, gastos até 1, presença até 1, privilégios até 0,5, produção legislativa até 0,6, articulação até 0,4, cada condenação tira 0,5. Votações só entram com 70% de consenso do "Conselho de Leis"; a lista dessas votações não está publicada.
- **Direitos.** "© 2026 Ranking dos Políticos. Todos os direitos reservados"; sem licença de reuso. Nada deles pode ser copiado; os dados brutos são públicos e vêm das mesmas APIs que já usamos.
- **O que entra.** (1) Composição da nota e notas por ano em texto simples, com a fórmula e os pesos à vista (nosso `score.preset` configurável, T28). (2) Filtros combinados Câmara/Senado × partido × UF × ano, com entrada por estado. (3) Data da última atualização no topo (nosso `manifesto.json`). O que **não** entra: nota única por pessoa, bônus/penalidade escondidos e lista de votações escolhida por um conselho sem publicar (seção 11 da especificação: descrição, índice configurado, afinidade e integridade nunca se misturam).

## 2. Em quem votar

- **O que é.** Comparador para o eleitor de 2026 (senado, câmara federal e assembleia): "Não dizemos em quem votar." Autor não aparece no site. PWA instalável, hospedado no Render, conteúdo carregado por JavaScript (a lista de candidatos não pôde ser lida). Texto de pré-eleição ("Fase de campanha — temporária").
- **Funções.** Escolha o estado → ordene as pautas (↑/↓) → "Ver candidatos alinhados" ("Mais combinam % nas pautas" ou "Posição") → ficha com propostas, votos e notícias → ⇄ comparar, ★ favoritar, "Minha cédula" (2 senadores, 1 federal, 1 estadual), "Meu acompanhamento", "Resultado da eleição 2026" (em breve).
- **Dados.** TSE (candidaturas deferidas), Câmara e Senado; "tudo tem link para a fonte oficial"; sem periodicidade.
- **Método.** Afinidade pela ordem de importância dos temas ("todos os temas contam, do 1º ao último"); fórmula não publicada. "Sem mandato vinculado" para quem não tem histórico.
- **Direitos.** Sem termos nem licença visíveis; declara não receber de partido ou candidato e guardar dados só no aparelho.
- **O que entra.** Muito já existe no nosso Congresso (afinidade por eixos de votação, favoritos, comparação) e na Colinha (cédula por estado, aviso de conferir na urna). Novo: (1) ordenar as pautas por importância **antes** de ver os candidatos, com a explicação do % ao lado; (2) consentimento explícito antes de guardar favoritos e posições (dado sensível pela LGPD), que a nossa diretriz já pede; (3) a ficha juntando propostas, votos e notícias é o PersonCard + perfil de mandato da especificação (UX04, UX16–UX18). Cautela: afinidade ranqueada pode ser lida como recomendação de voto; nossa regra (ARQUITETURA, "nada de ranking") e o parecer de advogado da pendência 18 valem aqui.
- **Pergunta ao dono (pendência 24).** Este é o site dos seus amigos? Se for, vale perguntar a eles como calculam a afinidade e se querem trocar dados (as fontes são as mesmas); não copiamos nada sem conversar.

## 3. Global Election Simulator

- **O que é.** Projeto educacional gratuito de Leo Chang, com cerca de cem colaboradores: simuladores que rodam no navegador, sem conta, para mais de 70 países (Brasil incluído, entre os mais acessados). Público: estudantes, professores, jornalistas e pesquisadores. Atrás do Cloudflare; conteúdo em HTML (não depende de JavaScript para aparecer).
- **Funções.** Browse every simulator, Polling maps, Results atlas, Live and recent election results, Election calendar, Statistics, World leaders, Field guide library, Collections e "Our Record" (acurácia das próprias projeções). No simulador: sliders que distribuem o resultado cadeira a cadeira e um "run" que simula a noite eleitoral com apurações em lotes.
- **Dados.** "Baselines come from official sources, the national election commission or the certified count"; periodicidade não informada; sem API visível. Metodologia publicada em /methodology/ (não lida).
- **Direitos.** Termos, privacidade, disclaimer e política editorial existem (não lidos); sem licença de reuso visível. Partidos e políticos eleitos "endossaram" o projeto, segundo o site.
- **O que entra, como IDEIA.** (1) Simulação inteira no navegador, sem conta: cabe no nosso site sem servidor. (2) Rótulo "não verificado" em número sem fonte (nossa regra de `status` do MetricCard, T40). (3) Página pública medindo a acurácia das próprias projeções (nosso "Cobertura e fontes" + manifesto).
- **Proposta de escopo (para o dono decidir, pendência 23).** O site cobre 70 países com regras específicas de cada um; isso é grande demais para começar e nenhuma fonte global está no registro de fontes. Caminho em duas etapas:
  1. **Simulador de eleição brasileira**, dentro do módulo Eleições: a pessoa move os percentuais por partido e vê as cadeiras pela regra real (quociente eleitoral e sobras para deputados e vereadores; maioria e 2º turno para prefeito, governador e presidente), com os resultados oficiais do TSE como ponto de partida. Dado que já temos (TSE, `cola/`, `congresso/`); serve para 2026 (arquivo), 2028 (municipal) e 2030; sem fonte nova. Cabe na F3 ou numa F3b.
  2. **Eleições no mundo**: começar por calendário e resultados (não por simulação), com fontes a identificar e registrar (comissões eleitorais nacionais, bases abertas de calendário eleitoral), licença conferida uma a uma. Só depois, simuladores por sistema eleitoral (proporcional, distrital, misto), um por vez. Fase F5 ou posterior; exige onda própria no registro de fontes.
- **Cautelas.** Endosso de partidos numa plataforma que se diz neutra é algo que **não** copiamos; enquete de posicionamento político do leitor é dado sensível (nossa telemetria já exclui preferências políticas, UX44); projeção de resultado é opinião metodológica e precisa de página de método e de acurácia desde o primeiro dia.

## Não lido (para uma segunda passada, se o dono quiser)

ranking.org.br: quem somos, política de privacidade, votações, Manual da Metodologia (PDF no Google Drive). em-quem-votar: lista de candidatos, ficha, Minha cédula e resultado (carregados por JavaScript). globalelectionsimulator.com: methodology, terms, privacy, disclaimer, editorial policy, about, record e a página do Brasil.
