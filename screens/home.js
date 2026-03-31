// screens/home.js — 메인 홈

export function render() {
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="section-label" style="margin-top:4px;">MY APPS</div>
    <div class="app-grid">
      ${appItem('profile','Profile',profileIcon())}
      ${appItem('erogenous','Erogenous Zone',erogenousIcon())}
      ${appItem('lasttouch','Last Touch',lastTouchIcon())}
      ${appItem('redflag','Red Flag',redFlagIcon())}
      ${appItem('survey','Survey',surveyIcon())}
      ${appItem('clinic','Clinic',clinicIcon())}
    </div>
    <div class="section-label">CHARACTER</div>
    <div class="vault-btn" onclick="router.go('vault')">
      <div class="vault-btn-left">
        <div class="vault-btn-avatar" id="home-vault-avatar">?</div>
        <div>
          <div class="vault-btn-name" id="home-vault-name">Vault</div>
          <div class="vault-btn-sub">캐릭터 전용 공간</div>
        </div>
      </div>
      <span class="vault-chevron">›</span>
    </div>
  `;

  // 캐릭터 이름 업데이트
  const name = charName || '?';
  const el = document.getElementById('home-vault-name');
  const av = document.getElementById('home-vault-avatar');
  if (el) el.textContent = name + "'s Vault";
  if (av) av.textContent = name.charAt(0).toUpperCase();
}

function appItem(id, name, iconSvg) {
  return `
    <div class="app-item" onclick="router.go('${id}')">
      <div class="app-icon-wrap">${iconSvg}</div>
      <span class="app-item-name">${name}</span>
    </div>
  `;
}

function profileIcon() { return `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`; }
function erogenousIcon() { return `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`; }
function lastTouchIcon() { return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`; }
function redFlagIcon() { return `<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`; }
function surveyIcon() { return `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`; }
function clinicIcon() { return `<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`; }
