/* Teste da tela HOJE depois do pedido do dono de 31/10/2026 (nota 1,5), nas DUAS páginas, no celular:
     - o primeiro cartão é "Acompanhar o mandato" (Presidência), com o mandato vindo do calendário; tocar nele abre #mandato
     - "Quem está no Congresso" é o primeiro atalho; Explorar começa pelo mandato e o resultado vem depois dos planos
     - depois da eleição (relógio em 05/11/2026) a eleição é só a linha "Arquivo da eleição 2026 ›" no fim; o cartão some
     - rodapé de uma linha: a ressalva do "índice único" fica dentro do ⓘ; a linha da versão não traz os "ajustes feitos neste navegador"
     - 320 px sem rolagem lateral
   Uso: node teste/hoje.js */
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const PORTA = process.env.PORTA || 8108, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const PREFS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true, som: false }, 'planos2026:novidade-colinha': 1 };
const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }, sel);

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  for (const [arq, lg] of PAGINAS) {
    const L = arq + ': ', en = lg === 'en';
    const ctx = await novoContexto(browser, 390, []); await ctx.clock.setFixedTime(new Date('2026-11-05T15:00:00Z')); await semear(ctx, PREFS);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
    await p.goto(BASE + '/' + arq + '#hoje'); await p.waitForFunction(() => window.PG && window.Rotas, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(800);
    const h = await p.evaluate(() => { const w = document.querySelector('#v-hoje .wrap'); const links = [...w.querySelectorAll('a')].filter(a => getComputedStyle(a).display !== 'none' && a.getClientRects().length); const pr = links[0];
      return { primeiro: pr ? pr.id + ' ' + pr.getAttribute('href') + ' | ' + pr.textContent.replace(/\s+/g, ' ').trim() : '', eyebrow: (document.getElementById('hoje-md-t') || {}).textContent, atalho1: (w.querySelector('.atalhos a') || {}).getAttribute('href'), linha: (document.getElementById('hoje-el-linha') || {}).textContent, sub: (w.querySelector('.dest-s') || {}).textContent }; });
    conferir(/^hoje-mandato #mandato/.test(h.primeiro) && (en ? /Follow the term/ : /Acompanhar o mandato/).test(h.primeiro) && /2027-2030/.test(h.eyebrow), L + 'o primeiro cartão de Hoje é "Acompanhar o mandato" (' + h.eyebrow + ')');
    conferir(!(await vis(p, '#hoje-eleicao')) && await vis(p, '.hoje-arquivo') && /2026 ›/.test(h.linha) && h.atalho1 === '#congresso/mandato', L + 'depois da eleição: a eleição é só a linha "' + h.linha + '" no fim; o primeiro atalho é o Congresso');
    conferir((en ? /Who was elected/ : /Quem foi eleito/).test(h.sub), L + 'subtítulo curto: "' + h.sub + '"');
    /* tocar no cartão abre a tela do mandato (o módulo Eleições carrega na hora) */
    await p.click('#hoje-mandato');
    const abriu = await p.waitForFunction(() => window.CongressoV2 && document.getElementById('v-mandato').classList.contains('on') && document.getElementById('v-mandato').children.length > 0, null, { timeout: 15000 }).then(() => true, () => false);
    conferir(abriu && await p.evaluate(() => location.hash) === '#mandato', L + 'tocar no cartão abre #mandato com a tela desenhada');
    /* Explorar: mandato primeiro, resultado depois dos planos */
    await p.goto(BASE + '/' + arq + '#explorar'); await p.waitForTimeout(500);
    const ex = await p.evaluate(() => [...document.querySelectorAll('#v-explorar .atalhos a')].map(a => a.getAttribute('href')));
    conferir(ex[0] === '#mandato' && ex[1] === '#congresso/mandato' && ex.indexOf('#resultado') > ex.indexOf('#macrotemas'), L + 'Explorar: ' + ex.join(' → '));
    /* rodapé de uma linha e versão sem os ajustes */
    const f = await p.evaluate(() => ({ ps: [...document.querySelectorAll('.foot .in > p')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent.replace(/\s+/g, ' ').trim()), pop: (document.getElementById('i-sobre') || {}).textContent || '', ver: (document.getElementById('ver') || {}).textContent || '' }));
    conferir(f.ps.length === 2 && /índice único|single index/.test(f.pop) && !f.ps.some(t => /índice único|single index/.test(t)), L + 'rodapé: uma linha "Sobre" + a versão; a ressalva do índice único fica no ⓘ');
    conferir(/2\.6\.\d+/.test(f.ver) && !/ajustes feitos|adjustments made|trilha sonora|soundtrack/.test(f.ver), L + 'linha da versão sem os "ajustes feitos neste navegador": "' + f.ver + '"');
    await p.setViewportSize({ width: 320, height: 700 }); await p.goto(BASE + '/' + arq + '#hoje'); await p.waitForTimeout(500);
    conferir(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), L + '320 px: Hoje sem rolagem lateral');
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
