/* Teste dos ALIASES das âncoras antigas (ADR 0009, F1-PR10):
     - cada entrada de dados/aliases.json aberta como # antigo mostra a vista certa; quando a rota muda, o endereço vira a nova
       (replaceState, sem entrada a mais no histórico); quando há âncora, o bloco com aquele id fica na tela
     - #macrotemas/<tema> e #congresso/ficha/… mantêm o resto do caminho
     - as páginas de redirecionamento do endereço antigo (docs/redirecionamento) preservam ? e # e apontam o canonical para cá
   Uso: node teste/aliases.js */
const fs = require('fs'), path = require('path');
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const PORTA = process.env.PORTA || 8107, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const RAIZ = path.join(__dirname, '..');
const PREFS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 };
const AL = JSON.parse(fs.readFileSync(path.join(RAIZ, 'dados/aliases.json'), 'utf8')).aliases;
const vista = r => /^g-/.test(r) ? 'v-infograficos' : r === 'colinha' ? 'v-hub|v-colinha' : 'v-' + r;

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  for (const [arq, lg] of PAGINAS) {
    const L = arq + ': ';
    const ctx = await novoContexto(browser, 1100, []); await semear(ctx, PREFS);
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
    await p.goto(BASE + '/' + arq + '#hoje'); await p.waitForFunction(() => window.Colinha, null, { timeout: 15000 }).catch(() => {});
    /* em inglês, uma amostra; em português, todas */
    /* em inglês, uma amostra (com um gráfico pelo slug em inglês); em português, todas as que não são só do inglês */
    const chaves = lg === 'en' ? ['g-sobrepor', 'ig-indice', 'gl-C', 'historico', Object.keys(AL).find(k => AL[k].idioma === 'en')] : Object.keys(AL).filter(k => AL[k].idioma !== 'en');
    const colinhaOff = await p.evaluate(() => !!(window.colinhaOff && colinhaOff()));
    const ruins = [];
    for (const antiga of chaves) {
      const a = AL[antiga], esperada = a.rota, comParte = antiga === 'macrotemas' ? '/economia' : '';
      const idAnc = a.ancora || (/^g-/.test(antiga) && !/^g-(sobrepor|marcos-comp)$/.test(antiga) ? antiga : null);
      await p.goto(BASE + '/' + arq + '#' + antiga + comParte);
      if (idAnc) await p.waitForFunction(id => { const e = document.getElementById(id); return !!e && e.getClientRects().length > 0; }, idAnc, { timeout: 4000 }).catch(() => {});
      await p.waitForTimeout(400);
      const r = await p.evaluate(id => {
        const on = [...document.querySelectorAll('.view.on')].map(e => e.id);
        const e = id && document.getElementById(id); const rc = e ? e.getBoundingClientRect() : null;
        /* letra do glossário sem verbete no recorte: não há grupo, e o botão da letra fica desligado */
        const letraSem = id && /^gl-[A-Z]$/.test(id) && !!document.querySelector('#gl-alfa') && !document.querySelector('#gl-alfa .alfa-l:not(.off)') ? false : (id && /^gl-[A-Z]$/.test(id) ? ![...document.querySelectorAll('#gl-alfa .alfa-l:not(.off)')].some(b => b.textContent === id.slice(3)) : false);
        return { on, hash: location.hash, anc: !!e, dentro: rc ? rc.top >= -2 && rc.top < innerHeight : null, letraSem };
      }, idAnc);
      const okVista = vista(esperada).split('|').some(v => r.on.includes(v)) && r.on.length === 1;
      const okHash = r.hash === '#' + esperada + comParte || (antiga === 'colinha' && colinhaOff && r.hash === '#hub');   /* Colinha fora do ar: volta para o hub, como sempre fez */
      const okAnc = idAnc ? ((r.anc && r.dentro) || r.letraSem) : true;
      if (!(okVista && okHash && okAnc)) ruins.push(antiga + ' → ' + r.on.join('+') + ' ' + r.hash + (idAnc && !r.anc ? ' (sem o bloco)' : idAnc && r.dentro === false ? ' (bloco fora da tela)' : ''));
    }
    conferir(ruins.length === 0, L + chaves.length + ' âncoras antigas abrem a vista certa, com o endereço novo e o bloco na tela' + (ruins.length ? ' — falharam ' + ruins.length + ': ' + ruins.slice(0, 4).join(' | ') : ''));
    /* o alias não empilha histórico: #gl-C vira #glossario e um Voltar sai da tela, não volta para #gl-c */
    await p.goto(BASE + '/' + arq + '#hoje'); await p.waitForTimeout(400);
    await p.evaluate(() => { location.hash = '#gl-C'; }); await p.waitForTimeout(700);
    const h1 = await p.evaluate(() => location.hash); await p.goBack().catch(() => {}); await p.waitForTimeout(600);
    conferir(h1 === '#glossario' && await p.evaluate(() => location.hash) === '#hoje', L + '#gl-C vira #glossario sem entrada a mais no histórico (Voltar leva a #hoje)');
    await ctx.close();
  }
  /* as páginas de redirecionamento do endereço antigo */
  for (const f of ['index.html', 'index-en.html']) {
    const h = fs.readFileSync(path.join(RAIZ, 'docs/redirecionamento', f), 'utf8');
    conferir(/location\.hash/.test(h) && /location\.search/.test(h) && /rel="canonical" href="https:\/\/solverone\.com\.br\/radar-one\//.test(h) && /http-equiv="refresh"/.test(h) && (f === 'index.html' || /lang=en/.test(h)), 'docs/redirecionamento/' + f + ': preserva ? e #, canonical para /radar-one/ e refresh de reserva');
  }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
