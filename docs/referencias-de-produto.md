# Benchmark das referências (Ranking dos Políticos, Em quem votar, Global Election Simulator)

Lidos em 31/10/2026: o site inteiro do Ranking (inclusive o Manual da Metodologia, edição 1/2026, PDF de 4,4 MB), o código
da página do Em quem votar (um só HTML com o programa dentro) e as páginas do Global Election Simulator.
**Regra:** copiamos ideias e usamos dados abertos; nunca código, desenho, textos ou notas de terceiros.

## O que o dono pediu (31/10/2026), em cinco frases

1. O objetivo agora é **acompanhar nossos governantes e políticos**; a eleição é um momento, não o produto.
2. **Agnóstico e dinâmico**: a próxima eleição (prefeitura em 2028, geral em 2030) entra por configuração, não por código novo.
3. A eleição de 2026 **não se perde**: fica guardada, escondida e desligada, acessível de forma discreta, com **resultado e apuração** (quantos votos cada um teve).
4. **Acesso livre**: entra e sai navegando, sem cadastro; cadastro só se a pessoa quiser (favoritos na nuvem, avisos); nunca pagamento. Configurações de administrador ficam no RootifyONE, não no site.
5. **Linguagem de leigo** e segurança de base (AppSec, aguentar todo mundo entrando de uma vez), sem atrapalhar a experiência.

Como isso se traduz: site estático no GitHub Pages atrás do Cloudflare (aguenta pico, não tem servidor para derrubar nem senha para
vazar), dados em arquivos públicos, nada do leitor sai do aparelho sem ele pedir, interruptores e calendário no RootifyONE.

## Tabela comparativa

| Função | Ranking dos Políticos | Em quem votar | Global Election Simulator | RadarONE (o que entra e onde) |
|---|---|---|---|---|
| Quem acompanha | 594 deputados e senadores em exercício | candidatos de 2026 a senador, deputado federal e estadual | eleições de mais de 70 países | deputados, senadores e presidente desde já (dados que já temos); governadores, prefeitos e vereadores por onda (F3/F5) |
| Como a pessoa escolhe | filtros Câmara/Senado, partido, UF, ano; busca | escolhe o estado, ordena 8 pautas, responde 5 posições; busca | lista por país; calendário | Explorar: busca por nome, partido, UF, cargo e tema; favoritos ★ (já existem no Congresso) |
| Nota ou afinidade | nota única 0–10 (fórmula fixa, votações escolhidas por conselho) | "% combina com você": média entre afinidade por pautas (peso maior para a pauta no topo) e distância de posição (5 perguntas esquerda/direita) | não avalia pessoas; simula resultados | **sem nota única**: descrição (presença, gastos, votos, produção) em colunas; afinidade só com as pautas que a pessoa escolheu, explicada ao lado; índice configurado só se o leitor ligar (`scores`, F3) |
| Ficha da pessoa | biografia, alinhamento ao governo (%), fidelidade partidária (%), proposições, votos, frentes, comissões, despesas por mês, bens, histórico eleitoral, "Reportar erro" | propostas, votos por tema, notícias, "atuação real" × "plano de campanha" separados | perfil de líderes mundiais | perfil de mandato (PersonCard + termos): mesmos blocos do Ranking, cada um com fonte e data; "atuação" nunca se mistura com "promessa" (ideia do Em quem votar); contestação com protocolo (T44) |
| Depois da eleição | continua (é o foco deles) | "seus favoritos viram um painel para acompanhar o mandato" (em breve no site deles) | resultados e atlas | Salvos: favoritos viram painel com novidades (votações novas, promessas × entregas); já existe o embrião em Congresso → Mandato |
| Eleição | histórico eleitoral na ficha (votos, "eleito por média") | cédula, afinidade, "quem ganhou no seu estado" | simulador cadeira a cadeira, noite eleitoral, calendário | módulo Eleições guardado (interruptor + fase "acompanhamento"); **novo:** tela "Resultado e apuração" por cargo e lugar, lida dos arquivos do TSE que o app já usa (pendência 25) |
| Atualização | "última atualização" no topo (27/07/2026 em 31/10) | não informa na página | não informa | data do snapshot em todo cartão (`manifesto.json`); robôs diários sem servidor |
| Cadastro | login para "Meu Ranking" e "Comparar" | nenhum; favoritos só no aparelho, com "OK" explícito (LGPD) | nenhum | nenhum para navegar; favoritos no aparelho; conta SolverONE opcional (futuro) para sincronizar e receber avisos |
| Explicação | manual em PDF; fórmula na página | tour em 3 passos na home e 3 na eleição; frases de uma linha | metodologia em página própria | "Como ler" de uma frase em cada cartão + tour do AssistONE; sem texto longo |

