// auth.js — Přihlášení a výběr hry

import { stav, showScreen, najdiHrace, nactiZebricek } from './main.js';
import { initNasobilka } from './nasobilka.js';
import { initVyjmenovana } from './vyjmenovana.js';
import { initMocniny } from './mocniny.js';
import { initZebricek } from './zebricek.js';

export function initAuth() {
  document.getElementById('btn-prihlasit').addEventListener('click', prihlasit);
  document.getElementById('inp-username').addEventListener('keydown', e => {
    if (e.key === 'Enter') prihlasit();
  });
  document.getElementById('btn-host').addEventListener('click', hostovat);
  document.getElementById('btn-predmet-matematika').addEventListener('click', () => volbaPredmetu('matematika'));
  document.getElementById('btn-predmet-cestina').addEventListener('click', () => volbaPredmetu('cestina'));
  document.getElementById('btn-volba-nasobilka').addEventListener('click', () => volbaHry('nasobilka'));
  document.getElementById('btn-volba-vyjmenovana').addEventListener('click', () => volbaHry('vyjmenovana'));
  document.getElementById('btn-volba-mocniny').addEventListener('click', () => volbaHry('mocniny'));
  document.getElementById('btn-zebricek-login').addEventListener('click', () => initZebricek('screen-login', 'nasobilka'));
  document.getElementById('btn-zebricek-vyber').addEventListener('click', () => initZebricek('screen-vyber', stav.aktualniHra || 'nasobilka'));
  document.getElementById('btn-zebricek-predmety').addEventListener('click', () => initZebricek('screen-predmety', 'nasobilka'));
  document.getElementById('btn-zpet-vyber').addEventListener('click', () => showScreen('screen-predmety'));
}

async function prihlasit() {
  const inp      = document.getElementById('inp-username');
  const err      = document.getElementById('login-error');
  const username = inp.value.trim().toLowerCase();

  if (!username)           { err.textContent = 'Zadej uživatelské jméno!'; return; }
  if (username.length < 2) { err.textContent = 'Jméno musí mít aspoň 2 znaky.'; return; }

  err.textContent = 'Přihlašuji...';
  try {
    const vysledek = await najdiHrace(username);
    if (!vysledek) { err.textContent = '❌ Uživatelské jméno nebylo nalezeno.'; return; }

    const { trida, data } = vysledek;
    stav.jmeno         = username;
    stav.trida         = trida;
    stav.jeHost        = false;
    stav.osobniMaxNas  = data.nasobilka   || 0;
    stav.osobniMaxVyjm = data.vyjmenovana || 0;

    const [zbNas, zbVyjm] = await Promise.all([nactiZebricek('nasobilka'), nactiZebricek('vyjmenovana')]);
    stav.globalMaxNas  = zbNas.length  > 0 ? zbNas[0].max  : 0;
    stav.globalMaxVyjm = zbVyjm.length > 0 ? zbVyjm[0].max : 0;

    nastavUzivateleUI(username, false);
    err.textContent = '';
    showScreen('screen-predmety');
  } catch (e) {
    err.textContent = 'Chyba: ' + e.message;
  }
}

function hostovat() {
  stav.jmeno         = 'Host';
  stav.trida         = '';
  stav.jeHost        = true;
  stav.osobniMaxNas  = 0;
  stav.osobniMaxVyjm = 0;
  stav.globalMaxNas  = 0;
  stav.globalMaxVyjm = 0;

  nastavUzivateleUI('Host', true);
  document.getElementById('login-error').textContent = '';
  showScreen('screen-predmety');
}

function nastavUzivateleUI(jmeno, jeHost) {
  document.getElementById('lbl-username').textContent          = jmeno;
  document.getElementById('lbl-username-predmety').textContent = jmeno;
  document.getElementById('guest-badge').classList.toggle('visible', jeHost);
  document.getElementById('guest-badge-predmety').classList.toggle('visible', jeHost);
}

function volbaPredmetu(predmet) {
  stav.aktualniPredmet = predmet;
  document.querySelectorAll('#screen-vyber .game-card').forEach(card => {
    card.closest('.col-6').style.display = card.dataset.predmet === predmet ? '' : 'none';
  });
  document.getElementById('lbl-username').textContent = stav.jmeno;
  document.getElementById('guest-badge').classList.toggle('visible', stav.jeHost);
  showScreen('screen-vyber');
}

function volbaHry(hra) {
  stav.aktualniHra = hra;
  if (hra === 'nasobilka') {
    document.getElementById('lbl-osobni-nas').textContent = stav.jeHost ? '—' : stav.osobniMaxNas;
    document.getElementById('lbl-global-nas').textContent = stav.jeHost ? '—' : stav.globalMaxNas;
    initNasobilka();
    showScreen('screen-welcome-nasobilka');
  } else if (hra === 'vyjmenovana') {
    initVyjmenovana();
    showScreen('screen-welcome-vyjmenovana');
  } else {
    initMocniny();
    showScreen('screen-welcome-mocniny');
  }
}
