// ═══════════════════════════════════════════════════════
// auth.js  —  Přihlášení a výběr hry
// ═══════════════════════════════════════════════════════

import { stav, showScreen, nactiHrace, nactiZebricek } from './main.js';
import { initNasobilka } from './nasobilka.js';
import { initVyjmenovana } from './vyjmenovana.js';
import { initZebricek } from './zebricek.js';

export function initAuth() {
  document.getElementById('btn-prihlasit').addEventListener('click', prihlasit);
  document.getElementById('inp-username').addEventListener('keydown', e => { if (e.key === 'Enter') prihlasit(); });
  document.getElementById('btn-volba-nasobilka').addEventListener('click', () => volbaHry('nasobilka'));
  document.getElementById('btn-volba-vyjmenovana').addEventListener('click', () => volbaHry('vyjmenovana'));
  document.getElementById('btn-zebricek-login').addEventListener('click', () => initZebricek('screen-login', 'nasobilka'));
  document.getElementById('btn-zebricek-vyber').addEventListener('click', () => initZebricek('screen-vyber', 'nasobilka'));
}

async function prihlasit() {
  const inp = document.getElementById('inp-username');
  const err = document.getElementById('login-error');
  const username = inp.value.trim().toLowerCase();

  if (!username)           { err.textContent = 'Zadej uživatelské jméno!'; return; }
  if (username.length < 2) { err.textContent = 'Jméno musí mít aspoň 2 znaky.'; return; }

  err.textContent = 'Přihlašuji...';
  try {
    const hrac = await nactiHrace(username);
    if (!hrac) { err.textContent = '❌ Uživatelské jméno nebylo nalezeno.'; return; }

    stav.jmeno         = username;
    stav.trida         = hrac.trida        || '';   // ← načtení třídy
    stav.osobniMaxNas  = hrac.nasobilka    || 0;
    stav.osobniMaxVyjm = hrac.vyjmenovana  || 0;

    const zbNas  = await nactiZebricek('nasobilka');
    const zbVyjm = await nactiZebricek('vyjmenovana');
    stav.globalMaxNas  = zbNas.length  > 0 ? zbNas[0].max  : 0;
    stav.globalMaxVyjm = zbVyjm.length > 0 ? zbVyjm[0].max : 0;

    document.getElementById('lbl-username').textContent = username;
    err.textContent = '';
    showScreen('screen-vyber');
  } catch(e) { err.textContent = 'Chyba: ' + e.message; }
}

function volbaHry(hra) {
  stav.aktualniHra = hra;
  if (hra === 'nasobilka') {
    document.getElementById('lbl-osobni-nas').textContent = stav.osobniMaxNas;
    document.getElementById('lbl-global-nas').textContent = stav.globalMaxNas;
    initNasobilka();
    showScreen('screen-welcome-nasobilka');
  } else {
    document.getElementById('lbl-osobni-vyjm').textContent = stav.osobniMaxVyjm;
    document.getElementById('lbl-global-vyjm').textContent = stav.globalMaxVyjm;
    initVyjmenovana();
    showScreen('screen-welcome-vyjmenovana');
  }
}
