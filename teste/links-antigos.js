/* Teste dos links antigos (ADR 0009) e do interruptor "eleicoes" (F1-PR6), nas DUAS páginas:
     - cada rota # do app de 2026 abre a vista certa: telas, partes do Congresso, infográfico por âncora (#g-…), comparadores
     - com o interruptor "eleicoes" do RootifyONE desligado: Hoje fica sem o cartão da eleição, Explorar e Salvos sem os atalhos
       da eleição, o ☰ sem o grupo "Eleições 2026", e o módulo (CongressoV2) não é carregado; um link direto (#hub) ainda abre,
       carregando o módulo na hora; nenhum infográfico some
   Uso: node teste/links-antigos.js */
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const fs = require('fs'), path = require('path');
const PORTA = process.env.PORTA || 8100, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const PREFS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 };
const ig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dados/ig.json'), 'utf8'));
const slugG = t => 'g-' + t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 44);
const g1 = slugG(ig.graficos[0].titulo), gN = slugG(ig.graficos[ig.graficos.length - 1].titulo);
const ROTAS = [
  ['#inicio', 'v-inicio'], ['#historico', 'v-historico'], ['#infograficos', 'v-infograficos'], ['#macrotemas', 'v-macrotemas'],
  ['#score', 'v-score'], ['#mandato', 'v-mandato'], ['#documentos', 'v-documentos'], ['#metodo', 'v-metodo'], ['#glossario', 'v-glossario'],
  ['#hub', 'v-hub'], ['#colinha', 'v-hub|v-colinha'], ['#congresso', 'v-congresso'], ['#congresso/afinidade', 'v-congresso'],
  ['#congresso/favoritos', 'v-congresso'], ['#congresso/comparar', 'v-congresso'], ['#congresso/metodo', 'v-congresso'], ['#congresso/mandato', 'v-congresso'],
  ['#' + g1, 'v-infograficos', g1], ['#' + gN, 'v-infograficos', gN], ['#g-sobrepor', 'v-infograficos', 'g-sobrepor'], ['#g-marcos-comp', 'v-infograficos', 'g-marcos-comp'], ['#ig-indice', 'v-infograficos', 'ig-indice']
];

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  for (const [arq] of PAGINAS) {
    const L = arq + ': ';
    const ctx = await novoContexto(browser, 1100, []); await semear(ctx, PREFS);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
    await p.goto(BASE + '/' + arq + '#hoje'); await p.waitForFunction(() => window.Colinha, null, { timeout: 15000 }).catch(() => {});
    for (const [h, vista, ancora] of ROTAS) {
      await p.goto(BASE + '/' + arq + h); await p.waitForTimeout(700);
      const r = await p.evaluate(a => ({ on: [...document.querySelectorAll('.view.on')].map(e => e.id), anc: a ? !!document.getElementById(a) : true }), ancora || null);
      const ok = vista.split('|').some(v => r.on.indexOf(v) > -1) && r.on.length === 1 && r.anc;
      conferir(ok, L + h + ' abre ' + (r.on.join(', ') || 'nada') + (ancora ? (r.anc ? ' com a âncora' : ' SEM a âncora ' + ancora) : ''));
    }
    await ctx.close();
  }
  /* interruptor "eleicoes" desligado no RootifyONE (arquivo simulado), no celular */
  {
    const arq = PAGINAS[0][0], L = arq + ', eleicoes desligado: ';
    const ctx = await novoContexto(browser, 390, []); await semear(ctx, PREFS);
    await ctx.route(BASE + '/solverone-dados/recursos/*.json', r => /eleicoes-2026\.json$/.test(r.request().url())
      ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ recursos: { eleicoes: { ligado: false } }, comportamentos: {} }) })
      : r.fulfill({ status: 404, body: '' }));
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ' (eleicoes off): ' + e.message));
    await p.goto(BASE + '/' + arq); await p.waitForFunction(() => window.PG, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1200);
    const vis = sel => p.evaluate(s => [...document.querySelectorAll(s)].filter(e => getComputedStyle(e).display !== 'none').length, sel);
    conferir(await vis('#hoje-eleicao') === 0, L + 'Hoje fica sem o cartão da eleição');
    await p.goto(BASE + '/' + arq + '#explorar'); await p.waitForTimeout(500);
    conferir(await vis('#v-explorar [data-recurso~="eleicoes"]') === 0 && await vis('#v-explorar .atalho') >= 1, L + 'Explorar esconde os atalhos da eleição e mantém os outros');
    conferir(await p.evaluate(() => typeof window.CongressoV2 === 'undefined'), L + 'o módulo Eleições não foi carregado (CongressoV2 ausente)');
    await p.click('#nav-h'); await p.waitForTimeout(500);
    const grupos = await p.evaluate(() => [...document.querySelectorAll('.gav .gav-g')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent.trim()));
    conferir(grupos.length > 0 && !grupos.some(g => /Eleições 2026|Elections 2026/.test(g)), L + 'o ☰ fica sem o grupo da eleição (' + grupos.join(' · ') + ')');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.goto(BASE + '/' + arq + '#hub'); const chegou = await p.waitForFunction(() => window.CongressoV2 && document.getElementById('v-hub').classList.contains('on'), null, { timeout: 15000 }).then(() => true, () => false);
    conferir(chegou, L + 'link direto #hub ainda abre e carrega o módulo na hora');
    await p.goto(BASE + '/' + arq + '#infograficos'); await p.waitForTimeout(800);
    conferir(await p.evaluate(() => document.querySelectorAll('#v-infograficos .ig-acoes').length) >= 40, L + 'nenhum infográfico some com a eleição desligada');
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
