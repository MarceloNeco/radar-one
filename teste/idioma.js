/* Teste de "um HTML, dois idiomas" (F1-PR4):
     - i18n/en.json é o dicionário PT → EN e cobre TODO texto fixo da página (menos o aviso que só existe em inglês, #avi-en)
     - index.html?lang=en abre em inglês (lang, título, IDIOMA); ?lang=pt vence a preferência; sem ?lang, vale a preferência comum
       da SolverONE (dgo:global:idioma)
     - o endereço antigo index-en.html redireciona para ./?lang=en mantendo o #
     - trocar de idioma pelo seletor PT|EN grava a preferência comum e navega com ?lang=
   Uso: node teste/idioma.js */
const { chromium, servir, novoContexto, semear, relatorio } = require('./comum');
const fs = require('fs'), path = require('path');
const PORTA = process.env.PORTA || 8098, BASE = 'http://localhost:' + PORTA;
const { falhas, conferir } = relatorio();
const RAIZ = path.join(__dirname, '..');

/* 1. o dicionário cobre o texto fixo do index.html */
const en = JSON.parse(fs.readFileSync(path.join(RAIZ, 'i18n/en.json'), 'utf8'));
conferir(Object.keys(en).length > 1000, 'i18n/en.json: dicionário com ' + Object.keys(en).length + ' entradas');
let html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
html = html.slice(html.indexOf('<body'));
/* tira o aviso só em inglês (#avi-en), contando os <div> para achar o fechamento certo */
const ini = html.indexOf('<div class="wrap" id="avi-en"');
if (ini > -1) { let i = ini, prof = 0; const re = /<div\b|<\/div>/g; re.lastIndex = ini; let m;
  while ((m = re.exec(html))) { prof += m[0] === '</div>' ? -1 : 1; if (prof === 0) { i = m.index + 6; break; } }
  html = html.slice(0, ini) + html.slice(i); }
html = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<textarea[\s\S]*?<\/textarea>/g, '');
const des = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
const textos = [...new Set((html.match(/>[^<]+</g) || []).map(t => des(t.slice(1, -1)).replace(/\s+/g, ' ').trim()).filter(t => /[A-Za-zÀ-ÿ]{3,}/.test(t)))];
const semTraducao = textos.filter(t => !(t in en));
conferir(semTraducao.length === 0, 'i18n/en.json cobre os ' + textos.length + ' textos fixos do index.html' + (semTraducao.length ? ' (faltam ' + semTraducao.length + ': ' + semTraducao.slice(0, 3).map(t => '"' + t.slice(0, 40) + '"').join(', ') + ')' : ''));

(async () => {
  const srv = await servir(PORTA);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const erros = [];
  const prefs = { 'planos2026:prefs': { aoVisto: true, telaCiente: true }, 'planos2026:novidade-colinha': 1 };
  async function abrir(ctx, url) {
    const p = await ctx.newPage(); p.on('pageerror', e => erros.push(url + ': ' + e.message));
    await p.goto(BASE + '/' + url); await p.waitForSelector('#v-hub', { state: 'attached' });
    await p.waitForFunction(() => window.Colinha, null, { timeout: 15000 }).catch(() => {});
    return p;
  }
  const estado = p => p.evaluate(() => ({ idioma: window.IDIOMA, lang: document.documentElement.lang, titulo: document.title, url: location.pathname + location.search + location.hash,
    pref: localStorage.getItem('dgo:global:idioma'), hub: (document.querySelector('#v-hub h1, #v-hub h2') || {}).textContent || '' }));

  /* 2. ?lang=en abre em inglês */
  let ctx = await novoContexto(browser, 1100, []); await semear(ctx, prefs);
  let p = await abrir(ctx, 'index.html?lang=en#hub'); let e = await estado(p);
  conferir(e.idioma === 'en' && e.lang === 'en-US' && /RadarONE — politicians/.test(e.titulo), 'index.html?lang=en abre em inglês (lang ' + e.lang + ', título "' + e.titulo.slice(0, 30) + '")');
  conferir(e.pref === null, '?lang=en no endereço não mexe na preferência comum (só o seletor grava)');
  /* 3. o endereço antigo redireciona mantendo o # */
  p = await abrir(ctx, 'index-en.html#congresso'); e = await estado(p);   /* #colinha some depois da eleição; #congresso fica */
  conferir(e.url === '/?lang=en#congresso' && e.idioma === 'en', 'index-en.html#congresso redireciona para ' + e.url + ' (mantém o #)');
  await ctx.close();
  /* 4. preferência comum: sem ?lang, abre no idioma guardado; ?lang=pt vence */
  ctx = await novoContexto(browser, 1100, []); await semear(ctx, Object.assign({ 'dgo:global:idioma': 'en' }, prefs));
  p = await abrir(ctx, 'index.html#hub'); e = await estado(p);
  conferir(e.idioma === 'en' && e.lang === 'en-US', 'sem ?lang, a preferência comum dgo:global:idioma = "en" abre em inglês');
  p = await abrir(ctx, 'index.html?lang=pt#hub'); e = await estado(p);
  conferir(e.idioma === 'pt' && e.lang === 'pt-BR', '?lang=pt vence a preferência em inglês');
  await ctx.close();
  /* 5. o seletor PT|EN grava a preferência e navega com ?lang= */
  ctx = await novoContexto(browser, 1100, []); await semear(ctx, prefs);
  p = await abrir(ctx, 'index.html#hub');
  await p.click('#idi-b'); await p.waitForSelector('#idi-pop button', { state: 'visible' });
  await Promise.all([p.waitForURL(/\?lang=en#hub$/, { timeout: 15000 }), p.click('#idi-pop button:has-text("EN-US")')]).then(() => {}, () => {});
  await p.waitForSelector('#v-hub', { state: 'attached' }); e = await estado(p);
  conferir(e.url === '/?lang=en#hub' && e.idioma === 'en' && e.pref === '"en"', 'seletor PT|EN → EN: navega para ' + e.url + ' e grava dgo:global:idioma = ' + e.pref);
  await p.click('#idi-b'); await p.waitForSelector('#idi-pop button', { state: 'visible' });
  await Promise.all([p.waitForURL(/\/#hub$/, { timeout: 15000 }), p.click('#idi-pop button:has-text("PT-BR")')]).then(() => {}, () => {});
  await p.waitForSelector('#v-hub', { state: 'attached' }); e = await estado(p);
  conferir(e.url === '/#hub' && e.idioma === 'pt' && e.pref === '"pt"', 'seletor PT|EN → PT: volta para ' + e.url + ' e grava dgo:global:idioma = ' + e.pref);
  await ctx.close();
  await browser.close(); srv.close();
  if (erros.length) { erros.forEach(x => console.log('  ✗ erro de página: ' + x)); falhas.push('erros de página'); }
  console.log(falhas.length ? '\n✗ ' + falhas.length + ' falha(s)' : '\n✓ tudo certo');
  process.exit(falhas.length ? 1 : 0);
})();