## 1. Ranking dos Políticos (ranking.org.br)

**O que é.** Organização desde 2011 (Olivas; mantenedora Agência Nabuco desde 30/10/2026), site Next.js com login. Telas: Ranking (políticos, partidos, estados; acumulado ou por ano), Votações, Parlamentar em Foco, Premiados, Notas Técnicas, perfil individual. "Última atualização: 27/07/2026".

**Método (Manual ed. 1/2026).** NOTA = [(V×0,75)+(G×0,1)+(PRE×0,1)+(PRI×0,05)] + [PL+AL] − [PRO], entre 0 e 10.
- Votações: só as escolhidas pelo Conselho de Leis (70% de consenso), com peso por importância: 10, 8, 6, 4 ou 2 pontos; destaques e emendas valem 1/3; voto alinhado = pontuação cheia, abstenção ou falta justificada = metade, contrário ou ausente = 0; V = soma obtida ÷ soma máxima × 10.
- Gastos: G = (1 − gasto acumulado ÷ cota acumulada) × 10, com a cota mensal por UF (ex.: deputado de SP R$ 48.727,46; senador de SP R$ 42.837,33); gasto ≥ cota = 0; sem gasto = 10.
- Presença: PRE = presenças ÷ sessões deliberativas × 10; falta justificada conta como presença.
- Privilégios: PRI = 10 − 2,5 × n, para passaporte diplomático de familiares, auxílio-mudança de reeleito, auxílio-moradia e aposentadoria especial.
- Produção: +0,1 por projeto ou relatoria aprovados e validados pelo conselho, até 0,6. Articulação: líder de bancada 0,2; mesa diretora 0,1; presidente de comissão ou frente 0,05 a 0,2 pelo "grau de influência"; até 0,4. Processos: −0,5 por condenação definitiva, teto de 5.
- Regras: suplente só após 6 meses; presidentes das Casas ficam de fora; nota acumulada = média simples das anuais (confere nos exemplos); nota de partido e de estado = média dos membros.

**O que entra no RadarONE.** As fórmulas de presença, cota (com o teto por UF e cargo) e privilégios são boas definições de **métrica descritiva** e batem com a seção 12 da nossa especificação (presença elegível, uso e economia de cota, L por UF). Entram como colunas com fonte e cálculo publicados, nunca somadas numa nota. "Composição" visível, "Notas por ano" vira "série por ano" de cada métrica. Ficha com os mesmos blocos, cada um com link oficial e data. Partido e estado: mostrar média **e** quantas pessoas, com aviso para grupos pequenos (nossa `cobertura.minima`).

**O que não entra.** Nota única e ranking de pessoas; votações escolhidas por um conselho sem lista pública; condenação virando desconto automático (nossa regra: ocorrência com documento, número do processo e revisão humana, T27); "alinhamento ao governo" sem definição publicada.

## 2. Em quem votar (em-quem-votar.onrender.com)

**O que é.** Site brasileiro de apoio à escolha de candidatos nas eleições de 2026, com dados públicos do TSE, da Câmara e do Senado. Referência indicada pelo dono; aqui entram só ideias e fluxos, nunca código, visual ou texto.

