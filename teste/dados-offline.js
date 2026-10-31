/* Teste dos dados fora do HTML (F1-PR2), nas DUAS páginas:
     - 1ª visita: os 8 blocos vêm de dados/*.json (dados/en/ no inglês), entram no DOM como <script id="…"> e window.__IG__ existe;
       o texto do bloco "ig" é byte a byte o arquivo dados/ig.json (mesmo snapshot do harness de paridade)
     - 2ª visita com a rede dos JSON cortada: abre pela cópia guardada (Cache Storage), sem aviso
     - aparelho sem cópia e sem rede: aviso "sem internet e sem cópia guardada" em PT ou EN, e nada quebra
   Uso: node teste/dados-offline.js */
const { chromium, servir, novoContexto, semear, PAGINAS, relatorio } = require('./comum');
const fs = require('fs'), path = require('path');
const PORTA = process.env.PORTA || 8097, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  for (const [arq] of PAGINAS) {
    const L = arq + ': ';
    const en = /en\.html$/.test(arq);
    const igArquivo = fs.readFileSync(path.join(__dirname, '..', en ? 'dados/en/ig.json' : 'dados/ig.json'), 'utf8');
    const ctx = await novoContexto(browser, 1100, []);
    await semear(ctx, { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 });
    /* 1ª visita: rede normal */
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(arq + ': ' + e.message));
    await p.goto(BASE + '/' + arq + '#hub'); await p.waitForSelector('#v-hub', { state: 'attached' });
    await p.waitForFunction(() => window.Colinha && window.__IG__, null, { timeout: 15000 }).catch(() => {});
    const v1 = await p.evaluate(() => ({
      ig: !!window.__IG__, colinha: !!window.Colinha, blocos: ['traden', 'dados', 'ig', 'bio', 'glos', 'patr', 'dlinks', 'proc'].filter(id => !document.getElementById(id)),
      igTxt: (document.getElementById('ig') || {}).textContent || '', aviso: !!document.getElementById('sem-dados')
    }));
    conferir(v1.ig && v1.colinha && !v1.blocos.length && !v1.aviso, L + '1ª visita: os 8 blocos entram no DOM a partir de dados/*.json e o site carrega' + (v1.blocos.length ? ' (faltou: ' + v1.blocos.join(', ') + ')' : ''));
    conferir(v1.igTxt === igArquivo, L + '1ª visita: o bloco "ig" no DOM é byte a byte o arquivo ' + (en ? 'dados/en/ig.json' : 'dados/ig.json'));
    /* 2ª visita, mesma pessoa, sem rede para os JSON: a cópia guardada responde */
    await ctx.route(/\/dados\/.*\.json$/, r => r.abort());
    const p2 = await ctx.newPage(); p2.on('pageerror', e => erros.push(arq + ' (2ª visita): ' + e.message));
    await p2.goto(BASE + '/' + arq + '#hub'); await p2.waitForSelector('#v-hub', { state: 'attached' });
    const ok2 = await p2.waitForFunction(() => window.Colinha && window.__IG__, null, { timeout: 15000 }).then(() => true, () => false);
    const aviso2 = await p2.evaluate(() => !!document.getElementById('sem-dados'));
    conferir(ok2 && !aviso2, L + '2ª visita sem rede para os JSON: abre pela cópia guardada neste aparelho, sem aviso');
    await ctx.close();
    /* aparelho novo, sem cópia e sem rede: avisa em linguagem de gente, no idioma da página */
    const c3 = await novoContexto(browser, 1100, []);
    await semear(c3, { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 });
    await c3.route(/\/dados\/.*\.json$/, r => r.abort());
    const p3 = await c3.newPage();   /* aqui o erro de página é esperado: o app.js para de propósito */
    await p3.goto(BASE + '/' + arq); await p3.waitForTimeout(1500);
    const t3 = await p3.evaluate(() => (document.getElementById('sem-dados') || {}).textContent || '');
    conferir(en ? /no internet and no saved copy/.test(t3) : /sem internet e sem cópia guardada/.test(t3), L + 'sem cópia e sem rede: avisa "' + (t3.slice(0, 40) || '(nada)') + '…"');
    await c3.close();
  }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
