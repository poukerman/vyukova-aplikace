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

import { stav, showScreen, ulozSkore, nactiZebricek, updateHint } from './main.js';
import { zobrazVysledkyVyjmenovana } from './vysledky.js';
import { initZebricek } from './zebricek.js';

// ── Konfigurace ───────────────────────────────────────
const POCET_PRIKLADU = 20;

// ── Slovní spojení — 1. stupeň ────────────────────────
const SLOVA_1 = [
  { veta: 'B_l jsem ve škole.',               odpoved: 'y'  },
  { veta: 'Ryba pl_vala v rybníce.',           odpoved: 'y'  },
  { veta: 'Maminka m_je nádobí.',              odpoved: 'y'  },
  { veta: 'Nos_l jsem těžký batoh.',           odpoved: 'i'  },
  { veta: 'Vlak přijel na nádraž_.',           odpoved: 'í'  },
  { veta: 'V_tr foukal celý den.',             odpoved: 'í'  },
  { veta: 'S_r leží na talíři.',               odpoved: 'ý'  },
  { veta: 'Pytel b_l plný brambor.',           odpoved: 'y'  },
  { veta: 'Děti b_dlovaly v táboře.',          odpoved: 'y'  },
  { veta: 'P_cha je zlá vlastnost.',           odpoved: 'ý'  },
  { veta: 'V_r sedí na větvi.',                odpoved: 'ý'  },
  { veta: 'S_n pomohl tatínkovi.',             odpoved: 'y'  },
  { veta: 'Zv_ře uteklo do lesa.',             odpoved: 'í'  },
  { veta: 'Kup_l jsem nový sešit.',            odpoved: 'i'  },
  { veta: 'R_ba pleskla ocasem.',              odpoved: 'y'  },
  { veta: 'Hráli jsme s_lnou hru.',            odpoved: 'i'  },
  { veta: 'Pták v_létl z klece.',              odpoved: 'y'  },
  { veta: 'Dob_tek se páslo na louce.',        odpoved: 'y'  },
  { veta: 'Nab_l jsem dost sil.',              odpoved: 'y'  },
  { veta: 'B_dlíme v novém domě.',             odpoved: 'y'  },
];

// ── Slovní spojení — 2. stupeň ────────────────────────
const SLOVA_2 = [
  { veta: 'Přib_l jsem hřebík do prkna.',     odpoved: 'i'  },
  { veta: 'Zv_davost je dobrá vlastnost.',     odpoved: 'í'  },
  { veta: 'Přem_šlel celé odpoledne.',         odpoved: 'ý'  },
  { veta: 'Nab_l plnou sílu.',                 odpoved: 'y'  },
  { veta: 'Rozb_l vázu omylem.',               odpoved: 'i'  },
  { veta: 'M_slel na prázdniny.',              odpoved: 'y'  },
  { veta: 'Zb_tek chleba dal ptákům.',         odpoved: 'y'  },
  { veta: 'Zb_l mu jen jeden pokus.',          odpoved: 'y'  },
  { veta: 'Splnil všechny pov_nnosti.',        odpoved: 'i'  },
  { veta: 'Pob_val v zahraničí měsíc.',        odpoved: 'y'  },
  { veta: 'Z_skal první místo.',               odpoved: 'í'  },
  { veta: 'Odm_tal pomoci ostatním.',          odpoved: 'í'  },
  { veta: 'Chyb_l v diktátě jen jednou.',      odpoved: 'i'  },
  { veta: 'Prol_til jsem celou knihu.',        odpoved: 'í'  },
  { veta: 'Pob_dil v celém turnaji.',          odpoved: 'í'  },
  { veta: 'S_lil do posledního dechu.',        odpoved: 'í'  },
  { veta: 'Zapom_něl jsem doma klíče.',        odpoved: 'o'  },
  { veta: 'Zl_bil se na bratra.',              odpoved: 'o'  },
  { veta: 'Neum_l odpovědět na otázku.',       odpoved: 'ě'  },
  { veta: 'Ob_val se o kamaráda.',             odpoved: 'á'  },
];

// ── Lokální stav ──────────────────────────────────────
let body             = 0;
let celkemOtazek     = 0;
let historiePrikladu = [];
let aktualniSlova    = [];
let aktualniSlovo    = null;
let pouzitaIndexy    = [];

// ── Inicializace (volá se při přechodu na uvítací obrazovku) ──
export function initVyjmenovana() {
  document.getElementById('btn-stupen-1').onclick              = () => startHra(1);
  document.getElementById('btn-stupen-2').onclick              = () => startHra(2);
  document.getElementById('btn-zpet-vyjmenovana').onclick      = () => showScreen('screen-vyber');
  document.getElementById('btn-zebricek-welcome-vyjm').onclick = () => initZebricek('screen-welcome-vyjmenovana', 'vyjmenovana');
  document.getElementById('btn-ukoncit-vyjm').onclick          = ukoncitHru;

  document.querySelectorAll('.vyjm-btn').forEach(btn => {
    btn.onclick = () => odpovez(btn.dataset.val);
  });
}

// ── Předčasné ukončení hry ────────────────────────────
function ukoncitHru() {
  aktualniSlovo = null;
  showScreen('screen-welcome-vyjmenovana');
}

// ── Spuštění hry ──────────────────────────────────────
function startHra(stupen) {
  aktualniSlova    = stupen === 1 ? [...SLOVA_1] : [...SLOVA_2];
  body             = 0;
  celkemOtazek     = 0;
  historiePrikladu = [];
  pouzitaIndexy    = [];

  document.getElementById('lbl-body-vyjm').textContent      = 0;
  document.getElementById('lbl-rekord-vyjm').textContent    = stav.osobniMaxVyjm;
  document.getElementById('lbl-priklad-vyjm').textContent   = `0/${POCET_PRIKLADU}`;
  document.getElementById('progress-vyjm').style.width      = '0%';
  document.getElementById('lbl-komentar-vyjm').textContent  = '';
  document.getElementById('lbl-komentar-vyjm').className    = 'komentar';
  document.getElementById('record-hint-vyjm').textContent   = '';
  document.getElementById('lbl-veta').textContent           = '';

  showScreen('screen-game-vyjmenovana');
  document.querySelectorAll('.vyjm-btn').forEach(b => b.disabled = false);

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
    pouzitaIndexy = [];
    idx = Math.floor(Math.random() * aktualniSlova.length);
  } else {
    idx = dostupne[Math.floor(Math.random() * dostupne.length)];
  }

  pouzitaIndexy.push(idx);
  aktualniSlovo = aktualniSlova[idx];

  document.getElementById('lbl-veta').innerHTML            = aktualniSlovo.veta.replace('_', '<span class="blank">_</span>');
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
  const vetaHotova = aktualniSlovo.veta.replace('_', aktualniSlovo.odpoved);

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
    tlacitka.forEach(t => {
      if (t.dataset.val === val) {
        t.classList.add('correct-flash');
        setTimeout(() => t.classList.remove('correct-flash'), 400);
      }
    });
  } else {
    kom.textContent = `✗ Správně: ${vetaHotova}`; kom.className = 'komentar wrong';
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