**Como funciona, visto como visitante.** (1) A pessoa escolhe o estado. (2) Ordena os temas que mais importam para ela e responde algumas posições. (3) Vê os candidatos ordenados por afinidade, com o porquê. (4) Abre a ficha (propostas, votos por tema, notícias), compara lado a lado e salva favoritos (com um "OK" explícito antes). (5) Monta a cédula do seu estado e, depois da eleição, acompanha os eleitos. Tour curto em cada tela; atuação no mandato e promessa de campanha aparecem separadas, com rótulo.

**O que entra, como ideia (com crédito).** Ordenar temas antes de ver pessoas; o % sempre acompanhado de "por quê" (quais temas e votos); "OK" explícito antes de guardar favoritos; tour de 3 passos; atuação × promessa separadas com rótulo; cédula por estado (a Colinha já faz); favoritos que viram painel de acompanhamento (Salvos). No RadarONE a afinidade usa os votos nominais da própria pessoa (T31), e partido só quando não há voto.

## 3. Global Election Simulator (globalelectionsimulator.com)

**O que é.** Projeto educacional gratuito de uma pessoa (Leo Chang), sem conta, sem plano pago, pago por anúncios (Google AdSense) e com Google Analytics; simuladores no navegador para mais de 70 países, 971 guias "How X elects its Y" (PDF livre para professores), mapas de pesquisas (39 séries, 51 parlamentos, ~23 mil pesquisas desde 2010, atualizados uma vez por semana), calendário (dentro dos mapas de pesquisa), resultados ao vivo "só do órgão que contou os votos", atlas de 42 mapas para pintar cadeiras e a página "Our Record" com a acurácia das próprias projeções (10 casos, erro médio 1,2 ponto; Brasil 0,71). Lema: "Nothing here is a forecast"; cada guia é conferido contra o resultado oficial certificado, no menor nível publicado.

**Como calcula (página de metodologia).** Base = último resultado certificado por unidade; oscilação uniforme (s' = s + (S' − S)); cadeiras por D'Hondt, Sainte-Laguë (puro ou modificado 1,4), quota Hare ou Droop e cláusulas de barreira; 2º turno por transferência dos eliminados por proximidade; o código tem de reproduzir o resultado oficial partido a partido antes de publicar. Média de pesquisas: data pelo fim do campo, janela de ~3 semanas, "uma casa, um voto", amostra não pesa, partido não perguntado fica ausente.

**O simulador do Brasil.** Só presidente (1989 a 2026 como bases; Câmara e Senado têm guias próprios). Por UF, um controle deslizante por candidato com % e votos; nada muda até "Project Result"; mover a UF move os municípios dela; "Swing" por candidato; mapas por UF e por município (5.571), bolhas pela margem, setas de oscilação 2018→2022→2026, "Scoreboard" com cartões, "Demographics" com 10 recortes do Censo 2022; "noite eleitoral" com as UFs entrando em lotes na ordem real da apuração de 2022 (Centro-Oeste 104 min até a metade, Nordeste 167). Base 2026: 1º turno apurado pelo TSE em 499.248 seções (Flávio Bolsonaro 47,03%, Lula 45,16%); a projeção do 2º turno mistura taxas de transferência, pesquisas, mercados de aposta e um "nível escolhido pelo dono" (declarado na página). Fontes: TSE (2022 e 2026 por município), transcrições do TSE por UF para 1994–2018, 13 institutos registrados no TSE, Censo 2022.

**Termos e direitos.** Uso "for any lawful purpose", inclusive aula, notícia e trabalho pago, sem pedir; atribuição "apreciada, não exigida", exceto quando um cenário possa ser confundido com resultado real; proibido apresentar simulação como resultado real ou certificado e republicar as bases inteiras como se fossem próprias. Isso vale para as ideias e para citar; os dados do TSE e do IBGE nós pegamos na origem (licença CC-BY do TSE já conferida).

