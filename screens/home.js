// screens/home.js — 메인 홈

export function render() {
  syncStore();
  const globalStore = window.parent?.__PC_GLOBAL_STORE__;
  const toolbarEnabled = globalStore?.config?.toolbarEnabled || false;

  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:var(--radius-md);border:0.5px solid var(--divider);padding:14px 18px;margin-bottom:14px;box-shadow:var(--shadow);">
      <div>
        <div style="font-size:15px;font-weight:600;color:var(--text-primary);" id="pc-toolbar-label">NSFW Toolbar ${toolbarEnabled?'ON':'OFF'}</div>

      </div>
      <div id="pc-toolbar-btn" onclick="pcToggleToolbar()" style="width:48px;height:28px;border-radius:14px;cursor:pointer;transition:background .2s;position:relative;flex-shrink:0;background:${toolbarEnabled?'#1a1a1a':'#c0ccd8'};">
        <div id="pc-toolbar-thumb" style="position:absolute;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:left .2s;left:${toolbarEnabled?'23px':'3px'};"></div>
      </div>
    </div>
    <div class="section-label">APPS</div>
    <div class="app-grid">
      ${appItem('profile',   'Profile',        profileIcon())}
      ${appItem('erogenous', 'Erogenous Zone', erogenousIcon())}
      ${appItem('lasttouch', 'Last Touch',     lastTouchIcon())}
      ${appItem('redflag',   'Red Flag',       redFlagIcon())}
      ${appItem('survey',    'Survey',         surveyIcon())}
      ${appItem('clinic',    'Clinic',         clinicIcon())}
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

  const name = charName || '?';
  document.getElementById('home-vault-name').textContent = name + "'s Vault";
  document.getElementById('home-vault-avatar').textContent = name.charAt(0).toUpperCase();
}

window.pcToggleToolbar = function() {
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs) return;
  const newVal = !gs.config.toolbarEnabled;
  gs.config.toolbarEnabled = newVal;
  if (window.parent?.__PC_SAVE__) window.parent.__PC_SAVE__();
  if (window.parent?.__PC_TOOLBAR_TOGGLE__) window.parent.__PC_TOOLBAR_TOGGLE__(newVal);
  document.getElementById('pc-toolbar-label').textContent = `NSFW Toolbar ${newVal?'ON':'OFF'}`;
  document.getElementById('pc-toolbar-btn').style.background = newVal ? '#1a1a1a' : '#c0ccd8';
  document.getElementById('pc-toolbar-thumb').style.left = newVal ? '23px' : '3px';
};

// 툴바 닫기 버튼에서 호출 시 토글 상태 동기화
window.pcSyncToolbarToggle = function(val) {
  const label = document.getElementById('pc-toolbar-label');
  const btn   = document.getElementById('pc-toolbar-btn');
  const thumb = document.getElementById('pc-toolbar-thumb');
  if (label) label.textContent = `NSFW Toolbar ${val?'ON':'OFF'}`;
  if (btn)   btn.style.background = val ? '#1a1a1a' : '#c0ccd8';
  if (thumb) thumb.style.left = val ? '23px' : '3px';
};

function appItem(id, name, iconSvg) {
  return `<div class="app-item" onclick="router.go('${id}')"><div class="app-icon-wrap">${iconSvg}</div><span class="app-item-name">${name}</span></div>`;
}

function profileIcon()   { return `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`; }
function erogenousIcon() { return `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`; }
function lastTouchIcon() { return `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`; }
function redFlagIcon()   { return `<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`; }
function surveyIcon()    { return `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`; }
function clinicIcon()    { return `<svg viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`; }
