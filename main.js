// main.js — Peaches & Cream
// Router + Utils + Bridge

// ═══════════════════════════════════════════
// BRIDGE
// ═══════════════════════════════════════════
let store       = {};
let charName    = '{{char}}';
let userName    = '{{user}}';
let charDesc    = '';
let userPersona = '';
let worldInfo   = '';
let generate    = null;
let getChat     = null;
let getChatRange= null;
let saveStore   = null;
let refreshPrompt = null;
let charKey     = 'default';

function initBridge() {
  const p = window.parent;
  if (!p) return;
  store         = p.__PC_STORE__          || {};
  charName      = p.__PC_CHAR__           || '{{char}}';
  userName      = p.__PC_USER__           || '{{user}}';
  charDesc      = p.__PC_CHAR_DESC__      || '';
  userPersona   = p.__PC_USER_PERSONA__   || '';
  worldInfo     = p.__PC_WORLD_INFO__     || '';
  generate      = p.__PC_GENERATE__       || null;
  getChat       = p.__PC_GET_CHAT__       || null;
  getChatRange  = p.__PC_GET_CHAT_RANGE__ || null;
  saveStore     = p.__PC_SAVE__           || null;
  refreshPrompt = p.__PC_REFRESH_PROMPT__ || null;
  charKey       = p.__PC_CHAR_KEY__       || 'default';
}

window.__PC_ON_BRIDGE__ = function() {
  initBridge();
  router.init();
};

// ═══════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════
const SCREENS = {
  'home':           () => import('./screens/home.js').then(m => m.render()),
  'profile':        () => import('./screens/profile.js').then(m => m.render()),
  'erogenous':      () => import('./screens/erogenous.js').then(m => m.render()),
  'lasttouch':      () => import('./screens/lasttouch.js').then(m => m.render()),
  'redflag':        () => import('./screens/redflag.js').then(m => m.render()),
  'survey':         () => import('./screens/survey.js').then(m => m.render()),
  'clinic':         () => import('./screens/clinic.js').then(m => m.render()),
  'vault':          () => import('./screens/vault.js').then(m => m.render()),
  'vault-profile':  () => import('./screens/vault-profile.js').then(m => m.render()),
  'vault-kink':     () => import('./screens/vault-kink.js').then(m => m.render()),
  'vault-reviews':  () => import('./screens/vault-reviews.js').then(m => m.render()),
  'vault-offrecord':() => import('./screens/vault-offrecord.js').then(m => m.render()),
  'vault-fanfeed':  () => import('./screens/vault-fanfeed.js').then(m => m.render()),
  'vault-settings': () => import('./screens/vault-settings.js').then(m => m.render()),
};

const TOPBAR_LABELS = {
  'home':           '🍑 Peaches & Cream',
  'profile':        'Profile',
  'erogenous':      'Erogenous Zone',
  'lasttouch':      'Last Touch',
  'redflag':        'Red Flag',
  'survey':         'Survey',
  'clinic':         'Clinic',
  'vault':          'Vault',
  'vault-profile':  'Profile',
  'vault-kink':     'Kink & Fetish',
  'vault-reviews':  'Reviews',
  'vault-offrecord':'Off the Record',
  'vault-fanfeed':  'Fan Feed',
  'vault-settings': 'Settings',
};

const BACK_MAP = {
  'profile':        'home',
  'erogenous':      'home',
  'lasttouch':      'home',
  'redflag':        'home',
  'survey':         'home',
  'clinic':         'home',
  'vault':          'home',
  'vault-profile':  'vault',
  'vault-kink':     'vault',
  'vault-reviews':  'vault',
  'vault-offrecord':'vault',
  'vault-fanfeed':  'vault',
  'vault-settings': 'vault',
};

