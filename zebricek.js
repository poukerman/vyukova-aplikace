// ═══════════════════════════════════════════════════════
// zebricek.js  —  Žebříček
// ═══════════════════════════════════════════════════════

import { stav, showScreen, nactiZebricek } from './main.js';

let zpetScreen   = 'screen-vyber';
let aktualniTab  = 'nasobilka';

// ── Otevření žebříčku ─────────────────────────────────
export async function initZebricek(odkud, tab) {
  zpetScreen  = odkud || 'screen-vyber';
  aktualniTab = tab   || 'nasobilka';

  showScreen('screen-leaderboard');
  document.getElementById('lb-tab-nas').classList.toggle('active', aktualniTab === 'nasobilka');
  document.getElementById('lb-tab-vyjm').classList.toggle('active', aktualniTab === 'vyjmenovana');

  document.getElementById('lb-tab-nas').onclick  = () => prepniTab('nasobilka');
  document.getElementById('lb-tab-vyjm').onclick = () => prepniTab('vyjmenovana');
  document.getElementById('btn-zpet-lb').onclick = () => showScreen(stav.jmeno ? zpetScreen : 'screen-login');

  await renderZebricek(aktualniTab);
}

function prepniTab(tab) {
  aktualniTab = tab;
  document.getElementById('lb-tab-nas').classList.toggle('active',  tab === 'nasobilka');
  document.getElementById('lb-tab-vyjm').classList.toggle('active', tab === 'vyjmenovana');
  renderZebricek(tab);
}

async function renderZebricek(hra) {
  const list = document.getElementById('lb-list');
  list.innerHTML = '<li style="text-align:center;color:#aaa;padding:20px">Načítám...</li>';
  try {
    const zb      = await nactiZebricek(hra);
    const medals  = ['🥇','🥈','🥉'];
    const classes = ['gold','silver','bronze'];
    if (zb.length === 0) {
      list.innerHTML = '<li style="text-align:center;color:#aaa;padding:20px">Zatím žádné skóre</li>';
      return;
    }
    list.innerHTML = zb.map((h,i) => `
      <li class="lb-item ${i<3?classes[i]:''} ${h.name===stav.jmeno?'me':''}">
        <span class="lb-rank">${i<3?medals[i]:i+1}</span>
        <span class="lb-name">${h.name}${h.name===stav.jmeno?' (ty)':''}</span>
        <span class="lb-score">${h.max}</span>
      </li>`).join('');
  } catch(e) {
    list.innerHTML = '<li style="text-align:center;color:#aaa;padding:20px">Chyba načítání</li>';
  }
}
