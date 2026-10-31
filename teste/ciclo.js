/* Teste do CICLO ELEITORAL (ADR 0010, F1-PR7), nas DUAS páginas, com relógio simulado e o RootifyONE simulado:
     - automático: 26/10/2026 → pós-eleição (Colinha some, Eleições em arquivo, infográficos continuam); 05/01/2027 (posse) →
       acompanhamento (a eleição some da navegação sem desligar o recurso; o link direto ainda abre e carrega o módulo)
     - manual: eleicao.fase "2" em setembro → 2º turno; "pre-campanha" → Eleições ligadas sem Colinha
     - automático ignora eleicao.fase
     - calendário de 2028 (prefeito P2 e vereador V, lugar = município): fase pela data, vagas e rótulos
     - recurso "indicadores" desligado: as entradas somem, o link direto ainda abre
     - recursos-do-app.json declara o que o site obedece; a cadência de atualização aparece no ⓘ "Sobre este relatório"
   Uso: node teste/ciclo.js */
const fs = require('fs'), path = require('path');
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const PORTA = process.env.PORTA || 8104, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const RAIZ = path.join(__dirname, '..');
const PREFS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 };
const CAL_2028 = { ano: 2028, fase: 'auto', tse: 'ele2028', turnos: [{ data: '2028-10-01', cargos: ['V', 'P2'] }, { data: '2028-10-29', cargos: ['P2'] }], segundoTurno: {}, posse: '2029-01-01',
  cargos: { P2: { pt: 'Prefeito(a)', en: 'Mayor', digitos: 2, tse: 11, lugar: 'municipio' }, V: { pt: 'Vereador(a)', en: 'Councillor', digitos: 5, tse: 13, lugar: 'municipio' } } };

