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
| Atualização | "última atualização" no topo (27/07/2026 em 31/10) | depende de uma API própria (backend no Render) | não informa | data do snapshot em todo cartão (`manifesto.json`); robôs diários sem servidor |
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

**O que é.** Página única (HTML de 136 KB com o programa dentro), PWA instalável, backend próprio no Render (`/candidatos?uf=`, `/candidatos/{id}`, `/eleitos?uf=`, `/noticias`, `/buscar`, `/consulta`, `/health`). Fontes: TSE (candidaturas deferidas), Câmara e Senado; deputados estaduais "nas próximas etapas". Texto é de campanha ("Fase de campanha — temporária"); "Quem ganhou no seu estado" ainda "em breve".

**Como funciona.** (1) Escolhe o estado. (2) Ordena **todas** as 8 pautas (Saúde, Educação, Segurança, Emprego e renda, Custo de vida, Meio ambiente, Direitos das pessoas, Fim da corrupção) e responde 5 posições com duas frases cada (ex.: Segurança: "mais policiamento e penas mais duras" × "prevenção social e direitos"). (3) Vê os candidatos ordenados por "% combina com você": a afinidade por pautas pesa mais a pauta do topo (peso 8, 7, 6…), e a posição (0 a 10, esquerda/direita) é comparada com a do **partido** do candidato; a média das duas vira o %. (4) Ficha com propostas, votos por tema e notícias; ⇄ compara lado a lado; ★ salva (pede "OK" antes, por ser dado sensível). (5) "Minha cédula" (2 senadores, 1 federal, 1 estadual) e, depois da eleição, "Acompanhe os eleitos". Tour de 3 passos em cada tela. Separa "atuação real" (mandato) de "plano/campanha" (promessa) e nunca mostra 0 para quem não tem mandato.

**O que entra.** Ordenar pautas antes de ver pessoas; o % sempre acompanhado de "por quê" (quais pautas e votos); "OK" explícito antes de guardar favoritos; tour de 3 passos; atuação × promessa separadas com rótulo; cédula por estado (a Colinha já faz); favoritos que viram painel de acompanhamento (Salvos). **Cautela:** afinidade com a posição do **partido** é atalho que pode errar para a pessoa; no RadarONE a afinidade usa votos nominais da própria pessoa (T31), e partido só quando não há voto. **Pergunta ao dono (pendência 24):** é o site dos seus amigos? Se for, vale conversar antes de reaproveitar o método.

## 3. Global Election Simulator (globalelectionsimulator.com)

**O que é.** Projeto educacional gratuito (Leo Chang e cerca de cem colaboradores), sem conta, no navegador: simuladores para mais de 70 países, mapas de pesquisas, atlas de resultados, resultados ao vivo, calendário eleitoral, estatísticas, líderes mundiais, guias e "Our Record" (acurácia das próprias projeções). Baselines "de fontes oficiais, a comissão eleitoral nacional ou a apuração certificada". Atrás do Cloudflare; conteúdo em HTML.

**O que entra, como ideia.** Simulação no navegador sem conta; rótulo "não verificado" em número sem fonte; página pública de acurácia; calendário eleitoral como dado. (Detalhes das páginas internas: ver seção "Leitura das páginas internas" no fim, quando disponível.)

**Proposta de escopo (pendência 23).** (1) **Simulador de eleição brasileira** dentro do módulo Eleições: a pessoa move os percentuais por partido e vê as cadeiras pela regra real (quociente eleitoral e sobras; maioria e 2º turno), partindo do resultado oficial do TSE; serve para 2028 e 2030; dados que já temos; F3 ou F3b. (2) **Eleições no mundo**: começar por calendário e resultados, com fontes e licenças registradas uma a uma; simuladores por país só depois; F5 ou posterior.

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

Ranking: páginas 2+ do ranking, "Composição da pontuação" expandida, relatórios anuais. Em quem votar: respostas da API (lista de candidatos, ficha, eleitos) e o cálculo do servidor; só o código da página foi lido. Global Election Simulator: páginas internas em leitura (seção a completar).
