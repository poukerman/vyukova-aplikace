// ═══════════════════════════════════════════════════════
// zebricek.js  —  Žebříček (třída + globál)
// ═══════════════════════════════════════════════════════

import { stav, showScreen, nactiZebricek, nactiZebricekTridy } from './main.js';

let zpetScreen  = 'screen-vyber';
let aktualniTab = 'nasobilka';

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
    const medals  = ['🥇','🥈','🥉'];
    const classes = ['gold','silver','bronze'];

    // ── Žebříček třídy (jen pokud žák má třídu) ────────
    let trida_html = '';
    if (stav.trida) {
      const zbTrida = await nactiZebricekTridy(hra, stav.trida);
      if (zbTrida.length > 0) {
        const radky = zbTrida.map((h, i) => `
          <li class="lb-item ${i<3?classes[i]:''} ${h.name===stav.jmeno?'me':''}">
            <span class="lb-rank">${i<3?medals[i]:i+1}</span>
            <span class="lb-name">${h.name}${h.name===stav.jmeno?' (ty)':''}</span>
            <span class="lb-score">${h.max}</span>
          </li>`).join('');
        trida_html = `
          <div class="lb-sekce-title">🏫 Moje třída (${stav.trida})</div>
          <ul class="lb-list-inner">${radky}</ul>`;
      }
    }

    // ── Globální žebříček ───────────────────────────────
    const zbGlobal = await nactiZebricek(hra);
    let global_html = '';
    if (zbGlobal.length > 0) {
      const radky = zbGlobal.map((h, i) => `
        <li class="lb-item ${i<3?classes[i]:''} ${h.name===stav.jmeno?'me':''}">
          <span class="lb-rank">${i<3?medals[i]:i+1}</span>
          <span class="lb-name">${h.name}${h.trida ? ` <span class="lb-trida">${h.trida}</span>` : ''}${h.name===stav.jmeno?' (ty)':''}</span>
          <span class="lb-score">${h.max}</span>
        </li>`).join('');
      global_html = `
        <div class="lb-sekce-title" style="margin-top:${stav.trida?'20px':'0'}">🌍 Celá škola</div>
        <ul class="lb-list-inner">${radky}</ul>`;
    }

    if (!trida_html && !global_html) {
      list.innerHTML = '<li style="text-align:center;color:#aaa;padding:20px">Zatím žádné skóre</li>';
    } else {
      list.innerHTML = trida_html + global_html;
    }

  } catch(e) {
    list.innerHTML = '<li style="text-align:center;color:#aaa;padding:20px">Chyba načítání</li>';
  }
}
