// zebricek.js — Žebříček (třída + globál)

import { stav, showScreen, nactiZebricek, nactiZebricekTridy } from './main.js';

const MEDALS  = ['🥇', '🥈', '🥉'];
const CLASSES = ['gold', 'silver', 'bronze'];

let zpetScreen  = 'screen-vyber';
let aktualniTab = 'nasobilka';

export async function initZebricek(odkud, tab) {
  zpetScreen  = odkud || 'screen-vyber';
  aktualniTab = tab   || 'nasobilka';

  showScreen('screen-leaderboard');
  aktualizujTaby();

  document.getElementById('lb-tab-nas').onclick  = () => prepniTab('nasobilka');
  document.getElementById('lb-tab-vyjm').onclick = () => prepniTab('vyjmenovana');
  document.getElementById('btn-zpet-lb').onclick = () => showScreen(stav.jmeno ? zpetScreen : 'screen-login');

  await renderZebricek(aktualniTab);
}

function prepniTab(tab) {
  aktualniTab = tab;
  aktualizujTaby();
  renderZebricek(tab);
}

function aktualizujTaby() {
  document.getElementById('lb-tab-nas').classList.toggle('active',  aktualniTab === 'nasobilka');
  document.getElementById('lb-tab-vyjm').classList.toggle('active', aktualniTab === 'vyjmenovana');
}

async function renderZebricek(hra) {
  const list = document.getElementById('lb-list');
  list.innerHTML = '<li class="text-center text-muted py-4">Načítám...</li>';

  try {
    let html = '';

    if (stav.trida) {
      const zbTrida = await nactiZebricekTridy(hra, stav.trida);
      if (zbTrida.length > 0) {
        const radky = zbTrida.map((h, i) => radek(h, i, false)).join('');
        html += `<div class="lb-sekce-title">🏫 Moje třída (${stav.trida})</div><ul class="lb-list-inner">${radky}</ul>`;
      }
    }

    const zbGlobal = await nactiZebricek(hra);
    if (zbGlobal.length > 0) {
      const radky = zbGlobal.map((h, i) => radek(h, i, true)).join('');
      html += `<div class="lb-sekce-title" style="margin-top:${stav.trida ? '20px' : '0'}">🌍 Celá škola</div><ul class="lb-list-inner">${radky}</ul>`;
    }

    list.innerHTML = html || '<li class="text-center text-muted py-4">Zatím žádné skóre</li>';
  } catch (_e) {
    list.innerHTML = '<li class="text-center text-muted py-4">Chyba načítání</li>';
  }
}

function radek(h, i, zobrazTridu) {
  const jeJa    = h.name === stav.jmeno;
  const tridaBadge = zobrazTridu && h.trida ? ` <span class="lb-trida">${h.trida}</span>` : '';
  return `
    <li class="lb-item ${i < 3 ? CLASSES[i] : ''} ${jeJa ? 'me' : ''}">
      <span class="lb-rank">${i < 3 ? MEDALS[i] : i + 1}</span>
      <span class="lb-name">${h.name}${tridaBadge}${jeJa ? ' (ty)' : ''}</span>
      <span class="lb-score">${h.max}</span>
    </li>`;
}
