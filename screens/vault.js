// screens/vault.js — v2.6

export function render() {
  const name = charName || '?';
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="vault-header">
      <div class="vault-avatar">${name.charAt(0).toUpperCase()}</div>
      <div>
        <div class="vault-name">${esc(name)}'s Vault</div>
        <div class="vault-sub">캐릭터 전용 공간</div>
      </div>
    </div>
    <div class="section-label">CHAR APPS</div>
    <div class="app-grid">
      ${appItem('vault-reviews',   'Reviews',        reviewsIcon())}
      ${appItem('vault-offrecord', 'Off the Record', offRecordIcon())}
      ${appItem('vault-fanfeed',   'Fan Feed',       fanFeedIcon())}
      ${appItem('vault-dreamlog',  'Dream Log',      dreamLogIcon())}
      ${appItem('vault-monologue', 'Monologue',      monologueIcon())}
      ${appItem('vault-settings',  'Settings',       settingsIcon())}
    </div>
  `;
}

function appItem(id, name, iconSvg) {
  return `<div class="app-item" onclick="router.go('${id}')"><div class="app-icon-wrap">${iconSvg}</div><span class="app-item-name">${name}</span></div>`;
}

function reviewsIcon()   { return `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`; }
function offRecordIcon() { return `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`; }
function fanFeedIcon()   { return `<svg viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`; }
function dreamLogIcon()  { return `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`; }
function monologueIcon() { return `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`; }
function settingsIcon()  { return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`; }
