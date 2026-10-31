/* Teste do shell com os quatro destinos (F1-PR5), nas DUAS páginas:
     - sem # abre em Hoje; a barra tem 4 destinos com alvo ≥ 44 px e marca o atual com aria-current
     - tocar nos destinos troca a vista; Voltar de uma aba volta direto para Hoje (abas não se empilham); na tela inicial o
       Voltar avisa "toque de novo para sair" e não sai
     - #explorar, #salvos e #hoje escondem a fileira de abas das Eleições (#menu); #inicio a mantém
     - 320 px: nenhum destino provoca rolagem lateral; o foco pelo teclado é visível na barra
     - computador (1200 px): a barra vira lateral à esquerda e não cobre o conteúdo
   Uso: node teste/navegacao.js */
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const PORTA = process.env.PORTA || 8099, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const PREFS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 };
const DEST = ['hoje', 'explorar', 'infograficos', 'salvos'];

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  const on = (p, id) => p.evaluate(i => !!document.getElementById(i) && document.getElementById(i).classList.contains('on'), id);
  const atual = p => p.evaluate(() => { const a = document.querySelector('.barra a[aria-current="page"]'); return a ? a.getAttribute('data-dest') : null; });
  for (const [arq, lg] of PAGINAS) {
    const L = arq + ': ', en = lg === 'en';
    const sep = arq.indexOf('?') > -1 ? '' : '';
    const url = h => BASE + '/' + arq + (h || '');
    /* celular */
    let ctx = await novoContexto(browser, 390, []); await semear(ctx, PREFS);
    let p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
    await p.goto(url('')); await p.waitForSelector('#v-hoje.on', { state: 'attached', timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600);
    conferir(await p.evaluate(() => location.hash) === '#hoje' && await on(p, 'v-hoje'), L + 'sem # no endereço abre em Hoje (#hoje)');
    const ligadas = await p.evaluate(() => [...document.querySelectorAll('.view.on')].map(e => e.id));
    conferir(ligadas.length === 1 && ligadas[0] === 'v-hoje', L + 'em Hoje só a vista de Hoje fica ligada (' + ligadas.join(', ') + ')');
    const barra = await p.evaluate(() => [...document.querySelectorAll('.barra a[data-dest]')].map(a => { const r = a.getBoundingClientRect(); return { d: a.getAttribute('data-dest'), h: r.height, w: r.width, txt: a.textContent.trim() }; }));
    conferir(barra.length === 4 && barra.every(b => b.h >= 44 && b.w >= 44), L + 'a barra tem 4 destinos com alvo ≥ 44 px (' + barra.map(b => b.txt + ' ' + Math.round(b.h) + 'px').join(', ') + ')');
    conferir(await atual(p) === 'hoje', L + 'Hoje marcado com aria-current="page"');
    await p.click('.barra a[data-dest="explorar"]'); await p.waitForTimeout(500);
    conferir(await on(p, 'v-explorar') && !(await on(p, 'v-hoje')) && await atual(p) === 'explorar', L + 'tocar em Explorar abre #explorar e marca o destino');
    await p.click('.barra a[data-dest="indicadores"]'); await p.waitForTimeout(500);
    conferir(await on(p, 'v-infograficos') && !(await on(p, 'v-explorar')) && await atual(p) === 'indicadores', L + 'tocar em Indicadores abre os infográficos de sempre (#infograficos)');
    await p.click('.barra a[data-dest="salvos"]'); await p.waitForTimeout(500);
    conferir(await on(p, 'v-salvos') && await p.evaluate(() => location.hash) === '#salvos', L + 'tocar em Salvos abre #salvos');
    await p.goBack().catch(() => {}); await p.waitForTimeout(600);
    conferir(await p.evaluate(() => location.hash) === '#hoje' && await on(p, 'v-hoje'), L + 'Voltar de uma aba volta direto para Hoje (as abas não se empilham)');
    await p.goBack().catch(() => {}); await p.waitForTimeout(600);
    const g = await p.evaluate(() => ({ hash: location.hash, aviso: (document.getElementById('rotas-aviso') || {}).textContent || '', on: !!(document.getElementById('rotas-aviso') || {}).classList && document.getElementById('rotas-aviso').classList.contains('on') }));
    conferir(g.hash === '#hoje' && g.on && (en ? /Back again/.test(g.aviso) : /Voltar de novo/.test(g.aviso)), L + 'na tela inicial o Voltar avisa "' + g.aviso.slice(0, 32) + '…" e não sai do app');
    const p2 = await ctx.newPage(); await p2.goto(url('#explorar')); await p2.waitForSelector('#v-explorar.on', { state: 'attached', timeout: 15000 }).catch(() => {}); await p2.waitForTimeout(400);
    conferir(await p2.evaluate(() => getComputedStyle(document.getElementById('menu')).display === 'none' && document.documentElement.getAttribute('data-destino') === 'explorar'), L + 'em #explorar a fileira de abas das Eleições fica escondida');
    const lig2 = await p2.evaluate(() => [...document.querySelectorAll('.view.on')].map(e => e.id));
    conferir(lig2.length === 1 && lig2[0] === 'v-explorar', L + 'link direto para #explorar liga só a vista de Explorar (' + lig2.join(', ') + ')');
    const p3 = await ctx.newPage(); await p3.goto(url('#inicio')); await p3.waitForSelector('#menu button', { state: 'attached' }); await p3.waitForTimeout(400);
    conferir(await p3.evaluate(() => document.documentElement.getAttribute('data-destino') === 'eleicoes'), L + 'em #inicio o shell sabe que está nas Eleições (data-destino=eleicoes); no celular as abas já ficavam no ☰');
    /* teclado: o foco na barra é visível */
    await p3.goto(url('#hoje')); await p3.waitForTimeout(400);
    let achou = false, estilo = null;
    for (let i = 0; i < 60 && !achou; i++) { await p3.keyboard.press('Tab'); const r = await p3.evaluate(() => { const e = document.activeElement; if (!e || !e.matches('.barra a')) return null; const s = getComputedStyle(e); return { st: s.outlineStyle, w: parseFloat(s.outlineWidth) }; }); if (r) { achou = true; estilo = r; } }
    conferir(achou && estilo.st !== 'none' && estilo.w > 0, L + 'foco pelo teclado chega à barra e fica visível (outline ' + (estilo ? estilo.st + ' ' + estilo.w + 'px' : 'não achou') + ')');
    await ctx.close();
    /* o cabeçalho não pula quando o módulo Eleições chega: o lugar do seletor de modo já está reservado no HTML */
    const c4 = await novoContexto(browser, 390, []); await semear(c4, PREFS);
    await c4.addInitScript(() => { const h = [], d = []; const tick = () => { const n = document.querySelector('.nav'), s = document.getElementById('modo-seg'), i = document.querySelector('.nav-in'); if (n) { h.push(Math.round(n.getBoundingClientRect().height)); d.push([Math.round(n.getBoundingClientRect().height), i ? Math.round(i.getBoundingClientRect().height) : '-', s ? getComputedStyle(s).display + Math.round(s.getBoundingClientRect().height) : '-', document.documentElement.getAttribute('data-destino') || '-'].join('|')); } if (h.length < 90) requestAnimationFrame(tick); }; /* começa quando o HTML (e os <style> do body) já foram lidos e antes dos módulos rodarem: readyState "interactive" */ const comeca = () => requestAnimationFrame(tick); if (document.readyState !== 'loading') comeca(); else document.addEventListener('readystatechange', () => { if (document.readyState === 'interactive') comeca(); }); window.__navAlturas = h; window.__navDiag = d; });
    const p4 = await c4.newPage(); await p4.goto(url('#inicio')); await p4.waitForFunction(() => window.CongressoV2 && window.__navAlturas && window.__navAlturas.length >= 30, null, { timeout: 15000 }).catch(() => {});
    const alt = await p4.evaluate(() => ({ alturas: [...new Set(window.__navAlturas)], diag: [...new Set(window.__navDiag)], seg: document.querySelectorAll('#modo-seg button').length }));
    conferir(alt.alturas.length === 1 && alt.seg === 4, L + 'o cabeçalho não muda de altura enquanto o módulo Eleições chega (' + alt.alturas.join('/') + ' px; seletor com ' + alt.seg + ' partes' + (alt.alturas.length > 1 ? '; quadros nav|linha|fileira|destino: ' + alt.diag.join(' › ') : '') + ')');
    await c4.close();
    /* 320 px: sem rolagem lateral em nenhum destino */
    ctx = await novoContexto(browser, 320, []); await semear(ctx, PREFS);
    p = await ctx.newPage(); const larg = [];
    for (const d of DEST) { await p.goto(url('#' + d)); await p.waitForTimeout(700); larg.push(d + '=' + await p.evaluate(() => document.documentElement.scrollWidth + '/' + innerWidth)); }
    conferir(larg.every(x => { const [a, b] = x.split('=')[1].split('/').map(Number); return a <= b + 1; }), L + '320 px: nenhum destino provoca rolagem lateral (' + larg.join(' ') + ')');
    await ctx.close();
    /* computador: barra lateral à esquerda, conteúdo ao lado */
    ctx = await novoContexto(browser, 1200, []); await semear(ctx, PREFS);
    p = await ctx.newPage(); await p.goto(url('#hoje')); await p.waitForTimeout(700);
    const d = await p.evaluate(() => { const b = document.querySelector('.barra').getBoundingClientRect(), w = document.querySelector('#v-hoje .wrap').getBoundingClientRect(); return { bl: b.left, bw: b.width, bt: b.top, wl: w.left }; });
    conferir(d.bl === 0 && d.bw <= 240 && d.bt >= 40, L + '1200 px: a barra é lateral, à esquerda, abaixo do cabeçalho (' + Math.round(d.bw) + ' px de largura)');
    conferir(d.wl >= d.bw, L + '1200 px: o conteúdo começa depois da barra lateral (não fica coberto)');
    await p.goto(url('#inicio')); await p.waitForSelector('#menu button', { state: 'attached' }); await p.waitForTimeout(400);
    conferir(await p.evaluate(() => getComputedStyle(document.getElementById('menu')).display !== 'none'), L + '1200 px: em #inicio (Eleições) a fileira de abas continua visível');
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
