// ═══════════════════════════════════════════════════════
// vyjmenovana.js  —  Hra: Vyjmenovaná slova
//
// Chceš upravit slovní spojení?
//   Uprav pole SLOVA_1 (1. stupeň) nebo SLOVA_2 (2. stupeň).
//   Každá položka: { veta, odpoved }
//   - veta:    věta s "_" na místě y/i/ý/í
//   - odpoved: správná hodnota — "y", "i", "ý" nebo "í"
//
// Počet příkladů v jedné hře: konstanta POCET_PRIKLADU
// ═══════════════════════════════════════════════════════

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyVyjmenovana } from './vysledky.js';
import { initZebricek } from './zebricek.js';

// ── Konfigurace ───────────────────────────────────────
const POCET_PRIKLADU = 20;

// ── Slovní spojení — 1. stupeň ────────────────────────
// Tlačítka v UI: y / i / ý / í  — používej pouze tyto odpovědi!
const SLOVA_1 = [
  { veta: 'luční kob_lka',          odpoved: 'y' },
  { veta: 'b_lý kvítek',      odpoved: 'í' },
  { veta: 'pěkný slab_kář',         odpoved: 'i' },
  { veta: 'ab_ch nezapomněla',      odpoved: 'y' },
  { veta: 'starob_lý dům',        odpoved: 'y' },
  { veta: 'vodní ml_n',          odpoved: 'ý' },
  { veta: 'm_mořádný úkaz',      odpoved: 'i' },
  { veta: 'je s_rotek',     odpoved: 'i' },
  { veta: 'jogurt se zkaz_l',      odpoved: 'i' },
  { veta: 'V_r sedí na větvi.',           odpoved: 'ý' },
  { veta: 'pohled z v_šiny.',        odpoved: 'ý' },
  { veta: 'v_roba potravin',        odpoved: 'ý' },
  { veta: 'bílá p_voňka',       odpoved: 'i' },
  { veta: 'chlapec pyká a zp_tuje svědomí',         odpoved: 'y' },
  { veta: 'v_měna',       odpoved: 'ý' },
  { veta: 'km_nová polévka',         odpoved: 'í' },
  { veta: 'v_hodit smetí',   odpoved: 'y' },
  { veta: 'prstýnek se bl_ská',         odpoved: 'ý' },
  { veta: 'B_dlíme v novém domě.',        odpoved: 'y' },
  { veta: 'velký vl_v',       odpoved: 'i' },
];

// ── Slovní spojení — 2. stupeň ────────────────────────
// Tlačítka v UI: y / i / ý / í  — používej pouze tyto odpovědi!
const SLOVA_2 = [
  { veta: 'luční kob_lka',          odpoved: 'y' },
  { veta: 'b_lý kvítek',      odpoved: 'í' },
  { veta: 'pěkný slab_kář',         odpoved: 'i' },
  { veta: 'ab_ch nezapomněla',      odpoved: 'y' },
  { veta: 'starob_lý dům',        odpoved: 'y' },
  { veta: 'vodní ml_n',          odpoved: 'ý' },
  { veta: 'm_mořádný úkaz',      odpoved: 'i' },
  { veta: 'je s_rotek',     odpoved: 'i' },
  { veta: 'jogurt se zkaz_l',      odpoved: 'i' },
  { veta: 'V_r sedí na větvi.',           odpoved: 'ý' },
  { veta: 'pohled z v_šiny.',        odpoved: 'ý' },
  { veta: 'v_roba potravin',        odpoved: 'ý' },
  { veta: 'bílá p_voňka',       odpoved: 'i' },
  { veta: 'chlapec pyká a zp_tuje svědomí',         odpoved: 'y' },
  { veta: 'v_měna',       odpoved: 'ý' },
  { veta: 'km_nová polévka',         odpoved: 'í' },
  { veta: 'v_hodit smetí',   odpoved: 'y' },
  { veta: 'prstýnek se bl_ská',         odpoved: 'ý' },
  { veta: 'B_dlíme v novém domě.',        odpoved: 'y' },
  { veta: 'velký vl_v',       odpoved: 'i' },
];

// ── Lokální stav ──────────────────────────────────────
let body             = 0;
let celkemOtazek     = 0;
let historiePrikladu = [];
let aktualniSlova    = [];
let aktualniSlovo    = null;
let pouzitaIndexy    = [];

