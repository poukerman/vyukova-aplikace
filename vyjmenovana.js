// ═══════════════════════════════════════════════════════
// vyjmenovana.js  —  Hra: Vyjmenovaná slova
//
// Chceš přidat novou kategorii?
//   1. Přidej písmeno do VSECHNY_KAT
//   2. Přidej tlačítko do HTML (screen-welcome-vyjmenovana)
//   3. Přidej slova do Firebase pod vyjmenovana/<písmeno>/
//
// Chceš změnit počet příkladů?
//   Uprav konstantu POCET_PRIKLADU níže.
// ═══════════════════════════════════════════════════════

import { stav, showScreen, db, ref, get, ulozSkore, nactiZebricek, updateHint } from './main.js';
import { zobrazVysledkyVyjmenovana } from './vysledky.js';
import { initZebricek } from './zebricek.js';

// ── Konfigurace ───────────────────────────────────────
const POCET_PRIKLADU = 10;
const VSECHNY_KAT    = ['b', 'l', 'm', 'p', 's', 'v', 'z'];

// ── Lokální stav ──────────────────────────────────────
let body             = 0;
let celkemOtazek     = 0;
let historiePrikladu = [];
let vyjmSlova        = [];
let aktualniSlovo    = null;
let vybranéKategorie = new Set();

// ── Inicializace (volá se při přechodu na uvítací obrazovku) ──
export function initVyjmenovana() {
  document.getElementById('btn-start-vyjmenovana').onclick     = startHra;
  document.getElementById('btn-zpet-vyjmenovana').onclick      = () => showScreen('screen-vyber');
  document.getElementById('btn-vyber-vse').onclick             = vyberVse;
  document.getElementById('btn-zebricek-welcome-vyjm').onclick = () => initZebricek('screen-welcome-vyjmenovana', 'vyjmenovana');
  document.getElementById('btn-ukoncit-vyjm').onclick          = ukoncitHru;

  document.querySelectorAll('.kat-btn').forEach(btn => {
    btn.onclick = () => toggleKategorie(btn);
  });

  document.querySelectorAll('.vyjm-btn').forEach(btn => {
    btn.onclick = () => odpovez(btn.dataset.val);
  });
}

// ── Předčasné ukončení hry ────────────────────────────
function ukoncitHru() {
  aktualniSlovo = null; // zabrání zpracování případné odpovědi
  showScreen('screen-welcome-vyjmenovana');
}

// ── Toggle kategorie ──────────────────────────────────
function toggleKategorie(btn) {
  const kat = btn.dataset.kat;
  if (vybranéKategorie.has(kat)) { vybranéKategorie.delete(kat); btn.classList.remove('selected'); }
  else                           { vybranéKategorie.add(kat);    btn.classList.add('selected'); }
  document.getElementById('kat-error').textContent = '';
}

function vyberVse() {
  const vsechnyVybrany = VSECHNY_KAT.every(k => vybranéKategorie.has(k));
  if (vsechnyVybrany) {
    vybranéKategorie.clear();
    document.querySelectorAll('.kat-btn').forEach(b => b.classList.remove('selected'));
  } else {
    VSECHNY_KAT.forEach(k => vybranéKategorie.add(k));
    document.querySelectorAll('.kat-btn').forEach(b => b.classList.add('selected'));
  }
  document.getElementById('kat-error').textContent = '';
}

