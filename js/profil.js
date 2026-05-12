// profil.js — Profil hráče

import { stav, showScreen } from './main.js';
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAE_kjebwQrSzeEz9-3c_Y66TUBAvRIjB4',
  authDomain:        'malanasobilka.firebaseapp.com',
  databaseURL:       'https://malanasobilka-default-rtdb.firebaseio.com',
  projectId:         'malanasobilka',
  storageBucket:     'malanasobilka.firebasestorage.app',
  messagingSenderId: '712520835692',
  appId:             '1:712520835692:web:6746f62321750e264a6e49',
};

const APP_NAME = 'eduhry';
const fbApp    = getApps().find(a => a.name === APP_NAME) ?? initializeApp(FIREBASE_CONFIG, APP_NAME);
const db       = getDatabase(fbApp);

const PREDMETY = [
  {
    nazev: 'Matematika', ikona: '🔢',
    hry: [
      { klic: 'nasobilka', nazev: 'Malá násobilka', ikona: '✖️', stavKlic: 'osobniMaxNas',        globalKlic: 'globalMaxNas',        jednotka: 'bodů' },
      { klic: 'mocniny',   nazev: 'Mocniny',        ikona: '🔢', stavKlic: 'osobniMaxMocniny',    globalKlic: 'globalMaxMocniny',    jednotka: 'bodů' },
    ],
  },
  {
    nazev: 'Český jazyk', ikona: '📖',
    hry: [
      { klic: 'vyjmenovana', nazev: 'Vyjmenovaná slova', ikona: '📝', stavKlic: 'osobniMaxVyjm',       globalKlic: 'globalMaxVyjm',       jednotka: '%'   },
      { klic: 'predpony',    nazev: 'Předpony',           ikona: '🔤', stavKlic: 'osobniMaxPredpony',   globalKlic: 'globalMaxPredpony',   jednotka: '%'   },
      { klic: 'pravopis_e',  nazev: 'Pravopis ě',         ikona: '✍️', stavKlic: 'osobniMaxPravopisE',  globalKlic: 'globalMaxPravopisE',  jednotka: '%'   },
    ],
  },
  {
    nazev: 'Informatika', ikona: '💻',
    hry: [
      { klic: 'klavesnice', nazev: 'Klávesnice',   ikona: '⌨️', stavKlic: 'osobniMaxKlavesnice', globalKlic: 'globalMaxKlavesnice', jednotka: 'zn.'  },
      { klic: 'prepis',     nazev: 'Přepis textu', ikona: '📄', stavKlic: 'osobniMaxPrepis',     globalKlic: 'globalMaxPrepis',     jednotka: 'zpm'  },
    ],
  },
];

// ── Handlery tlačítek (volat jednou při startu) ───────
export function initProfilHandlers() {
  document.getElementById('btn-hrat-profil').addEventListener('click', () => showScreen('screen-predmety'));
  document.getElementById('btn-odhlasit-profil').addEventListener('click', () => showScreen('screen-login'));
  document.getElementById('btn-profil-predmety').addEventListener('click', otevriProfil);
}

// ── Načti a zobraz profil ─────────────────────────────
export async function otevriProfil() {
  document.getElementById('profil-jmeno').textContent       = stav.jmeno;
  document.getElementById('profil-trida-badge').textContent = `${stav.trida}. třída`;
  document.getElementById('profil-avatar').textContent      = '⏳';
  document.getElementById('profil-loading').style.display   = 'block';
  document.getElementById('profil-obsah').style.display     = 'none';
  showScreen('screen-profil');

  try {
    const snap    = await get(ref(db, 'hrace'));
    const vsichni = snap.exists()
      ? Object.entries(snap.val()).map(([jmeno, d]) => ({ jmeno, ...d }))
      : [];
    renderProfil(vsichni);
  } catch (_e) {
    document.getElementById('profil-loading').textContent = '❌ Nepodařilo se načíst data.';
  }
}