const router = {
  current: 'home',

  init() {
    initBridge();
    this.go('home');
  },

  go(screenId) {
    this.current = screenId;
    // 이전 화면 잔재 제거
    document.querySelectorAll('.save-bar, .tab-bar').forEach(el => el.remove());
    // area 스타일 초기화 (fanfeed 등이 직접 수정한 스타일 리셋)
    const areaReset = document.getElementById('scroll-area');
    if (areaReset) { areaReset.style.padding = ''; areaReset.style.background = ''; }
    this._updateTopbar(screenId);
    const area = document.getElementById('scroll-area');
    area.innerHTML = '<div class="loading-card" style="margin:20px 16px;"><div class="sp"></div><span class="loading-text">로딩 중...</span></div>';
    area.scrollTop = 0;
    const fn = SCREENS[screenId];
    if (fn) fn().catch(err => {
      console.error('[PC] screen load error', err);
      area.innerHTML = '<div style="padding:20px;color:#c03020;">화면 로딩 실패</div>';
    });
  },

  _updateTopbar(id) {
    const left   = document.getElementById('topbar-left');
    const center = document.getElementById('topbar-center');
    const right  = document.getElementById('topbar-right');

    right.innerHTML = '<button class="close-btn" onclick="closeApp()">✕</button>';

    if (id === 'home') {
      left.innerHTML  = '';
      center.innerHTML= `<span class="topbar-title">${TOPBAR_LABELS[id]}</span>`;
    } else {
      const backTo = BACK_MAP[id] || 'home';
      const backLabel = backTo === 'home' ? '홈' : 'Vault';
      left.innerHTML  = `<button class="back-btn" onclick="router.go('${backTo}')">← ${backLabel}</button>`;

      let title = TOPBAR_LABELS[id] || id;
      // vault-profile에 캐릭터 이름 붙이기
      if (id === 'vault-profile') title = charName + "'s Profile";
      center.innerHTML= `<span class="topbar-title">${title}</span>`;
    }
  }
};

// ═══════════════════════════════════════════
// GLOBAL UTILS
// ═══════════════════════════════════════════
function closeApp() {
  if (window.parent && window.parent.__PC_CLOSE__) window.parent.__PC_CLOSE__();
  else window.close();
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,'<br>');
}

function showToast(msg) {
  const t = document.getElementById('save-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function showModal({ title, desc, confirmText='확인', onConfirm, danger=false }) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent  = desc;
  const confirmBtn = document.getElementById('modal-confirm');
  confirmBtn.textContent = confirmText;
  confirmBtn.style.background = danger ? '#c03020' : '#000';
  overlay.classList.add('show');
  document.getElementById('modal-cancel').onclick  = () => overlay.classList.remove('show');
  confirmBtn.onclick = () => { overlay.classList.remove('show'); if (onConfirm) onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('show'); };
}

function getSelected(groupId) {
  const g = document.getElementById(groupId);
  if (!g) return '';
  const s = g.querySelector('.pill.sel');
  return s ? s.dataset.val : '';
}

function initBtnGroup(groupId, currentVal) {
  const g = document.getElementById(groupId);
  if (!g) return;
  g.querySelectorAll('.pill').forEach(b => {
    b.classList.toggle('sel', b.dataset.val === currentVal);
  });
  g.addEventListener('click', e => {
    const b = e.target.closest('.pill');
    if (!b) return;
    g.querySelectorAll('.pill').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel');
  });
}

function makeKwTag(val, onRemove) {
  const tag = document.createElement('div');
  tag.className = 'kw-tag';
  tag.innerHTML = `<span class="kw-hash">#</span>${esc(val)}<span class="kw-x">×</span>`;
  tag.querySelector('.kw-x').onclick = () => { tag.remove(); if (onRemove) onRemove(); };
  return tag;
}

function getKwTags(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return [];
  return Array.from(wrap.querySelectorAll('.kw-tag')).map(t =>
    t.textContent.replace('×','').replace('#','').trim()
  );
}

function doSave(fn) {
  if (fn) fn();
  if (saveStore) saveStore();
  if (refreshPrompt) refreshPrompt();
  showToast('저장됐어요 ✓');
  // Save 버튼 유지 — 텍스트만 잠깐 바뀌었다가 복원
  const btn = document.querySelector('.save-btn');
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = '저장됐어요 ✓';
    btn.style.background = '#2a7a40';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 1500);
  }
}

function syncStore() {
  if (window.parent && window.parent.__PC_STORE__) {
    store = window.parent.__PC_STORE__;
  }
}

function getWorldInfo() {
  if (window.parent && window.parent.__PC_WORLD_INFO__) {
    return window.parent.__PC_WORLD_INFO__;
  }
  return worldInfo || '';
}

function getRecentChat(limit) {
  return getChat ? getChat(limit || 20) : [];
}

function buildChatText(limit) {
  return getRecentChat(limit).map(m => `[${m.name||m.role}]: ${m.content}`).join('\n');
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
if (window.parent && window.parent.__PC_STORE__) {
  router.init();
}
