// screens/toolbar-settings.js — Toolbar Settings

const TB_GROUPS = [
  { id:'sfw',      label:'SFW' },
  { id:'mood',     label:'Mood & Place' },
  { id:'foreplay', label:'Foreplay' },
  { id:'position', label:'Position' },
  { id:'action',   label:'Action' },
  { id:'finish',   label:'Finish' },
  { id:'orgasm',   label:'Orgasm' },
];

const TB_FIXED = {
  sfw:      ['Kiss','Hug','Cuddle','Head Pat','Back Hug','Forehead Kiss','Pout','Whisper in Ear'],
  mood:     ['Romantic','Dominant','Bed','Wall'],
  foreplay: ['Kissing','Fingering','Blowjob','Cunnilingus'],
  position: ['Missionary','Doggy','Cowgirl','Standing'],
  action:   ['Slow','Fast','Rough','Penetrate','Continue'],
  finish:   ['Internal','External','On Body'],
  orgasm:   ['Squirt','Scream'],
};

export function render() {
  if (!document.getElementById('tbs-style')) {
    const s = document.createElement('style');
    s.id = 'tbs-style';
    s.textContent = `
.tbs-group{margin-bottom:10px;}
.tbs-group-header{padding:0 2px;margin-bottom:8px;}
.tbs-group-name{font-size:12px;font-weight:600;letter-spacing:0.6px;color:var(--text-muted);text-transform:uppercase;}
.tbs-group-add{display:inline-flex;align-items:center;padding:4px 10px;border-radius:var(--radius-btn);font-size:13px;background:transparent;color:var(--text-muted);border:0.5px dashed var(--text-hint);cursor:pointer;font-family:inherit;}
.tbs-tag-card{background:var(--surface);border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--shadow);}
.tbs-tag-wrap{display:flex;flex-wrap:wrap;gap:6px;}
.tbs-tag{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:var(--radius-btn);font-size:13px;font-weight:500;background:var(--btn-idle);color:var(--text-secondary);border:none;font-family:inherit;}
.tbs-tag.fixed{color:var(--text-muted);}
.tbs-tag-x{font-size:12px;color:var(--text-muted);cursor:pointer;margin-left:1px;line-height:1;}
.tbs-tag-x:hover{color:var(--danger);}
.tbs-hint{font-size:12px;color:var(--text-hint);padding:0 2px;margin-top:6px;}
    `;
    document.head.appendChild(s);
  }

  const area = document.getElementById('scroll-area');
  const globalStore = window.parent?.__PC_GLOBAL_STORE__;
  const ct = globalStore?.config?.customTags || {};

  area.innerHTML = TB_GROUPS.map(g => {
    const fixed   = TB_FIXED[g.id] || [];
    const custom  = ct[g.id] || [];
    const fixedHTML  = fixed.map(t =>
      `<span class="tbs-tag fixed">${esc(t)}</span>`
    ).join('');
    const customHTML = custom.map((t, i) =>
      `<span class="tbs-tag">${esc(t)}<span class="tbs-tag-x" onclick="tbsRemove('${g.id}',${i})">×</span></span>`
    ).join('');
    return `
      <div class="tbs-group">
        <div class="tbs-group-header">
          <span class="tbs-group-name">${g.label}</span>
        </div>
        <div class="tbs-tag-card">
          <div class="tbs-tag-wrap" id="tbs-wrap-${g.id}">${fixedHTML}${customHTML}<button class="tbs-group-add" onclick="tbsAdd('${g.id}')">Add</button></div>
        </div>
      </div>`;
  }).join('') + `
    <div class="tbs-hint">회색 태그는 기본 태그로 삭제할 수 없어요</div>
    <div style="height:12px;"></div>
    <button class="reset-btn" onclick="tbsResetAll()">커스텀 태그 전체 초기화</button>
    <div style="height:40px;"></div>
  `;
}

window.tbsAdd = function(groupId) {
  const val = prompt('태그 추가 (영어):');
  if (!val || !val.trim()) return;
  const trimmed = val.trim();
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs) return;
  if (!gs.config.customTags[groupId]) gs.config.customTags[groupId] = [];
  if (gs.config.customTags[groupId].includes(trimmed)) { showToast('이미 있는 태그예요'); return; }
  gs.config.customTags[groupId].push(trimmed);
  if (saveStore) saveStore();
  showToast('추가됐어요 ✓');
  render();
};

window.tbsRemove = function(groupId, idx) {
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs?.config?.customTags?.[groupId]) return;
  gs.config.customTags[groupId].splice(idx, 1);
  if (saveStore) saveStore();
  render();
};

window.tbsResetAll = function() {
  showModal({
    title: '커스텀 태그 초기화',
    desc: '추가한 커스텀 태그를 전부 삭제할까요?',
    confirmText: '초기화',
    danger: true,
    onConfirm: () => {
      const gs = window.parent?.__PC_GLOBAL_STORE__;
      if (!gs) return;
      Object.keys(gs.config.customTags).forEach(k => { gs.config.customTags[k] = []; });
      if (saveStore) saveStore();
      showToast('초기화됐어요');
      render();
    }
  });
};
