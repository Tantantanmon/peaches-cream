// main.js — Peaches & Cream v2.6

let store       = {};
let charName    = '{{char}}';
let userName    = '{{user}}';
let charDesc    = '';
let userPersona = '';
let generate    = null;
let generateWithRole = null;
let getChat     = null;
let getChatRange= null;
let saveStore   = null;
let refreshPrompt = null;
let charKey     = 'default';
let charReaction = '';
let appTokens   = {};

function initBridge() {
  const p = window.parent;
  if (!p) return;
  store         = p.__PC_STORE__          || {};
  charName      = p.__PC_CHAR__           || '{{char}}';
  userName      = p.__PC_USER__           || '{{user}}';
  charDesc      = p.__PC_CHAR_DESC__      || '';
  userPersona   = p.__PC_USER_PERSONA__   || '';
  generate      = p.__PC_GENERATE__       || null;
  generateWithRole = p.__PC_GENERATE__    || null;
  getChat       = p.__PC_GET_CHAT__       || null;
  getChatRange  = p.__PC_GET_CHAT_RANGE__ || null;
  saveStore     = p.__PC_SAVE__           || null;
  refreshPrompt = p.__PC_REFRESH_PROMPT__ || null;
  charKey       = p.__PC_CHAR_KEY__       || 'default';
  charReaction  = p.__PC_CHAR_REACTION__  || '';
  appTokens     = p.__PC_APP_TOKENS__     || {};
}

window.__PC_ON_BRIDGE__ = function() {
  initBridge();
  window.saveStore = saveStore;
  window.refreshPrompt = refreshPrompt;
  router.init();
};

const SCREENS = {
  'home':              () => import('./screens/home.js').then(m => m.render()),
  'profile':           () => import('./screens/profile.js').then(m => m.render()),
  'redflag':           () => import('./screens/redflag.js').then(m => m.render()),
  'clinic':            () => import('./screens/clinic.js').then(m => m.render()),
  'apology':           () => import('./screens/apology.js').then(m => m.render()),
  'vault':             () => import('./screens/vault.js').then(m => m.render()),
  'vault-reviews':     () => import('./screens/vault-reviews.js').then(m => m.render()),
  'vault-offrecord':   () => import('./screens/vault-offrecord.js').then(m => m.render()),
  'vault-worldfeed':   () => import('./screens/vault-worldfeed.js').then(m => m.render()),
  'vault-blackbox':    () => import('./screens/vault-blackbox.js').then(m => m.render()),
  'vault-settings':    () => import('./screens/vault-settings.js').then(m => m.render()),
  'vault-dreamlog':    () => import('./screens/vault-dreamlog.js').then(m => m.render()),
  'vault-wanted':      () => import('./screens/vault-wanted.js').then(m => m.render()),
  'vault-monologue':   () => import('./screens/vault-monologue.js').then(m => m.render()),
  'toolbar-settings':  () => import('./screens/toolbar-settings.js').then(m => m.render()),
};

const TOPBAR_LABELS = {
  'home':             '🍑 Peaches & Cream',
  'profile':          'Profile',
  'redflag':          'Red Flag',
  'clinic':           'Clinic',
  'apology':          'Sorry Not Sorry',
  'vault':            'Vault',
  'vault-reviews':    'Reviews',
  'vault-offrecord':  'Off the Record',
  'vault-worldfeed':  'World Feed',
  'vault-blackbox':   'Blackbox',
  'vault-settings':   'Settings',
  'vault-dreamlog':   'Dream Log',
  'vault-wanted':     'Wanted',
  'vault-monologue':  'Monologue',
  'toolbar-settings': 'Toolbar Settings',
};

const BACK_MAP = {
  'profile':          'home',
  'redflag':          'home',
  'clinic':           'home',
  'apology':          'home',
  'vault':            'home',
  'toolbar-settings': 'home',
  'vault-reviews':    'vault',
  'vault-offrecord':  'vault',
  'vault-worldfeed':  'vault',
  'vault-blackbox':   'vault',
  'vault-settings':   'vault',
  'vault-dreamlog':   'vault',
  'vault-wanted':     'vault',
  'vault-monologue':  'vault',
};

const router = {
  current: 'home',
  init() { initBridge(); this.go('home'); },
  go(screenId) {
    this.current = screenId;
    document.querySelectorAll('.save-bar, .tab-bar').forEach(el => el.remove());
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
      center.innerHTML= `<span class="topbar-title">${TOPBAR_LABELS[id] || id}</span>`;
    }
  }
};

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

function makeKwTag(val, onRemove) {
  const tag = document.createElement('div');
  tag.className = 'kw-tag';
  tag.style.cssText = 'width:fit-content;flex-shrink:0;';
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
  const btn = document.querySelector('.save-btn');
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = '저장됐어요 ✓';
    btn.style.background = '#2a7a40';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1500);
  }
}

function syncStore() {
  if (window.parent && window.parent.__PC_STORE__) store = window.parent.__PC_STORE__;
}

function getWorldInfo() { return ''; }

function getRecentChat(limit) {
  return getChat ? getChat(limit || 20) : [];
}

function buildChatText(limit) {
  return getRecentChat(limit).map(m => `[${m.name||m.role}]: ${m.content}`).join('\n');
}

if (window.parent && window.parent.__PC_STORE__) {
  router.init();
}
