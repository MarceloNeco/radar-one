/* dados.js: os dados do site vêm de dados/*.json (F1-PR2, 31/10/2026). Antes eram 8 blocos JSON dentro do index.html.
   Rede primeiro; se já houver cópia guardada neste aparelho (Cache Storage) e a rede demorar mais de 4 s ou falhar, usa a
   cópia; sem cópia, espera a rede. Depois injeta os <script id="…" type="application/json"> que o código já lê
   (principal.js e eleicoes/congresso.js) e expõe window.__IG__ etc., exatamente como a linha única do index.html 2.5.4
   fazia. O inglês lê dados/en/; o dicionário PT → EN vem de i18n/en.json. Nada sai daqui a não ser esses globais. */
const IDS = ['traden', 'dados', 'ig', 'bio', 'glos', 'patr', 'dlinks', 'proc'];
const EN = (window.IDIOMA || 'pt') === 'en';
const CACHE = 'dgo-radar-one-dados-v1';            /* nome com o app: o sw.js de outro app da mesma origem não apaga */
const BASE = new URL('../', import.meta.url);      /* a pasta do site, venha de onde vier o endereço */
function endereco(id) {
  if (id === 'traden') return new URL('i18n/en.json', BASE).href;          /* o dicionário PT → EN (F1-PR4) */
  return new URL((EN ? 'dados/en/' : 'dados/') + id + '.json', BASE).href;
}
let cache = null;
try { cache = await caches.open(CACHE); } catch (e) { cache = null; }   /* sem Cache Storage (contexto inseguro): só rede */
async function daRede(u, prazo) {
  const ctrl = new AbortController(); const t = prazo ? setTimeout(function () { ctrl.abort(); }, prazo) : null;
  try {
    const r = await fetch(u, { cache: 'no-cache', signal: ctrl.signal });   /* no-cache: confere com o servidor (fura o cache do Pages) */
    if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + u);
    return await r.text();
  } finally { if (t) clearTimeout(t); }
}
async function pega(id) {
  const u = endereco(id);
  const guardada = cache ? await cache.match(u) : null;
  try {
    const texto = await daRede(u, guardada ? 4000 : 0);
    if (cache) cache.put(u, new Response(texto, { headers: { 'content-type': 'application/json; charset=utf-8' } })).catch(function () {});
    return texto;
  } catch (e) {
    if (guardada) return guardada.text();
    throw e;
  }
}
let textos;
try { textos = await Promise.all(IDS.map(pega)); }
catch (e) {
  const p = document.createElement('p'); p.id = 'sem-dados'; p.setAttribute('role', 'alert');
  p.textContent = EN ? 'Could not load the data: no internet and no saved copy on this device. Try again when you are online.'
    : 'Não deu para carregar os dados: sem internet e sem cópia guardada neste aparelho. Tente de novo quando estiver conectado.';
  document.body.prepend(p);
  throw e;
}
IDS.forEach(function (id, i) {
  let s = document.getElementById(id);
  if (!s) { s = document.createElement('script'); s.id = id; s.type = 'application/json'; document.head.appendChild(s); }
  s.textContent = textos[i];
});
const T = {}; IDS.forEach(function (id, i) { T[id] = textos[i]; });
window.__IG__ = JSON.parse(T.ig); window.__BIO__ = JSON.parse(T.bio); window.__GLOS__ = JSON.parse(T.glos);
window.__PATR__ = JSON.parse(T.patr); window.__DLINKS__ = JSON.parse(T.dlinks); window.__PROC__ = JSON.parse(T.proc);