// ── Spuštění hry ──────────────────────────────────────
async function startHra() {
  if (vybranéKategorie.size === 0) {
    document.getElementById('kat-error').textContent = '⚠️ Vyber aspoň jednu kategorii!';
    return;
  }

  body             = 0;
  celkemOtazek     = 0;
  historiePrikladu = [];

  document.getElementById('lbl-body-vyjm').textContent      = 0;
  document.getElementById('lbl-rekord-vyjm').textContent    = stav.osobniMaxVyjm;
  document.getElementById('lbl-priklad-vyjm').textContent   = `0/${POCET_PRIKLADU}`;
  document.getElementById('progress-vyjm').style.width      = '0%';
  document.getElementById('lbl-komentar-vyjm').textContent  = '';
  document.getElementById('lbl-komentar-vyjm').className    = 'komentar';
  document.getElementById('record-hint-vyjm').textContent   = '';
  document.getElementById('lbl-veta').textContent           = 'Načítám...';

  showScreen('screen-game-vyjmenovana');
  document.querySelectorAll('.vyjm-btn').forEach(b => b.disabled = true);

  vyjmSlova = await nactiKategorie([...vybranéKategorie]);
  if (vyjmSlova.length === 0) {
    document.getElementById('lbl-veta').textContent = '⚠️ V databázi nejsou žádná slova!';
    return;
  }

  document.querySelectorAll('.vyjm-btn').forEach(b => b.disabled = false);
  novéSlovo();
}

// ── Firebase: načtení slov vybraných kategorií ────────
async function nactiKategorie(kategorie) {
  const vysledky = [];
  for (const kat of kategorie) {
    const snap = await get(ref(db, `vyjmenovana/${kat}`));
    if (snap.exists()) Object.values(snap.val()).forEach(s => vysledky.push(s));
  }
  return vysledky;
}

// ── Nové slovo ────────────────────────────────────────
function novéSlovo() {
  document.getElementById('lbl-priklad-vyjm').textContent = `${celkemOtazek}/${POCET_PRIKLADU}`;
  document.getElementById('progress-vyjm').style.width   = (celkemOtazek / POCET_PRIKLADU * 100) + '%';

  const idx = Math.floor(Math.random() * vyjmSlova.length);
  aktualniSlovo = vyjmSlova[idx];

  document.getElementById('lbl-veta').innerHTML            = aktualniSlovo.veta.replace('___', '<span class="blank">___</span>');
  document.getElementById('lbl-komentar-vyjm').textContent = '';
  document.getElementById('lbl-komentar-vyjm').className   = 'komentar';
}

// ── Odpověď ───────────────────────────────────────────
function odpovez(val) {
  if (!aktualniSlovo) return;
  document.querySelectorAll('.vyjm-btn').forEach(b => b.disabled = true);

  const kom        = document.getElementById('lbl-komentar-vyjm');
  const tlacitka   = document.querySelectorAll('.vyjm-btn');
  const spravne    = val === aktualniSlovo.odpoved;
  const vetaHotova = aktualniSlovo.veta.replace('___', aktualniSlovo.odpoved);

  historiePrikladu.push({
    veta:               aktualniSlovo.veta,
    spravnaOdpoved:     aktualniSlovo.odpoved,
    uzivatelovaOdpoved: val,
    spravne,
    vetaHotova
  });

  celkemOtazek++;

  if (spravne) {
    body++;
    document.getElementById('lbl-body-vyjm').textContent = body;
    kom.textContent = `✓ ${vetaHotova}`; kom.className = 'komentar correct';
    updateHint('record-hint-vyjm', body, stav.osobniMaxVyjm, stav.globalMaxVyjm);
    tlacitka.forEach(t => { if (t.dataset.val === val) { t.classList.add('correct-flash'); setTimeout(() => t.classList.remove('correct-flash'), 400); } });
  } else {
    kom.textContent = `✗ Správně: ${vetaHotova}`; kom.className = 'komentar wrong';
    tlacitka.forEach(t => { if (t.dataset.val === val) { t.classList.add('wrong-flash'); setTimeout(() => t.classList.remove('wrong-flash'), 400); } });
  }

  aktualniSlovo = null;
  const prodleva = spravne ? 600 : 1000;

  if (celkemOtazek >= POCET_PRIKLADU) {
    setTimeout(() => zobrazVysledkyVyjmenovana(body, POCET_PRIKLADU, historiePrikladu), prodleva);
  } else {
    setTimeout(() => {
      document.querySelectorAll('.vyjm-btn').forEach(b => b.disabled = false);
      novéSlovo();
    }, prodleva);
  }
}
