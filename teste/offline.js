/* Teste de USAR SEM INTERNET e do atalho na tela inicial (F1-PR8), com o service worker de verdade:
     - manifest.json, ícones 192/512 e <link rel="manifest"> + theme-color no HTML
     - o sw.js registra e passa a controlar a página; o nome do cache leva a pasta do app; o cache dos dados sobrevive
     - Configurações → "Usar sem internet": Salvar no aparelho baixa o pacote de offline.json e mostra versão, data e MB; Apagar cópia
     - segunda visita SEM REDE: Indicadores abre com o último snapshot e o selo "Sem internet" aparece; com rede o selo some
     - navegador da Samsung: aviso em Hoje com "Abrir no Chrome" (intent://) e "Agora não" que não volta; iPhone: os 3 passos
     - offline.json bate com os arquivos de verdade; versoes.json começa pela versão atual, com as notas em PT e EN
   Uso: node teste/offline.js */
const fs = require('fs'), path = require('path');
const { chromium, servir, semear, relatorio } = require('./comum');
const PORTA = process.env.PORTA || 8105, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const RAIZ = path.join(__dirname, '..');
const PREFS = { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 };
const png = f => { const b = fs.readFileSync(path.join(RAIZ, f)); return b.slice(1, 4).toString() === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };
/* contexto com service worker PERMITIDO (o comum.js bloqueia); nada sai para a internet */
async function contexto(browser, o) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', reducedMotion: 'reduce' }, o || {}));
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  await ctx.addInitScript(() => { try { const k = 'planos2026:prefs', o = JSON.parse(localStorage.getItem(k) || '{}'); o.aoVisto = true; o.telaCiente = true; localStorage.setItem(k, JSON.stringify(o)); localStorage.setItem('planos2026:novidade-colinha', '1'); } catch (e) {} });
  return ctx;
}
const texto = (p, sel) => p.evaluate(s => (document.querySelector(s) || {}).textContent || '', sel);
const visivel = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0; }, sel);

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  /* 1. manifesto e ícones */
  { const m = JSON.parse(fs.readFileSync(path.join(RAIZ, 'manifest.json'), 'utf8')), html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
    const i192 = png('icone-192.png'), i512 = png('icone-512.png');
    conferir(m.short_name === 'RadarONE' && m.display === 'standalone' && m.start_url === './' && m.icons.some(i => /maskable/.test(i.purpose || '')) && i192 && i192[0] === 192 && i512 && i512[0] === 512, 'manifest.json com nome, standalone, ícones 192 e 512 (maskable) de verdade');
    conferir(/<link rel="manifest" href="manifest\.json">/.test(html) && /<meta name="theme-color"/.test(html), 'index.html liga o manifesto e declara theme-color'); }
  /* 2. o service worker e a cópia */
  { const ctx = await contexto(browser); const p = await ctx.newPage(); p.on('pageerror', e => erros.push(e.message));
    await p.goto(BASE + '/index.html#infograficos'); await p.waitForFunction(() => window.PG && window.Offline, null, { timeout: 15000 }).catch(() => {});
    const reg = await p.evaluate(() => navigator.serviceWorker.ready.then(r => ({ scope: r.scope, ativo: !!r.active })).catch(e => ({ erro: String(e) })));
    conferir(reg.ativo, 'o sw.js registra e fica ativo (escopo ' + (reg.scope || '?') + ')');
    await p.reload(); await p.waitForFunction(() => window.PG && window.Offline, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(800);
    const c = await p.evaluate(() => ({ controla: !!navigator.serviceWorker.controller, caches: caches.keys() })).then(async x => ({ controla: x.controla, caches: await p.evaluate(() => caches.keys()) }));
    conferir(c.controla && c.caches.some(n => /^dgo-[a-z0-9-]+-v\d+$/.test(n)) && c.caches.includes('dgo-radar-one-dados-v1'), 'na segunda carga o sw controla a página; caches: ' + c.caches.join(', '));
    /* Configurações → Usar sem internet */
    await p.click('#cfg-b'); await p.waitForSelector('#off-sec', { timeout: 8000 }); await p.waitForTimeout(500);
    const antes = await texto(p, '#off-sit'), rot = await texto(p, '#off-salvar');
    conferir(/Sem cópia salva/.test(antes) && /Salvar no aparelho \(\d+(,\d)? MB\)/.test(rot), 'Configurações: seção "Usar sem internet" com a situação ("' + antes.slice(0, 30) + '…") e o tamanho antes ("' + rot + '")');
    await p.click('#off-salvar'); await p.waitForFunction(() => /Cópia offline: versão/.test((document.getElementById('off-sit') || {}).textContent || ''), null, { timeout: 90000 }).catch(() => {});
    const depois = await texto(p, '#off-sit'), msg = await texto(p, '#off-msg');
    const dadosV = JSON.parse(fs.readFileSync(path.join(RAIZ, 'dados/dados.json'), 'utf8')).versao;
    conferir(new RegExp('Cópia offline: versão ' + dadosV.replace(/\./g, '\\.') + ', salva em \\d\\d/[A-Z][a-z][a-z]/\\d{4} · \\d+(,\\d)? MB$').test(depois) && /Pronto/.test(msg), 'Salvar no aparelho: "' + depois + '" · "' + msg + '"');
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    /* sem rede: Indicadores abre com o último snapshot e o selo aparece */
    await ctx.setOffline(true);
    await p.goto(BASE + '/index.html#infograficos').catch(() => {}); await p.waitForTimeout(2500);
    const off = await p.evaluate(() => ({ ig: document.querySelectorAll('#v-infograficos .ig').length, on: document.getElementById('v-infograficos') && document.getElementById('v-infograficos').classList.contains('on'), selo: (document.getElementById('offline-selo') || {}).textContent || '', seloVis: !!document.getElementById('offline-selo') && !document.getElementById('offline-selo').hidden }));
    conferir(off.on && off.ig >= 40 && off.seloVis && /Sem internet/.test(off.selo), 'segunda visita sem rede: Indicadores abre com o último snapshot (' + off.ig + ' gráficos) e o selo "' + off.selo + '"');
    await ctx.setOffline(false); await p.waitForTimeout(500);
    conferir(!(await visivel(p, '#offline-selo')), 'com a rede de volta o selo some');
    /* apagar a cópia */
    await p.click('#cfg-b'); await p.waitForSelector('#off-apagar', { timeout: 8000 }); await p.click('#off-apagar'); await p.waitForTimeout(600);
    const limpo = await texto(p, '#off-sit'), temPacote = await p.evaluate(() => caches.keys().then(ks => ks.some(k => /-pacote$/.test(k))));
    conferir(/Sem cópia salva/.test(limpo) && !temPacote, 'Apagar cópia: volta a "Sem cópia salva" e o cache do pacote some');
    await ctx.close(); }
  /* 3. navegador da Samsung: aviso em Hoje, "Abrir no Chrome", "Agora não" */
  { const ctx = await contexto(browser, { userAgent: 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36' });
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push('samsung: ' + e.message));
    await p.goto(BASE + '/index.html#hoje'); await p.waitForFunction(() => window.Offline, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600);
    const av = await p.evaluate(() => { const b = document.getElementById('off-aviso'); const a = b && b.querySelector('a[href^="intent://"]'); return { tem: !!b, intent: a ? a.href : '', txt: b ? b.textContent.slice(0, 60) : '' }; });
    conferir(av.tem && /^intent:\/\/localhost:\d+\/index\.html#Intent;scheme=https;package=com\.android\.chrome;/.test(av.intent) && /Chrome/.test(av.txt), 'Samsung Internet: aviso em Hoje com "Abrir no Chrome" (' + av.intent.slice(0, 40) + '…)');
    await p.click('#off-aviso button'); await p.waitForTimeout(300); await p.reload(); await p.waitForFunction(() => window.Offline, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600);
    conferir(await p.evaluate(() => !document.getElementById('off-aviso') && localStorage.getItem('planos2026:samsung-ciente') === 'true'), '"Agora não" esconde o aviso e ele não volta ao recarregar');
    await p.click('#cfg-b'); await p.waitForSelector('#off-atalho', { timeout: 8000 }); await p.click('#off-atalho'); await p.waitForTimeout(300);
    conferir(/instale pelo Chrome/.test(await texto(p, '#off-msg')) && await p.evaluate(() => !!document.querySelector('#off-msg a[href^="intent://"]')), 'Criar atalho no Samsung: passo a passo para instalar pelo Chrome');
    await ctx.close(); }
  /* 4. iPhone: os três passos */
  { const ctx = await contexto(browser, { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
    const p = await ctx.newPage(); await p.goto(BASE + '/index.html#hoje'); await p.waitForFunction(() => window.Offline, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600);
    conferir(await p.evaluate(() => !document.getElementById('off-aviso')), 'iPhone: sem o aviso da Samsung');
    await p.click('#cfg-b'); await p.waitForSelector('#off-atalho', { timeout: 8000 }); await p.click('#off-atalho'); await p.waitForTimeout(300);
    const m = await texto(p, '#off-msg');
    conferir(/Compartilhar/.test(m) && /Adicionar à Tela de Início/.test(m) && await p.evaluate(() => document.querySelectorAll('#off-msg li').length === 3), 'iPhone: os 3 passos (Compartilhar → Adicionar à Tela de Início) e "Já instalei"');
    await ctx.close(); }
  /* 5. offline.json e versoes.json batem com o repositório */
  { const o = JSON.parse(fs.readFileSync(path.join(RAIZ, 'offline.json'), 'utf8')), dados = JSON.parse(fs.readFileSync(path.join(RAIZ, 'dados/dados.json'), 'utf8'));
    const ruins = o.arquivos.filter(a => { try { return fs.statSync(path.join(RAIZ, a.a)).size !== a.b; } catch (e) { return true; } }).map(a => a.a);
    const temModulos = ['index.html', 'modulos/app.js', 'modulos/offline.js', 'dados/ig.json', 'dados/en/ig.json', 'i18n/en.json', 'fontes/nunito-latin.woff2', 'manifest.json'].filter(f => !o.arquivos.some(a => a.a === f));
    conferir(o.versao === dados.versao && ruins.length === 0 && temModulos.length === 0, 'offline.json: versão ' + o.versao + ', ' + o.arquivos.length + ' arquivos iguais aos do repositório' + (ruins.length ? ' (diferentes: ' + ruins.slice(0, 3).join(', ') + ')' : '') + (temModulos.length ? ' (faltam: ' + temModulos.join(', ') + ')' : ''));
    const v = JSON.parse(fs.readFileSync(path.join(RAIZ, 'versoes.json'), 'utf8')), en = JSON.parse(fs.readFileSync(path.join(RAIZ, 'dados/en/dados.json'), 'utf8'));
    conferir(v.app === 'radar-one' && v.versoes[0].versao === dados.versao && /^\d\d\/[A-Z][a-z][a-z]\/\d{4}$/.test(v.versoes[0].data) && JSON.stringify(v.versoes[0].itens.pt) === JSON.stringify(dados.versoes[0].itens) && JSON.stringify(v.versoes[0].itens.en) === JSON.stringify(en.versoes[0].itens) && v.versoes.length === dados.versoes.length, 'versoes.json: começa pela ' + v.versoes[0].versao + ' (' + v.versoes[0].data + '), notas PT e EN iguais às de dados.json, ' + v.versoes.length + ' versões'); }
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(e => console.log('  ✗ erro de página: ' + e)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
