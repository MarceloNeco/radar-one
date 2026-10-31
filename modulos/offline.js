/* offline.js: usar sem internet e atalho na tela inicial (F1-PR8, 31/10/2026; diretriz "Usar sem internet e atalho na tela inicial").
   - registra o sw.js (código e JSON com rede primeiro e prazo de 4 s; o pesado com cache primeiro); o nome do cache leva a pasta do app
   - selo discreto "Sem internet — usando a cópia do aparelho" enquanto a conexão estiver fora
   - Configurações → "Usar sem internet": Salvar no aparelho (a lista de offline.json, com o tamanho antes), situação da cópia
     (versão, data e MB), Atualizar, Apagar cópia; Criar atalho na tela inicial (janela do navegador quando há; iPhone: os 3
     passos; já instalado: diz que já está); navegador da Samsung: instalar pelo Chrome, com aviso em Hoje ("Agora não")
   O que sai daqui: window.Offline = { secao, salvar, apagar, situacao }. Chaves locais: planos2026:offline (meta da cópia),
   planos2026:samsung-ciente, planos2026:instalado. Nada sai para a internet além dos próprios arquivos do site. */
const EN = (window.IDIOMA || 'pt') === 'en';
function T(p, e) { return EN ? e : p; }
const BASE = new URL('../', import.meta.url);
const APP = BASE.pathname.replace(/^\/|\/$/g, '').replace(/[^a-z0-9-]+/gi, '-') || 'raiz';   /* a mesma regra do sw.js */
const PACOTE = 'dgo-' + APP + '-pacote', K = 'planos2026:offline';
const MES = { pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
const ua = navigator.userAgent || '';
const samsung = /SamsungBrowser/i.test(ua), iphone = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
function instalado() { try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } }
function mk(t, c, x) { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
function le(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
function grava(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function dataBR(iso) { const d = new Date(iso); if (isNaN(d)) return '?'; const dd = String(d.getDate()).padStart(2, '0'), m = EN ? MES.en[d.getMonth()] : MES.pt[d.getMonth()]; return EN ? m + '/' + dd + '/' + d.getFullYear() : dd + '/' + m + '/' + d.getFullYear(); }
function mb(b) { return (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace(/\.0$/, '').replace('.', EN ? '.' : ',') + ' MB'; }

/* ---- service worker: com sinal abre a web; sem sinal, a cópia ---- */
if ('serviceWorker' in navigator) {
  try { navigator.serviceWorker.register(new URL('sw.js', BASE).href, { scope: BASE.pathname }).catch(function () {}); } catch (e) {}
}

/* ---- selo "Sem internet" ---- */
let selo = null;
function pintaSelo() {
  const off = navigator.onLine === false;
  if (!selo) { selo = mk('div', 'offline-selo', T('Sem internet — usando a cópia do aparelho', 'No internet — using the copy on this device')); selo.id = 'offline-selo'; selo.setAttribute('role', 'status'); selo.hidden = true; document.body.appendChild(selo); }
  selo.hidden = !off;
}
addEventListener('online', pintaSelo); addEventListener('offline', pintaSelo); pintaSelo();

/* ---- a cópia no aparelho (o pacote de offline.json) ---- */
let lista = null;
async function listaDoPacote() {
  if (lista) return lista;
  const r = await fetch(new URL('offline.json', BASE).href, { cache: 'no-cache' }); if (!r.ok) throw new Error('offline.json ' + r.status);
  lista = await r.json(); return lista;
}
function situacao() {
  const m = le(K);
  if (!m) return T('Sem cópia salva. Com sinal, o site abre da web; sem sinal, abre só o que já foi usado neste aparelho.', 'No copy saved. With signal, the site opens from the web; without it, only what was already used on this device opens.');
  return T('Cópia offline: versão ', 'Offline copy: version ') + m.versao + T(', salva em ', ', saved on ') + dataBR(m.em) + ' · ' + mb(m.bytes) + (m.parcial ? T(' (incompleta: faltaram ' + m.parcial + ' arquivos)', ' (incomplete: ' + m.parcial + ' files missing)') : '');
}
let salvando = false;
async function salvar(aoAndar) {
  if (salvando || !window.caches) return false; salvando = true;
  try {
    const l = await listaDoPacote(), c = await caches.open(PACOTE); let bytes = 0, falhas = 0, n = 0;
    for (const a of l.arquivos) {
      n++; if (aoAndar) aoAndar(n, l.arquivos.length);
      try { const r = await fetch(new URL(a.a, BASE).href, { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status); bytes += a.b || 0; await c.put(new URL(a.a, BASE).href, r); }
      catch (e) { falhas++; }
    }
    grava(K, { versao: l.versao, em: new Date().toISOString(), bytes: bytes, parcial: falhas || 0 });
    return falhas === 0;
  } finally { salvando = false; }
}
async function apagar() { try { if (window.caches) await caches.delete(PACOTE); } catch (e) {} grava(K, null); }

/* ---- atalho na tela inicial ---- */
let deferido = null;
addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferido = e; });
addEventListener('appinstalled', function () { deferido = null; grava('planos2026:instalado', true); });
function intentChrome() {
  const u = location.host + location.pathname + location.search;
  return 'intent://' + u + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(location.href) + ';end';
}
function passos(msg) {
  msg.textContent = '';
  if (instalado()) { msg.textContent = T('Já está na tela inicial.', 'Already on the home screen.'); return; }
  if (samsung) {
    msg.appendChild(mk('b', null, T('No navegador da Samsung, instale pelo Chrome.', 'In the Samsung browser, install through Chrome.')));
    const ol = mk('ol'); [T('Toque em "Abrir no Chrome" abaixo.', 'Tap "Open in Chrome" below.'), T('No Chrome, toque em ⋮ e em "Instalar app" (ou "Adicionar à tela inicial").', 'In Chrome, tap ⋮ and "Install app" (or "Add to Home screen").'), T('Já apareceu o alerta do Play Protect aqui? Toque em OK e siga os passos: o app não tem risco; o alerta vem do pacote que o navegador da Samsung monta.', 'Did the Play Protect alert show up here? Tap OK and follow the steps: the app carries no risk; the alert comes from the package the Samsung browser builds.')].forEach(function (t) { ol.appendChild(mk('li', null, t)); });
    msg.appendChild(ol);
    const a = mk('a', 'chip-cat', T('Abrir no Chrome', 'Open in Chrome')); a.href = intentChrome(); msg.appendChild(a);
    msg.appendChild(mk('p', 'oc-nota', T('Os dados guardados só neste navegador não passam sozinhos para o Chrome: faça a cópia (backup) antes.', 'Data kept only in this browser does not move to Chrome by itself: make a backup first.')));
    return;
  }
  if (deferido) { deferido.prompt(); deferido.userChoice.then(function () { deferido = null; passos(msg); }).catch(function () {}); msg.textContent = T('Confirme na janela do navegador.', 'Confirm in the browser window.'); return; }
  const ol = mk('ol');
  (iphone ? [T('Toque em Compartilhar (o quadrado com a seta para cima).', 'Tap Share (the square with the arrow up).'), T('Role e toque em "Adicionar à Tela de Início".', 'Scroll and tap "Add to Home Screen".'), T('Toque em "Adicionar".', 'Tap "Add".')]
          : [T('Toque em ⋮ (menu do navegador).', 'Tap ⋮ (browser menu).'), T('Toque em "Instalar app" ou "Adicionar à tela inicial".', 'Tap "Install app" or "Add to Home screen".'), T('Confirme.', 'Confirm.')]).forEach(function (t) { ol.appendChild(mk('li', null, t)); });
  msg.appendChild(ol);
  const ja = mk('button', 'chip-cat', T('Já instalei', 'Done, it is installed')); ja.type = 'button';
  ja.addEventListener('click', function () { grava('planos2026:instalado', true); msg.textContent = T('Combinado: o ícone está na tela inicial.', 'Great: the icon is on the home screen.'); });
  msg.appendChild(ja);
}

/* ---- a seção das Configurações ---- */
function secao() {
  const s = mk('div', 'oc-sec'); s.id = 'off-sec';
  s.appendChild(mk('span', 'oc-rot', T('Usar sem internet', 'Use without internet')));
  const sit = mk('p', 'oc-nota', situacao()); sit.id = 'off-sit'; s.appendChild(sit);
  const l = mk('div', 'sb-l'), msg = mk('div', 'oc-nota off-msg'); msg.id = 'off-msg';
  const bS = mk('button', 'chip-cat', le(K) ? T('Atualizar a cópia', 'Refresh the copy') : T('Salvar no aparelho', 'Save on this device')); bS.type = 'button'; bS.id = 'off-salvar';
  listaDoPacote().then(function (x) { const t = x.arquivos.reduce(function (a, b) { return a + (b.b || 0); }, 0); bS.textContent += ' (' + mb(t) + ')'; }).catch(function () {});
  bS.addEventListener('click', function () {
    if (navigator.onLine === false) { msg.textContent = T('Sem internet agora: a cópia é baixada quando houver sinal.', 'No internet now: the copy downloads when there is signal.'); return; }
    bS.disabled = true;
    salvar(function (n, t) { msg.textContent = T('Baixando ', 'Downloading ') + n + '/' + t + '…'; }).then(function (ok) {
      sit.textContent = situacao(); msg.textContent = ok ? T('Pronto: o site abre sem internet neste aparelho.', 'Done: the site opens without internet on this device.') : T('A cópia ficou incompleta; toque em Atualizar quando a conexão estiver melhor.', 'The copy is incomplete; tap Refresh when the connection is better.');
      bS.textContent = T('Atualizar a cópia', 'Refresh the copy'); bS.disabled = false; bA.hidden = false;
    }).catch(function () { msg.textContent = T('Não deu para baixar agora.', 'Could not download now.'); bS.disabled = false; });
  });
  const bA = mk('button', 'chip-cat', T('Apagar cópia', 'Delete copy')); bA.type = 'button'; bA.id = 'off-apagar'; bA.hidden = !le(K);
  bA.addEventListener('click', function () { apagar().then(function () { sit.textContent = situacao(); bS.textContent = T('Salvar no aparelho', 'Save on this device'); bA.hidden = true; msg.textContent = T('Cópia apagada.', 'Copy deleted.'); }); });
  const bI = mk('button', 'chip-cat', T('Criar atalho na tela inicial', 'Add to the home screen')); bI.type = 'button'; bI.id = 'off-atalho';
  bI.addEventListener('click', function () { passos(msg); });
  l.appendChild(bS); l.appendChild(bA); l.appendChild(bI); s.appendChild(l); s.appendChild(msg);
  s.appendChild(mk('p', 'oc-nota', T('Com sinal, o site abre sempre a versão da web; sem sinal, abre a cópia guardada aqui. A cópia se atualiza sozinha quando você usa o site conectado.', 'With signal, the site always opens the web version; without it, the copy saved here. The copy refreshes by itself when you use the site online.')));
  return s;
}

/* ---- aviso em Hoje, só no navegador da Samsung ---- */
function avisoSamsung() {
  if (!samsung || instalado() || le('planos2026:samsung-ciente')) return;
  const alvo = document.querySelector('#v-hoje .dest-s'); if (!alvo || document.getElementById('off-aviso')) return;
  const box = mk('div', 'off-aviso'); box.id = 'off-aviso'; box.setAttribute('role', 'note');
  box.appendChild(mk('b', null, T('Vai instalar o RadarONE no celular? Use o Chrome.', 'Installing RadarONE on your phone? Use Chrome.')));
  box.appendChild(mk('p', null, T('Instalar pelo navegador da Samsung dispara um alerta do Play Protect que não tem a ver com este site. Pelo Chrome, instala sem alerta.', 'Installing from the Samsung browser triggers a Play Protect alert unrelated to this site. Through Chrome it installs with no alert.')));
  const l = mk('div', 'sb-l'); const a = mk('a', 'chip-cat', T('Abrir no Chrome', 'Open in Chrome')); a.href = intentChrome(); l.appendChild(a);
  const n = mk('button', 'chip-cat', T('Agora não', 'Not now')); n.type = 'button'; n.addEventListener('click', function () { grava('planos2026:samsung-ciente', true); box.remove(); }); l.appendChild(n);
  box.appendChild(l); alvo.insertAdjacentElement('afterend', box);
}
avisoSamsung();

window.Offline = { secao: secao, salvar: salvar, apagar: apagar, situacao: situacao, pacote: PACOTE };