// ── Inicializace — volá se vždy při zobrazení výběru stupně ──
export function initVyjmenovana() {
  // Dlaždice stupňů
  document.getElementById('btn-stupen-1').onclick = () => startHra(1);
  document.getElementById('btn-stupen-2').onclick = () => startHra(2);

  // Navigační tlačítka
  document.getElementById('btn-zpet-vyjmenovana').onclick      = () => showScreen('screen-vyber');
  document.getElementById('btn-zebricek-welcome-vyjm').onclick = () => initZebricek('screen-welcome-vyjmenovana', 'vyjmenovana');
  document.getElementById('btn-ukoncit-vyjm').onclick          = ukoncitHru;

  // Herní tlačítka y/i/ý/í
  document.querySelectorAll('.vyjm-btn').forEach(btn => {
    btn.onclick = () => odpovez(btn.dataset.val);
  });
}

// ── Předčasné ukončení hry ────────────────────────────
function ukoncitHru() {
  aktualniSlovo = null;
  initVyjmenovana();
  showScreen('screen-welcome-vyjmenovana');
}

// ── Spuštění hry po výběru stupně ────────────────────
function startHra(stupen) {
  aktualniSlova    = stupen === 1 ? [...SLOVA_1] : [...SLOVA_2];
  body             = 0;
  celkemOtazek     = 0;
  historiePrikladu = [];
  pouzitaIndexy    = [];

  document.getElementById('lbl-body-vyjm').textContent     = 0;
  document.getElementById('lbl-rekord-vyjm').textContent   = stav.osobniMaxVyjm;
  document.getElementById('lbl-priklad-vyjm').textContent  = `0/${POCET_PRIKLADU}`;
  document.getElementById('progress-vyjm').style.width     = '0%';
  document.getElementById('lbl-komentar-vyjm').textContent = '';
  document.getElementById('lbl-komentar-vyjm').className   = 'komentar';
  document.getElementById('record-hint-vyjm').textContent  = '';
  document.getElementById('lbl-veta').textContent          = '';

  document.querySelectorAll('.vyjm-btn').forEach(b => b.disabled = false);
  showScreen('screen-game-vyjmenovana');
  novéSlovo();
}

// ── Nové slovo — bez opakování dokud nevyčerpáme pool ─
function novéSlovo() {
  document.getElementById('lbl-priklad-vyjm').textContent = `${celkemOtazek}/${POCET_PRIKLADU}`;
  document.getElementById('progress-vyjm').style.width   = (celkemOtazek / POCET_PRIKLADU * 100) + '%';

  const dostupne = aktualniSlova
    .map((_, i) => i)
    .filter(i => !pouzitaIndexy.includes(i));

  let idx;
  if (dostupne.length === 0) {
    // Vyčerpali jsme pool — resetujeme a jedeme znovu
    pouzitaIndexy = [];
    idx = Math.floor(Math.random() * aktualniSlova.length);
  } else {
    idx = dostupne[Math.floor(Math.random() * dostupne.length)];
  }

  pouzitaIndexy.push(idx);
  aktualniSlovo = aktualniSlova[idx];

  document.getElementById('lbl-veta').innerHTML           = aktualniSlovo.veta.replace('_', '<span class="blank">_</span>');
  document.getElementById('lbl-komentar-vyjm').textContent = '';
  document.getElementById('lbl-komentar-vyjm').className   = 'komentar';
}

// ── Zpracování odpovědi ───────────────────────────────
function odpovez(val) {
  if (!aktualniSlovo) return;
  document.querySelectorAll('.vyjm-btn').forEach(b => b.disabled = true);

  const kom        = document.getElementById('lbl-komentar-vyjm');
  const tlacitka   = document.querySelectorAll('.vyjm-btn');
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
    document.getElementById('lbl-body-vyjm').textContent = body;
    kom.textContent = `✓ ${vetaHotova}`;
    kom.className   = 'komentar correct';
    updateHint('record-hint-vyjm', body, stav.osobniMaxVyjm, stav.globalMaxVyjm);
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

  if (celkemOtazek >= POCET_PRIKLADU) {
    setTimeout(() => zobrazVysledkyVyjmenovana(body, POCET_PRIKLADU, historiePrikladu), prodleva);
  } else {
    setTimeout(() => {
      document.querySelectorAll('.vyjm-btn').forEach(b => b.disabled = false);
      novéSlovo();
    }, prodleva);
  }
}
