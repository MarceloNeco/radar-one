/* Roda todos os testes do Eleições 2026 (Chromium/Playwright, só valores de mentira):
     1. idioma.js (F1-PR4: um HTML, dois idiomas: i18n/en.json cobre todo texto fixo da página; ?lang=en; preferência comum; index-en.html redireciona com o #)
     2. caracterizacao.js (voz do aparelho, provedores, 320 px) nas duas páginas
     3. voz-cofre.js (chaves no cofre) nas duas páginas
     4. colinha-interruptor.js (interruptor da Colinha do RootifyONE) nas duas páginas
     5. janelas.js (todas as janelas pela janela comum: trava de trás, ✕/Esc/Voltar/toque fora, "Descartar?", uma por vez) nas duas páginas, 390 px e computador
     6. cofre-protecao.js (com "cofre.proteger" ligado: PIN ao abrir e ao recarregar, trancar ao sair/esconder/sem uso, painel da digital) nas duas páginas
     7. calendario.js (calendário eleitoral: fases, horário de Brasília, fase forçada, 2º turno pelo TSE simulado, lista manual,
        cópia guardada e 1 ida ao TSE por hora, cola guardada fora do 2º turno) nas duas páginas
     8. cofre-entrada.js (2.5.1: abre sem PIN mesmo com chave de outro app; "cofre.proteger" no RootifyONE liga o PIN ao abrir;
        ▶ com voz da internet pede o PIN e "Agora não" segue com a voz do aparelho) nas duas páginas
     9. colinha-barra.js (2.5.2: barra da Colinha em uma linha só, até 60 px, Texto e Imprimir só com ícone até 480 px; 390 e 320 px, com e sem AssistONE) nas duas páginas
    10. dados-offline.js (F1-PR2: os dados vêm de dados/*.json; 2ª visita sem rede abre pela cópia guardada; sem cópia e sem rede avisa) nas duas páginas
    11. navegacao.js (F1-PR5: shell com os quatro destinos, barra de 44 px, Voltar por camada, 320 px sem rolagem lateral, barra lateral no computador) nas duas páginas
    12. saiba.js (F1-PR5c: o ⓘ abre a explicação pela janela comum; Entendi, Esc e Voltar fecham; créditos e ressalvas continuam lá; em inglês também)
    13. links-antigos.js (F1-PR6: cada # do app de 2026 abre a vista certa; com o interruptor "eleicoes" desligado, Hoje, Explorar e o ☰ ficam sem a eleição e o módulo não carrega; um link direto ainda abre)
   Uso: node teste/rodar.js   (precisa do Playwright: npm install -D playwright) */
const { spawnSync } = require('child_process');
const path = require('path');
let falhou = false;

for (const t of ['idioma.js', 'caracterizacao.js', 'voz-cofre.js', 'colinha-interruptor.js', 'janelas.js', 'cofre-protecao.js', 'calendario.js', 'cofre-entrada.js', 'colinha-barra.js', 'dados-offline.js', 'navegacao.js', 'saiba.js', 'links-antigos.js']) {
  console.log('\n▶ ' + t);
  if (spawnSync(process.execPath, [path.join(__dirname, t)], { stdio: 'inherit' }).status !== 0) falhou = true;
}
process.exit(falhou ? 1 : 0);
