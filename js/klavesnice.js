// klavesnice.js — Hra: Psaní znaků na klávesnici

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyKlavesnice } from './vysledky.js';
import { initZebricek } from './zebricek.js';

// Znaky pro každou úroveň (vlastní přírůstek, bez kumulace)
const UROVEN_ZNAKY = [
  [...'abcdefghijklmnopqrstuvwxyz', ...'áčéěířšúůýž', ...'0123456789'], // 1
  [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],                                      // 2
  [...'ÁČÉĚÍŘŠÚŮÝŽ'],                                                     // 3
  [...'ďťňóĎŤŇÓ'],                                                        // 4
  [],                                                                      // 5 (= 1–4 dohromady)
];

const UROVEN_POPISY = [
  'malá písmena s diakritikou a číslice',
  '+ velká písmena (bez diakritiky)',
  '+ velká písmena s diakritikou',
  '+ ď, ť, ň, ó (malé i velké)',
  'vše dohromady',
];

function znakyProUroven(uroven) {
  return UROVEN_ZNAKY.slice(0, uroven).flat();
}

const CAS_HRY = 120;

// ── Lokální stav ──────────────────────────────────────
let body          = 0;
let aktualniZnak  = null;
let posledniZnak  = null;
let casZbyvajici  = CAS_HRY;
let timerInterval = null;
let keyHandler    = null;
let aktualniUroven = 1;

// ── Inicializace ──────────────────────────────────────
export function initKlavesnice() {
  document.getElementById('lbl-osobni-klav').textContent = stav.jeHost ? '—' : stav.osobniMaxKlavesnice;
  document.getElementById('lbl-global-klav').textContent = stav.jeHost ? '—' : stav.globalMaxKlavesnice;

  document.getElementById('btn-start-klav').onclick            = startHra;
  document.getElementById('btn-zpet-klav').onclick             = () => showScreen('screen-vyber');
  document.getElementById('btn-zebricek-welcome-klav').onclick = () => initZebricek('screen-welcome-klav', 'klavesnice');
  document.getElementById('btn-ukoncit-klav').onclick          = ukoncitHru;

  document.querySelectorAll('.klav-uroven-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      aktualniUroven = Number(btn.dataset.uroven);
      document.querySelectorAll('.klav-uroven-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('klav-uroven-popis').textContent = UROVEN_POPISY[aktualniUroven - 1];
    });
  });
}

// ── Spuštění hry ──────────────────────────────────────
function startHra() {
  body         = 0;
  aktualniZnak = null;
  posledniZnak = null;
  casZbyvajici = CAS_HRY;

  document.getElementById('lbl-body-klav').textContent    = 0;
  document.getElementById('lbl-cas-klav').textContent     = CAS_HRY;
  document.getElementById('lbl-rekord-klav').textContent  = stav.jeHost ? '—' : stav.osobniMaxKlavesnice;
  document.getElementById('progress-klav').style.width    = '100%';
  document.getElementById('lbl-komentar-klav').textContent = '';
  document.getElementById('lbl-komentar-klav').className   = 'komentar';
  document.getElementById('record-hint-klav').textContent  = '';

  keyHandler = e => onKey(e);
  document.addEventListener('keydown', keyHandler);

  showScreen('screen-game-klav');
  novaOtazka();
  startTimer();
}

// ── Časovač ───────────────────────────────────────────
function startTimer() {
  timerInterval = setInterval(() => {
    casZbyvajici--;
    document.getElementById('lbl-cas-klav').textContent  = casZbyvajici;
    document.getElementById('progress-klav').style.width = (casZbyvajici / CAS_HRY * 100) + '%';
    if (casZbyvajici <= 0) {
      clearInterval(timerInterval);
      document.removeEventListener('keydown', keyHandler);
      aktualniZnak = null;
      zobrazVysledkyKlavesnice(body);
    }
  }, 1000);
}

// ── Předčasné ukončení ────────────────────────────────
function ukoncitHru() {
  clearInterval(timerInterval);
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  aktualniZnak = null;
  showScreen('screen-welcome-klav');
}

// ── Nový znak ─────────────────────────────────────────
function novaOtazka() {
  const vsechny  = znakyProUroven(aktualniUroven);
  const dostupne = vsechny.filter(z => z !== posledniZnak);
  aktualniZnak   = dostupne[Math.floor(Math.random() * dostupne.length)];
  posledniZnak   = aktualniZnak;

  document.getElementById('lbl-znak-klav').textContent    = aktualniZnak;
  document.getElementById('lbl-komentar-klav').textContent = '';
  document.getElementById('lbl-komentar-klav').className   = 'komentar';
}

// ── Zpracování klávesy ────────────────────────────────
function onKey(e) {
  if (!aktualniZnak) return;
  if (e.key.length !== 1) return;

  const znakEl = document.getElementById('lbl-znak-klav');
  const kom    = document.getElementById('lbl-komentar-klav');

  if (e.key === aktualniZnak) {
    body++;
    document.getElementById('lbl-body-klav').textContent = body;
    updateHint('record-hint-klav', body, stav.osobniMaxKlavesnice, stav.globalMaxKlavesnice);
    znakEl.classList.add('correct-flash-klav');
    kom.textContent = '✓';
    kom.className   = 'komentar correct';
    setTimeout(() => {
      znakEl.classList.remove('correct-flash-klav');
      novaOtazka();
    }, 150);
  } else {
    znakEl.classList.add('wrong-flash-klav');
    setTimeout(() => znakEl.classList.remove('wrong-flash-klav'), 300);
  }
}
