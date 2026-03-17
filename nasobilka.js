// ═══════════════════════════════════════════════════════
// nasobilka.js  —  Hra: Malá násobilka
// ═══════════════════════════════════════════════════════

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyNasobilka } from './vysledky.js';
import { initZebricek } from './zebricek.js';

// ── Konfigurace ───────────────────────────────────────
const CAS = 15; // sekundy

// ── Lokální stav ──────────────────────────────────────
let body = 0;
let casZbyva = CAS;
let timerInterval = null;
let nasA, nasB, soucin;

// ── Inicializace (volá se při přechodu na uvítací obrazovku) ──
export function initNasobilka() {
  document.getElementById('btn-start-nasobilka').onclick    = startHra;
  document.getElementById('btn-zpet-nasobilka').onclick     = () => showScreen('screen-vyber');
  document.getElementById('btn-potvrdit-nas').onclick       = zkontrolovat;
  document.getElementById('btn-zebricek-welcome-nas').onclick = () => initZebricek('screen-welcome-nasobilka', 'nasobilka');
  document.getElementById('inp-odpoved-nas').onkeydown      = e => { if (e.key === 'Enter') zkontrolovat(); };
}

// ── Spuštění hry ──────────────────────────────────────
function startHra() {
  body = 0;
  document.getElementById('lbl-body-nas').textContent     = 0;
  document.getElementById('lbl-rekord-nas').textContent   = stav.osobniMaxNas;
  document.getElementById('lbl-komentar-nas').textContent = '';
  document.getElementById('lbl-komentar-nas').className   = 'komentar';
  document.getElementById('record-hint-nas').textContent  = '';
  showScreen('screen-game-nasobilka');
  novyPriklad();
  document.getElementById('inp-odpoved-nas').focus();
  startTimer();
}

// ── Nový příklad ──────────────────────────────────────
function novyPriklad() {
  nasA   = Math.floor(Math.random() * 9) + 1;
  nasB   = Math.floor(Math.random() * 9) + 1;
  soucin = nasA * nasB;
  const lbl = document.getElementById('lbl-priklad');
  lbl.style.animation = 'none';
  lbl.textContent = `${nasA} • ${nasB}`;
  requestAnimationFrame(() => { lbl.style.animation = 'popIn .3s cubic-bezier(.34,1.56,.64,1)'; });
  document.getElementById('inp-odpoved-nas').value = '';
}

// ── Zkontrolování odpovědi ────────────────────────────
function zkontrolovat() {
  const inp = document.getElementById('inp-odpoved-nas');
  const val = parseInt(inp.value);
  const kom = document.getElementById('lbl-komentar-nas');
  if (isNaN(val)) { kom.textContent = 'Napiš číslo!'; kom.className = 'komentar wrong'; return; }

  if (val === soucin) {
    body++;
    document.getElementById('lbl-body-nas').textContent = body;
    kom.textContent = '✓ Správně!'; kom.className = 'komentar correct';
    updateHint('record-hint-nas', body, stav.osobniMaxNas, stav.globalMaxNas);
    novyPriklad();
    document.getElementById('inp-odpoved-nas').focus();
  } else {
    inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
    kom.textContent = `✗ Správně bylo ${soucin}`; kom.className = 'komentar wrong';
    inp.value = '';
  }
}

// ── Časovač ───────────────────────────────────────────
function startTimer() {
  casZbyva = CAS;
  document.getElementById('lbl-cas-nas').textContent    = CAS;
  document.getElementById('progress-nas').style.width   = '100%';
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    casZbyva--;
    document.getElementById('lbl-cas-nas').textContent  = casZbyva;
    document.getElementById('progress-nas').style.width = (casZbyva / CAS * 100) + '%';
    if (casZbyva <= 0) { clearInterval(timerInterval); zobrazVysledkyNasobilka(body); }
  }, 1000);
}