// ── Vykreslení profilu ────────────────────────────────
function renderProfil(vsichni) {
  const vsechnyHry = PREDMETY.flatMap(p => p.hry);

  // Výpočet pořadí a aktualizace globálních maxim
  const ranky = {};
  for (const hra of vsechnyHry) {
    const osobni    = stav[hra.stavKlic] || 0;
    const spoluZaci = vsichni.filter(h => String(h.trida) === String(stav.trida));

    ranky[hra.klic] = {
      osobni,
      tridniRank:   spoluZaci.filter(h => (h[hra.klic] || 0) > osobni).length + 1,
      tridniCelkem: spoluZaci.length,
      skolniRank:   vsichni.filter(h => (h[hra.klic] || 0) > osobni).length + 1,
      skolniCelkem: vsichni.length,
    };

    const globalMax = Math.max(...vsichni.map(h => h[hra.klic] || 0), 0);
    if (hra.globalKlic in stav) stav[hra.globalKlic] = globalMax;
  }

  // Avatar podle nejlepšího umístění ve škole
  const hrane   = vsechnyHry.filter(h => ranky[h.klic].osobni > 0);
  const minRank = hrane.length > 0 ? Math.min(...hrane.map(h => ranky[h.klic].skolniRank)) : Infinity;
  document.getElementById('profil-avatar').textContent = zvolAvatar(hrane.length, minRank);

  // Sestavení karet podle předmětů
  const container = document.getElementById('profil-rekordy');
  container.innerHTML = '';
  for (const predmet of PREDMETY) {
    const sekce  = document.createElement('div');
    sekce.className = 'profil-sekce';
    const nadpis = document.createElement('div');
    nadpis.className = 'profil-sekce-nadpis';
    nadpis.textContent = `${predmet.ikona} ${predmet.nazev}`;
    sekce.appendChild(nadpis);
    for (const hra of predmet.hry) sekce.appendChild(vytvorRadek(hra, ranky[hra.klic]));
    container.appendChild(sekce);
  }

  document.getElementById('profil-loading').style.display = 'none';
  document.getElementById('profil-obsah').style.display   = 'block';
}

// ── Řádek jedné hry ───────────────────────────────────
function vytvorRadek(hra, r) {
  const hrano = r.osobni > 0;
  const el    = document.createElement('div');
  el.className = 'profil-radek';
  el.innerHTML = `
    <div class="profil-radek-top">
      <span class="profil-hra-icon">${hra.ikona}</span>
      <span class="profil-hra-name">${hra.nazev}</span>
      <span class="profil-hra-result${hrano ? '' : ' dim'}">
        ${hrano ? r.osobni : '—'}${hrano ? `<span class="profil-unit">&thinsp;${hra.jednotka}</span>` : ''}
      </span>
    </div>
    <div class="profil-ranky">
      ${badge('🏫', hrano ? `${r.tridniRank}. v třídě` : 'Nehráno', hrano ? `z&nbsp;${r.tridniCelkem}` : '', hrano ? r.tridniRank : 0)}
      ${hrano ? badge('🌐', `${r.skolniRank}. ve škole`, `z&nbsp;${r.skolniCelkem}`, r.skolniRank) : ''}
    </div>`;
  return el;
}

function badge(icon, text, doplnek, rank) {
  const cls = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : rank === 0 ? 'dim' : '';
  return `<span class="profil-rank ${cls}">${icon} ${text}${doplnek ? ` <span class="profil-z">${doplnek}</span>` : ''}</span>`;
}

function zvolAvatar(pocetHer, nejlepsiRank) {
  if (pocetHer === 0)                              return '🌱';
  if (isFinite(nejlepsiRank) && nejlepsiRank === 1) return '👑';
  if (isFinite(nejlepsiRank) && nejlepsiRank <= 3)  return '🔥';
  if (isFinite(nejlepsiRank) && nejlepsiRank <= 10) return '⭐';
  if (pocetHer >= 5)                               return '😊';
  return '🎮';
}
