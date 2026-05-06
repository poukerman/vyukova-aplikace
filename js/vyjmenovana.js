// vyjmenovana.js — Hra: Vyjmenovaná slova

import { stav, showScreen, updateHint } from './main.js';
import { zobrazVysledkyVyjmenovana } from './vysledky.js';
import { initZebricek } from './zebricek.js';

const POCET_PRIKLADU = 20;

const SLOVA_1 = [
  { veta: 'luční kob_lka',                    odpoved: 'y' },
  { veta: 'b_lý kvítek',                      odpoved: 'í' },
  { veta: 'pěkný slab_kář',                   odpoved: 'i' },
  { veta: 'ab_ch nezapomněla',                odpoved: 'y' },
  { veta: 'starob_lý dům',                    odpoved: 'y' },
  { veta: 'vodní ml_n',                       odpoved: 'ý' },
  { veta: 'm_mořádný úkaz',                   odpoved: 'i' },
  { veta: 'je s_rotek',                       odpoved: 'i' },
  { veta: 'jogurt se zkaz_l',                 odpoved: 'i' },
  { veta: 'V_r sedí na větvi.',               odpoved: 'ý' },
  { veta: 'pohled z v_šiny.',                 odpoved: 'ý' },
  { veta: 'v_roba potravin',                  odpoved: 'ý' },
  { veta: 'bílá p_voňka',                     odpoved: 'i' },
  { veta: 'chlapec pyká a zp_tuje svědomí',   odpoved: 'y' },
  { veta: 'v_měna',                           odpoved: 'ý' },
  { veta: 'km_nová polévka',                  odpoved: 'í' },
  { veta: 'v_hodit smetí',                    odpoved: 'y' },
  { veta: 'prstýnek se bl_ská',               odpoved: 'ý' },
  { veta: 'B_dlíme v novém domě.',            odpoved: 'y' },
  { veta: 'velký vl_v',                       odpoved: 'i' },
];

const SLOVA_2 = [
  { veta: 'ob_vatel starého hradu',            odpoved: 'y' },
  { veta: 'nab_vat zkušenosti',                odpoved: 'ý' },
  { veta: 'b_dliště v centru města',           odpoved: 'y' },
  { veta: 'l_žování v horách',                 odpoved: 'y' },
  { veta: 'marné pl_tvání energií',            odpoved: 'ý' },
  { veta: 'hm_z žije v lese i trávě',         odpoved: 'y' },
  { veta: 'zm_lil se ve výpočtu',             odpoved: 'ý' },
  { veta: 'p_cha předchází pádu',             odpoved: 'ý' },
  { veta: 'p_kat za své chyby',               odpoved: 'y' },
  { veta: 's_r z kravského mléka',            odpoved: 'ý' },
  { veta: 'V_r je noční dravec.',             odpoved: 'ý' },
  { veta: 'jaz_k a řeč jsou spjaty',          odpoved: 'y' },
  { veta: 'naz_val ho svým přítelem',         odpoved: 'ý' },
  { veta: 'z_skat si první místo',            odpoved: 'í' },
  { veta: 'slab_kář pro první třídu',         odpoved: 'i' },
  { veta: 'hrd_nský čin vojáka',              odpoved: 'i' },
  { veta: 'l_bit se každému',                 odpoved: 'í' },
  { veta: 'záv_st kazí přátelství',           odpoved: 'i' },
  { veta: 'čte č_slo na dveřích',             odpoved: 'í' },
  { veta: 'velká s_la přírody',               odpoved: 'í' },
];

let body             = 0;
let celkemOtazek     = 0;
let historiePrikladu = [];
let aktualniSlova    = [];
let aktualniSlovo    = null;
let pouzitaIndexy    = new Set();

export function initVyjmenovana() {
  document.getElementById('btn-stupen-1').onclick = () => startHra(1);
  document.getElementById('btn-stupen-2').onclick = () => startHra(2);
  document.getElementById('btn-zpet-vyjmenovana').onclick      = () => showScreen('screen-vyber');
  document.getElementById('btn-zebricek-welcome-vyjm').onclick = () => initZebricek('screen-welcome-vyjmenovana', 'vyjmenovana');
  document.getElementById('btn-ukoncit-vyjm').onclick          = ukoncitHru;

  document.querySelectorAll('.vyjm-btn').forEach(btn => {
    btn.onclick = () => odpovez(btn.dataset.val);
  });
}

function ukoncitHru() {
  aktualniSlovo = null;
  showScreen('screen-welcome-vyjmenovana');
}

function startHra(stupen) {
  aktualniSlova    = stupen === 1 ? [...SLOVA_1] : [...SLOVA_2];
  body             = 0;
  celkemOtazek     = 0;
  historiePrikladu = [];
  pouzitaIndexy    = new Set();

  document.getElementById('lbl-body-vyjm').textContent     = 0;
  document.getElementById('lbl-rekord-vyjm').textContent   = stav.osobniMaxVyjm;
  document.getElementById('lbl-priklad-vyjm').textContent  = `0/${POCET_PRIKLADU}`;
  document.getElementById('progress-vyjm').style.width     = '0%';
  document.getElementById('lbl-komentar-vyjm').textContent = '';
  document.getElementById('lbl-komentar-vyjm').className   = 'komentar';
  document.getElementById('record-hint-vyjm').textContent  = '';
  document.getElementById('lbl-veta').textContent          = '';

  document.querySelectorAll('.vyjm-btn').forEach(b => { b.disabled = false; });
  showScreen('screen-game-vyjmenovana');
  novaOtazka();
}

function novaOtazka() {
  document.getElementById('lbl-priklad-vyjm').textContent = `${celkemOtazek}/${POCET_PRIKLADU}`;
  document.getElementById('progress-vyjm').style.width   = (celkemOtazek / POCET_PRIKLADU * 100) + '%';

  if (pouzitaIndexy.size >= aktualniSlova.length) {
    pouzitaIndexy = new Set();
  }

  const dostupne = aktualniSlova
    .map((_, i) => i)
    .filter(i => !pouzitaIndexy.has(i));

  const idx = dostupne[Math.floor(Math.random() * dostupne.length)];
  pouzitaIndexy.add(idx);
  aktualniSlovo = aktualniSlova[idx];

  document.getElementById('lbl-veta').innerHTML           = aktualniSlovo.veta.replace('_', '<span class="blank">_</span>');
  document.getElementById('lbl-komentar-vyjm').textContent = '';
  document.getElementById('lbl-komentar-vyjm').className   = 'komentar';
}

function odpovez(val) {
  if (!aktualniSlovo) return;
  document.querySelectorAll('.vyjm-btn').forEach(b => { b.disabled = true; });

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
      document.querySelectorAll('.vyjm-btn').forEach(b => { b.disabled = false; });
      novaOtazka();
    }, prodleva);
  }
}