**O que entra, como ideia.** (1) Tudo no navegador, sem conta, sem servidor: igual ao nosso modelo. (2) Rótulos "simulação" e "não verificado" em todo número sem fonte (nosso `status` do MetricCard). (3) "Our Record": projeção guardada com data e hash **antes** da votação, erro publicado depois (fica para quando houver projeção; no começo não há). (4) Noite eleitoral simulada com lotes na ordem real da apuração: bonita e barata; só com rótulo claro. (5) Calendário eleitoral como lista com data e situação, sem data inventada ("eleição devida, ainda não convocada"). (6) Mapa por UF antes de município (arquivo municipal pesa). **Cautelas:** nível "escolhido pelo dono" dentro de um modelo é o que a nossa especificação proíbe (julgamento editorial fora da fórmula, versionado e explicado); anúncios e Google Analytics ficam fora (nossa telemetria só com consentimento e sem preferência política).

**Proposta de escopo (pendência 23).** (1) **Simulador de eleição brasileira** no módulo Eleições: controles por candidato ou partido, "Projetar" explícito, oscilação, resultado por UF e noite eleitoral em lotes; regras reais (maioria e 2º turno para Executivo; quociente eleitoral e sobras para Câmara, assembleias e câmaras municipais, que é a quota Hare com maiores médias); base = resultado oficial do TSE que já temos; teste que reproduz o resultado oficial antes de publicar (ideia deles, igual ao nosso harness). Serve para 2028 e 2030 sem código novo; F3 ou F3b. (2) **Eleições no mundo**: calendário e resultados primeiro, fontes e licenças uma a uma (as deles são transcrições e comissões nacionais, sem API), F5 ou depois.

## Mapa de telas do RadarONE em linguagem simples (para a F1)

- **Hoje**: "o que mudou" dos seus favoritos (votações novas, promessas com andamento), atalhos "Comece por um nome, tema ou estado". Se houver eleição em curso, um cartão discreto "Eleição 2028 · 1º turno em 1º de outubro" leva ao módulo.
- **Explorar**: pessoas (busca por nome, cargo, partido, estado), temas, promessas e checagens quando ligados. Cada pessoa com 2 ou 3 fatos e os botões ★ salvar e ⇄ comparar.
- **Indicadores**: os 43 infográficos e os comparadores de hoje, iguais.
- **Salvos**: seus favoritos e painéis, só no aparelho; "Guardar favoritos revela sua preferência: fica só aqui, pode apagar quando quiser".
- **Eleições** (fora da barra, no ☰ e por link): arquivo de 2026 com Colinha congelada, planos, Congresso → afinidade, **Resultado e apuração** (votos por candidato e por lugar, 1º e 2º turno, fonte TSE com data) e, quando houver, o simulador. Religa sozinho na próxima eleição pelo calendário (ADR 0010).
- **Regras de texto**: título curto, uma frase de contexto, uma ação; "Como ler" em uma frase; sem parágrafo de explicação na tela principal (diretriz "Linguagem para leigos").

## Acesso, cadastro e segurança (princípios que valem para todo PR)

- Navegar nunca exige cadastro, login ou chave. Cadastro é opcional e só para o que precisa dele (sincronizar favoritos entre aparelhos, avisos); nunca pagamento.
- Administrador não existe no site: interruptores, fases, cadência e conteúdo editorial ficam no RootifyONE (requisito 1 do dono); o site só lê arquivos publicados.
- Segurança de base: site estático (sem servidor para invadir), Cloudflare na frente (conferir se o proxy está ligado para o domínio: protege de pico e abuso de graça), nenhum script de terceiros, `Content-Security-Policy` (pendência 13), nenhum segredo no código, dados do leitor só no aparelho, telemetria sem preferência política (UX44). Revisão de segurança (skill `seguranca-lgpd-gdpr`) antes do fim da F1 (pendência 26).

## Não lido

Ranking: páginas 2+ do ranking, "Composição da pontuação" expandida, relatórios anuais. Em quem votar: só o que a página mostra a qualquer visitante. Global Election Simulator: guias da Câmara e do Senado (/brazil-legislative/, /brazil-senate/), /history/, página de fontes, repositório no GitHub; 23% do texto do simulador do Brasil e a maior parte do índice de 971 guias vieram só resumidos.
