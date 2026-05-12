// predpony.js — Hra: Předpony s, z, vz

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyPredpony } from './vysledky.js';
import { initZebricek } from './zebricek.js';

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, get }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

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

const POCET_MAX = 20;

// ── Lokální stav ──────────────────────────────────────
let body             = 0;
let celkemOtazek     = 0;
let pocetPrikladu    = POCET_MAX;
let historiePrikladu = [];
let aktualniSlova    = [];
let aktualniSlovo    = null;
let pouzitaIndexy    = new Set();

// ── Inicializace ──────────────────────────────────────
export function initPredpony() {
  document.getElementById('lbl-osobni-predp').textContent = stav.jeHost ? '—' : stav.osobniMaxPredpony;
  document.getElementById('lbl-global-predp').textContent = stav.jeHost ? '—' : stav.globalMaxPredpony;
  document.getElementById('predp-error').textContent      = '';

  document.getElementById('btn-start-predpony').onclick         = spravnoSpustit;
  document.getElementById('btn-zpet-predpony').onclick          = () => showScreen('screen-vyber');
  document.getElementById('btn-zebricek-welcome-predp').onclick = () => initZebricek('screen-welcome-predpony', 'predpony');
  document.getElementById('btn-ukoncit-predp').onclick          = ukoncitHru;

  document.querySelectorAll('.predp-btn').forEach(btn => {
    btn.onclick = () => odpovez(btn.dataset.val);
  });
}

// ── Spuštění s načtením dat ───────────────────────────
async function spravnoSpustit() {
  const errEl    = document.getElementById('predp-error');
  const btnStart = document.getElementById('btn-start-predpony');

  errEl.textContent    = '';
  btnStart.disabled    = true;
  btnStart.textContent = '⏳ Načítám...';

  try {
    const slova = await nactiSlova();

    btnStart.disabled    = false;
    btnStart.textContent = '▶ Začít hru';

    if (slova.length === 0) {
      errEl.textContent = 'Žádná slovní spojení nebyla nalezena v databázi.';
      return;
    }

    startHra(slova);
  } catch (e) {
    btnStart.disabled    = false;
    btnStart.textContent = '▶ Začít hru';
    errEl.textContent    = 'Chyba načítání: ' + e.message;
  }
}

// ── Načtení slov z Firebase ───────────────────────────
async function nactiSlova() {
  const snap = await get(ref(db, 'predpony/szvzpredpony'));
  if (!snap.exists()) return [];

  const slova = [];
  Object.values(snap.val()).forEach(s => {
    if (s.veta && s.odpoved) {
      slova.push({ veta: s.veta, odpoved: s.odpoved });
    }
  });

  // Fisher-Yates shuffle
  for (let i = slova.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slova[i], slova[j]] = [slova[j], slova[i]];
  }

  return slova;
}

// ── Předčasné ukončení ────────────────────────────────
function ukoncitHru() {
  aktualniSlovo = null;
  showScreen('screen-welcome-predpony');
}

// ── Spuštění hry ──────────────────────────────────────
function startHra(slova) {
  aktualniSlova    = slova;
  pocetPrikladu    = Math.min(POCET_MAX, slova.length);
  body             = 0;
  celkemOtazek     = 0;
  historiePrikladu = [];
  pouzitaIndexy    = new Set();

  document.getElementById('lbl-body-predp').textContent     = 0;
  document.getElementById('lbl-rekord-predp').textContent   = stav.jeHost ? '—' : stav.osobniMaxPredpony;
  document.getElementById('lbl-priklad-predp').textContent  = `0/${pocetPrikladu}`;
  document.getElementById('progress-predp').style.width     = '0%';
  document.getElementById('lbl-komentar-predp').textContent = '';
  document.getElementById('lbl-komentar-predp').className   = 'komentar';
  document.getElementById('record-hint-predp').textContent  = '';
  document.getElementById('lbl-veta-predp').textContent     = '';

  document.querySelectorAll('.predp-btn').forEach(b => { b.disabled = false; });
  showScreen('screen-game-predpony');
  novaOtazka();
}

// ── Nová otázka ───────────────────────────────────────
function novaOtazka() {
  document.getElementById('lbl-priklad-predp').textContent = `${celkemOtazek}/${pocetPrikladu}`;
  document.getElementById('progress-predp').style.width   = (celkemOtazek / pocetPrikladu * 100) + '%';

  if (pouzitaIndexy.size >= aktualniSlova.length) {
    pouzitaIndexy = new Set();
  }

  const dostupne = aktualniSlova
    .map((_, i) => i)
    .filter(i => !pouzitaIndexy.has(i));

  const idx = dostupne[Math.floor(Math.random() * dostupne.length)];
  pouzitaIndexy.add(idx);
  aktualniSlovo = aktualniSlova[idx];

  document.getElementById('lbl-veta-predp').innerHTML       = aktualniSlovo.veta.replace('_', '<span class="blank">_</span>');
  document.getElementById('lbl-komentar-predp').textContent = '';
  document.getElementById('lbl-komentar-predp').className   = 'komentar';
}

// ── Zpracování odpovědi ───────────────────────────────
function odpovez(val) {
  if (!aktualniSlovo) return;
  document.querySelectorAll('.predp-btn').forEach(b => { b.disabled = true; });

  const kom        = document.getElementById('lbl-komentar-predp');
  const tlacitka   = document.querySelectorAll('.predp-btn');
  const spravne    = val === aktualniSlovo.odpoved;
  const vetaHotova = aktualniSlovo.veta.replace('_', aktualniSlovo.odpoved);

  historiePrikladu.push({
    veta:               aktualniSlovo.veta,
    spravnaOdpoved:     aktualniSlovo.odpoved,
    uzivatelovaOdpoved: val,
    spravne,
    vetaHotova,
  });

  celkemOtazek++;

  if (spravne) {
    body++;
    document.getElementById('lbl-body-predp').textContent = body;
    kom.textContent = `✓ ${vetaHotova}`;
    kom.className   = 'komentar correct';
    updateHint('record-hint-predp', body, stav.osobniMaxPredpony, stav.globalMaxPredpony);
    tlacitka.forEach(t => {
      if (t.dataset.val === val) {
        t.classList.add('correct-flash');
        setTimeout(() => t.classList.remove('correct-flash'), 400);
      }
    });
  } else {
    kom.textContent = `✗ Správně: ${vetaHotova}`;
    kom.className   = 'komentar wrong';
    tlacitka.forEach(t => {
      if (t.dataset.val === val) {
        t.classList.add('wrong-flash');
        setTimeout(() => t.classList.remove('wrong-flash'), 400);
      }
    });
  }

  aktualniSlovo = null;
  const prodleva = spravne ? 600 : 1000;

  if (celkemOtazek >= pocetPrikladu) {
    setTimeout(() => zobrazVysledkyPredpony(body, pocetPrikladu, historiePrikladu), prodleva);
  } else {
    setTimeout(() => {
      document.querySelectorAll('.predp-btn').forEach(b => { b.disabled = false; });
      novaOtazka();
    }, prodleva);
  }
}