/* abre a página com o relógio e o arquivo do RootifyONE simulados: o.data (ISO), o.rec = recursos, o.comp = comportamentos, o.hash */
async function abrir(browser, arq, o, erros) {
  const ctx = await novoContexto(browser, o.largura || 1100, []);
  await ctx.clock.setFixedTime(new Date(o.data));
  await semear(ctx, PREFS);
  await ctx.route(BASE + '/solverone-dados/recursos/*.json', r => /eleicoes-2026\.json$/.test(r.request().url())
    ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ recursos: o.rec || {}, comportamentos: o.comp || {} }) })
    : r.fulfill({ status: 404, body: '' }));
  const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
  await p.goto(BASE + '/' + arq + (o.hash || '#hoje')); await p.waitForFunction(() => window.PG && window.Rotas, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1200);
  return { ctx, p };
}
const vis = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].filter(e => getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0).length, sel);
const attr = (p, a) => p.evaluate(a => document.documentElement.getAttribute(a), a);
const temAttr = (p, a) => p.evaluate(a => document.documentElement.hasAttribute(a), a);
const grupos = async p => { await p.click('#nav-h'); await p.waitForTimeout(500); const g = await p.evaluate(() => [...document.querySelectorAll('.gav .gav-g, .gav .gav-it')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent.trim().slice(0, 24))); await p.keyboard.press('Escape'); await p.waitForTimeout(300); return g; };

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  for (const [arq, lg] of PAGINAS) {
    const L = arq + ': ', en = lg === 'en';
    /* 1. automático, dia seguinte ao 2º turno: pós-eleição */
    { const { ctx, p } = await abrir(browser, arq, { data: '2026-10-26T15:00:00Z' }, erros);
      const t = await p.evaluate(() => (document.getElementById('hoje-el-t') || {}).textContent || '');
      conferir(await attr(p, 'data-fase') === 'pos' && await temAttr(p, 'data-colinha-pos') && /encerrada|concluded/.test(t) && await vis(p, '#hoje-eleicao') === 1, L + 'automático em 26/10/2026: fase "pos", Colinha escondida, cartão "' + t + '" continua em Hoje');
      const cad = await p.evaluate(() => (document.getElementById('cadencia') || {}).textContent || '');
      conferir((en ? /indicators daily/ : /indicadores diária/).test(cad) && /manual/.test(cad), L + 'a cadência de atualização por família aparece no ⓘ Sobre este relatório: "' + cad.slice(0, 80) + '…"');
      await p.goto(BASE + '/' + arq + '#infograficos'); await p.waitForTimeout(800);
      conferir(await p.evaluate(() => document.querySelectorAll('#v-infograficos .ig').length) >= 40, L + 'os infográficos continuam no pós-eleição');
      await ctx.close(); }
    /* 2. automático, dia da posse: acompanhamento */
    { const { ctx, p } = await abrir(browser, arq, { data: '2027-01-05T15:00:00Z', largura: 390 }, erros);   /* celular: o ☰ existe */
      const g = await grupos(p);
      conferir(await attr(p, 'data-fase') === 'acompanhamento' && await vis(p, '#hoje-eleicao') === 0 && !g.some(x => /Eleições 2026|Elections 2026/.test(x)) && await p.evaluate(() => typeof window.CongressoV2 === 'undefined'), L + 'automático na posse (05/01/2027): acompanhamento, sem cartão nem grupo da eleição, módulo fora (' + g.length + ' itens no ☰)');
      await p.goto(BASE + '/' + arq + '#hub');
      const chegou = await p.waitForFunction(() => window.CongressoV2 && document.getElementById('v-hub').classList.contains('on'), null, { timeout: 15000 }).then(() => true, () => false);
      conferir(chegou, L + 'no acompanhamento, o link direto #hub ainda abre o arquivo da eleição');
      await ctx.close(); }
    /* 3. manual com a fase "2" em setembro */
    { const { ctx, p } = await abrir(browser, arq, { data: '2026-09-01T15:00:00Z', comp: { 'eleicao.modo': 'manual', 'eleicao.fase': '2' }, hash: '#colinha' }, erros);
      await p.waitForFunction(() => window.Colinha, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600);
      const n = await p.evaluate(() => document.querySelectorAll('#v-colinha .ck-slot').length), cab = await p.evaluate(() => Calendario.cabecalho());
      const f3 = await attr(p, 'data-fase'), m3 = await attr(p, 'data-ciclo');
      conferir(f3 === '2' && m3 === 'manual' && n === 2 && /2º turno|second round/.test(cab), L + 'manual com eleicao.fase "2" em 01/09: 2º turno (' + n + ' vagas na Colinha; "' + cab + '"; data-fase=' + f3 + ' data-ciclo=' + m3 + ')');
      await ctx.close(); }
    /* 4. manual em pré-campanha: Eleições ligadas, Colinha escondida */
    { const { ctx, p } = await abrir(browser, arq, { data: '2026-09-01T15:00:00Z', comp: { 'eleicao.modo': 'manual', 'eleicao.fase': 'pre-campanha' } }, erros);
      const t = await p.evaluate(() => (document.getElementById('hoje-el-t') || {}).textContent || '');
      conferir(await attr(p, 'data-fase') === 'pre-campanha' && await temAttr(p, 'data-colinha-pos') && await vis(p, '#hoje-eleicao') === 1 && /pré-campanha|pre-campaign/.test(t) && await p.evaluate(() => colinhaOff()), L + 'manual em pré-campanha: cartão "' + t + '" em Hoje e Colinha escondida');
      await ctx.close(); }
    /* 5. automático ignora eleicao.fase */
    { const { ctx, p } = await abrir(browser, arq, { data: '2026-09-01T15:00:00Z', comp: { 'eleicao.modo': 'automatico', 'eleicao.fase': '2' } }, erros);
      const f5 = await attr(p, 'data-fase'), m5 = await attr(p, 'data-ciclo');
      conferir(f5 === '1' && m5 === 'automatico', L + 'automático em 01/09 ignora eleicao.fase "2": fase 1 pela data (data-fase=' + f5 + ' data-ciclo=' + m5 + ')');
      await ctx.close(); }
    /* 6. recurso "indicadores" desligado (manutenção): entradas somem, link direto abre */
    { const { ctx, p } = await abrir(browser, arq, { data: '2026-10-31T15:00:00Z', rec: { indicadores: { ligado: false } }, largura: 390 }, erros);
      const g = await grupos(p);
      conferir(await vis(p, '.barra a[data-dest="indicadores"]') === 0 && await vis(p, '#v-hoje a[href="#infograficos"]') === 0 && !g.some(x => /Infográficos|Infographics/.test(x)), L + 'indicadores desligado: sem a entrada na barra, em Hoje e no ☰');
      await p.goto(BASE + '/' + arq + '#infograficos'); await p.waitForTimeout(800);
      conferir(await p.evaluate(() => document.getElementById('v-infograficos').classList.contains('on') && document.querySelectorAll('#v-infograficos .ig').length >= 40), L + 'indicadores desligado: o link direto #infograficos ainda abre os gráficos');
      await ctx.close(); }
  }
  /* 7. calendário de 2028 (só a página em português): o ciclo municipal é dado, não código */
  { const arq = PAGINAS[0][0], L = arq + ', 2028: ';
    const { ctx, p } = await abrir(browser, arq, { data: '2028-10-02T15:00:00Z', comp: { 'eleicao.calendario': CAL_2028 } }, erros);
    const r = await p.evaluate(() => ({ fase: Calendario.fase(), vagas: Calendario.vagas(1).map(v => [v.k, v.d, v.tse, v.lugar]), curto: Calendario.curto(2), cab: Calendario.cabecalho(), ano: Calendario.ano(), card: (document.getElementById('hoje-el-t') || {}).textContent || '' }));
    conferir(r.fase === 2 && r.ano === 2028 && /2028/.test(r.card), L + 'em 02/10/2028 a fase é 2 e o cartão diz "' + r.card + '"');
    conferir(JSON.stringify(r.vagas) === JSON.stringify([['V', 5, 13, 'municipio'], ['P2', 2, 11, 'municipio']]) && r.curto === '2º turno · 29/Out', L + 'vagas do 1º turno: vereador (5 dígitos, TSE 13) e prefeito (2 dígitos, TSE 11), lugar = município; "' + r.curto + '"');
    await ctx.close(); }
  /* 8. o que o site declara obedecer */
  { const m = JSON.parse(fs.readFileSync(path.join(RAIZ, 'recursos-do-app.json'), 'utf8'));
    const ids = [...m.recursos, ...m.comportamentos].map(x => typeof x === 'string' ? x : x.id);
    const modo = m.comportamentos.find(c => c && c.id === 'eleicao.modo'), fase = m.comportamentos.find(c => c && c.id === 'eleicao.fase');
    conferir(['assistone', 'eleicoes', 'colinha', 'indicadores', 'eleicao.modo', 'eleicao.fase', 'eleicao.calendario', 'atualizacao.cadencia'].every(i => ids.includes(i)) && modo.padrao === 'automatico' && fase.padrao === 'auto' && modo.opcoes.includes('manual') && fase.opcoes.includes('acompanhamento'),
      'recursos-do-app.json declara os recursos e os comportamentos do ciclo (padrões: modo automático, fase auto)'); }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
