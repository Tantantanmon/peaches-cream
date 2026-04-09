// screens/toolbar-settings.js — Toolbar Settings (Sidebar)

const TB_DEFAULT_GROUPS = [
  { id:'sfw',      label:'SFW' },
  { id:'mood',     label:'Mood & Place' },
  { id:'foreplay', label:'Foreplay' },
  { id:'position', label:'Position' },
  { id:'action',   label:'Action' },
  { id:'finish',   label:'Finish' },
  { id:'orgasm',   label:'Orgasm' },
  { id:'fetish',   label:'Fetish' },
];

const TB_FIXED = {
  sfw:      ['Kiss','Hug','Cuddle','Head Pat','Back Hug','Forehead Kiss','Pout','Whisper in Ear'],
  mood:     ['Romantic','Dominant','Bed','Wall','Angry'],
  foreplay: ['Kissing','Fingering','Blowjob','Cunnilingus'],
  position: ['Missionary','Doggy','Cowgirl','Standing'],
  action:   ['Slow','Fast','Rough','Penetrate','Continue'],
  finish:   ['Internal','External','On Body'],
  orgasm:   ['Squirt','Scream'],
  fetish:   ['Tie','Blindfold','Choke','Spank','Hair Pull'],
};

let tbsActiveGroup = 'sfw';

export function render() {
  if (!document.getElementById('tbs-style')) {
    const s = document.createElement('style');
    s.id = 'tbs-style';
    s.textContent = `
.tbs-layout{display:flex;height:100%;}
.tbs-sidebar{width:108px;flex-shrink:0;background:#f5f5f7;border-right:0.5px solid var(--divider-light);overflow-y:auto;display:flex;flex-direction:column;padding:6px 0;scrollbar-width:none;}
.tbs-sidebar::-webkit-scrollbar{display:none;}
.tbs-sb-item{padding:10px 14px;font-size:12.5px;cursor:pointer;transition:all .1s;color:var(--text-muted);border-left:2.5px solid transparent;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tbs-sb-item:hover{color:var(--text-secondary);background:rgba(0,0,0,0.02);}
.tbs-sb-item.active{color:var(--text-primary);background:var(--surface);border-left-color:var(--text-primary);font-weight:600;}
.tbs-sb-add{padding:10px 14px;font-size:12.5px;color:var(--text-hint);cursor:pointer;border-left:2.5px solid transparent;transition:color .1s;margin-top:2px;}
.tbs-sb-add:hover{color:var(--text-muted);}
.tbs-main{flex:1;display:flex;flex-direction:column;min-width:0;background:var(--surface);}
.tbs-header{padding:14px 16px 8px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.tbs-header-label{font-size:17px;font-weight:600;color:var(--text-primary);}
.tbs-del-group{padding:5px 12px;border-radius:8px;font-size:12px;font-weight:500;color:var(--danger);background:transparent;border:0.5px solid rgba(200,60,60,0.3);cursor:pointer;font-family:inherit;transition:all .1s;}
.tbs-del-group:hover{background:var(--danger-bg);}
.tbs-tag-area{flex:1;padding:8px 16px;overflow-y:auto;scrollbar-width:none;}
.tbs-tag-area::-webkit-scrollbar{display:none;}
.tbs-tag-wrap{display:flex;flex-wrap:wrap;gap:7px;align-content:flex-start;}
.tbs-tag{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:20px;font-size:13px;background:var(--surface);color:var(--text-secondary);cursor:default;transition:all .1s;border:0.5px solid var(--divider);}
.tbs-tag:hover{border-color:#ccc;}
.tbs-tag-x{font-size:14px;color:var(--text-hint);cursor:pointer;line-height:1;transition:color .1s;}
.tbs-tag-x:hover{color:var(--danger);}
.tbs-tag-add{display:inline-flex;align-items:center;padding:7px 12px;border-radius:20px;font-size:13px;color:var(--text-hint);border:0.5px dashed #ccc;cursor:pointer;background:transparent;transition:all .1s;font-family:inherit;}
.tbs-tag-add:hover{color:var(--text-muted);border-color:#aaa;}
.tbs-empty{font-size:13px;color:var(--text-hint);padding:40px 0;text-align:center;width:100%;}
.tbs-bottom{padding:12px 16px 16px;display:flex;gap:10px;flex-shrink:0;}
.tbs-save-btn{flex:1;padding:14px;border-radius:var(--radius-sm);font-size:15px;font-weight:500;color:#fff;background:#1a1a2e;border:none;cursor:pointer;font-family:inherit;transition:all .15s;}
.tbs-save-btn:active{opacity:.8;}
.tbs-reset-btn{flex:1;padding:14px;border-radius:var(--radius-sm);font-size:15px;font-weight:500;color:var(--danger);background:#fff0f0;border:none;cursor:pointer;font-family:inherit;transition:all .15s;}
.tbs-reset-btn:active{opacity:.8;}
    `;
    document.head.appendChild(s);
  }

  const globalStore = window.parent?.__PC_GLOBAL_STORE__;
  if (!globalStore) return;

  // ensure fields
  if (!globalStore.config.deletedTags)   globalStore.config.deletedTags   = {};
  if (!globalStore.config.deletedGroups) globalStore.config.deletedGroups = [];
  if (!globalStore.config.customGroups)  globalStore.config.customGroups  = [];

  const area = document.getElementById('scroll-area');
  area.style.padding = '0';
  area.style.background = '#f5f5f7';

  area.innerHTML = `
    <div class="tbs-layout">
      <div class="tbs-sidebar" id="tbs-sidebar"></div>
      <div class="tbs-main">
        <div class="tbs-header">
          <span class="tbs-header-label" id="tbs-header-label"></span>
          <button class="tbs-del-group" id="tbs-del-group">그룹 삭제</button>
        </div>
        <div class="tbs-tag-area" id="tbs-tag-area"></div>
        <div class="tbs-bottom">
          <button class="tbs-save-btn" id="tbs-save-btn">저장</button>
          <button class="tbs-reset-btn" id="tbs-reset-btn">초기화</button>
        </div>
      </div>
    </div>
  `;

  const visibleGroups = getVisibleGroupsList(globalStore);
  if (visibleGroups.length > 0 && !visibleGroups.find(g => g.id === tbsActiveGroup)) {
    tbsActiveGroup = visibleGroups[0].id;
  }

  renderSidebar();
  renderTags();

  document.getElementById('tbs-del-group').onclick = () => {
    const gs = window.parent?.__PC_GLOBAL_STORE__;
    if (!gs) return;
    showModal({
      title: '그룹 삭제',
      desc: `"${getActiveGroupLabel(gs)}" 그룹을 삭제할까요?`,
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        const isDefault = TB_DEFAULT_GROUPS.some(dg => dg.id === tbsActiveGroup);
        if (isDefault) {
          if (!gs.config.deletedGroups.includes(tbsActiveGroup)) {
            gs.config.deletedGroups.push(tbsActiveGroup);
          }
        } else {
          gs.config.customGroups = gs.config.customGroups.filter(cg => cg.id !== tbsActiveGroup);
          delete gs.config.customTags[tbsActiveGroup];
          delete gs.config.deletedTags[tbsActiveGroup];
        }
        if (saveStore) saveStore();
        const visible = getVisibleGroupsList(gs);
        if (visible.length > 0) {
          tbsActiveGroup = visible[0].id;
        }
        renderSidebar();
        renderTags();
        showToast('삭제됐어요');
      }
    });
  };

  document.getElementById('tbs-save-btn').onclick = () => {
    if (saveStore) saveStore();
    const btn = document.getElementById('tbs-save-btn');
    btn.textContent = '저장됨 ✓';
    btn.style.background = '#2a7a40';
    setTimeout(() => { btn.textContent = '저장'; btn.style.background = '#1a1a2e'; }, 1200);
  };

  document.getElementById('tbs-reset-btn').onclick = () => {
    showModal({
      title: '이 그룹 초기화',
      desc: '삭제된 기본 태그를 복원하고 커스텀 태그를 삭제할까요?',
      confirmText: '초기화',
      danger: true,
      onConfirm: () => {
        const gs = window.parent?.__PC_GLOBAL_STORE__;
        if (!gs) return;
        const isDefault = TB_DEFAULT_GROUPS.some(g => g.id === tbsActiveGroup);
        if (isDefault) {
          gs.config.deletedTags[tbsActiveGroup] = [];
          gs.config.customTags[tbsActiveGroup] = [];
        } else {
          gs.config.customTags[tbsActiveGroup] = [];
          const cg = gs.config.customGroups.find(g => g.id === tbsActiveGroup);
          if (cg) cg.tags = [];
        }
        if (saveStore) saveStore();
        showToast('초기화됐어요');
        renderTags();
      }
    });
  };
}

function getActiveGroupLabel(gs) {
  const groups = getVisibleGroupsList(gs);
  const g = groups.find(gr => gr.id === tbsActiveGroup);
  return g ? g.label : '';
}

function getVisibleGroupsList(gs) {
  const dg = gs.config.deletedGroups || [];
  const defaults = TB_DEFAULT_GROUPS.filter(g => !dg.includes(g.id));
  const custom = gs.config.customGroups || [];
  return [...defaults, ...custom];
}

function renderSidebar() {
  const sb = document.getElementById('tbs-sidebar');
  if (!sb) return;
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs) return;

  const groups = getVisibleGroupsList(gs);
  sb.innerHTML = '';

  groups.forEach(g => {
    const item = document.createElement('div');
    item.className = 'tbs-sb-item' + (g.id === tbsActiveGroup ? ' active' : '');
    item.textContent = g.label;
    item.onclick = () => {
      tbsActiveGroup = g.id;
      renderSidebar();
      renderTags();
    };
    sb.appendChild(item);
  });

  // + Group button
  const addDiv = document.createElement('div');
  addDiv.className = 'tbs-sb-add';
  addDiv.textContent = '+ Group';
  addDiv.onclick = () => {
    const name = prompt('그룹 이름:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    const id = 'custom_' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    if (gs.config.customGroups.find(g => g.label === trimmed)) {
      showToast('이미 있는 그룹이에요');
      return;
    }
    gs.config.customGroups.push({ id, label: trimmed, tags: [] });
    if (!gs.config.customTags[id]) gs.config.customTags[id] = [];
    if (saveStore) saveStore();
    tbsActiveGroup = id;
    renderSidebar();
    renderTags();
  };
  sb.appendChild(addDiv);
}

function renderTags() {
  const tagArea = document.getElementById('tbs-tag-area');
  const header = document.getElementById('tbs-header-label');
  if (!tagArea || !header) return;

  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if (!gs) return;

  const groups = getVisibleGroupsList(gs);
  if (groups.length === 0) {
    header.textContent = '';
    tagArea.innerHTML = '<div class="tbs-empty">그룹이 없어요 — 사이드바에서 추가하세요</div>';
    return;
  }

  const group = groups.find(g => g.id === tbsActiveGroup);
  if (!group) {
    tbsActiveGroup = groups[0].id;
    renderSidebar();
    renderTags();
    return;
  }

  header.textContent = group.label;

  const isDefault = TB_DEFAULT_GROUPS.some(dg => dg.id === tbsActiveGroup);
  const fixed = isDefault ? (TB_FIXED[tbsActiveGroup] || []) : [];
  const deleted = gs.config.deletedTags?.[tbsActiveGroup] || [];
  const custom = gs.config.customTags?.[tbsActiveGroup] || [];
  const customGroup = gs.config.customGroups?.find(g => g.id === tbsActiveGroup);
  const baseTags = isDefault ? fixed.filter(t => !deleted.includes(t)) : (customGroup?.tags || []);
  const allTags = [...baseTags, ...custom];

  tagArea.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'tbs-tag-wrap';

  allTags.forEach((tag, i) => {
    const chip = document.createElement('div');
    chip.className = 'tbs-tag';

    const label = document.createElement('span');
    label.textContent = tag;

    const xBtn = document.createElement('span');
    xBtn.className = 'tbs-tag-x';
    xBtn.textContent = '×';
    xBtn.onclick = () => {
      if (i < baseTags.length) {
        if (isDefault) {
          if (!gs.config.deletedTags[tbsActiveGroup]) gs.config.deletedTags[tbsActiveGroup] = [];
          gs.config.deletedTags[tbsActiveGroup].push(tag);
        } else {
          if (customGroup) {
            customGroup.tags = customGroup.tags.filter(t => t !== tag);
          }
        }
      } else {
        gs.config.customTags[tbsActiveGroup] = (gs.config.customTags[tbsActiveGroup] || []).filter(t => t !== tag);
      }
      renderTags();
    };

    chip.appendChild(label);
    chip.appendChild(xBtn);
    wrap.appendChild(chip);
  });

  // + add button
  const addBtn = document.createElement('button');
  addBtn.className = 'tbs-tag-add';
  addBtn.textContent = '+ add';
  addBtn.onclick = () => {
    const val = prompt('태그 추가 (영어):');
    if (!val || !val.trim()) return;
    const trimmed = val.trim();

    if (allTags.includes(trimmed)) {
      showToast('이미 있는 태그예요');
      return;
    }

    if (!gs.config.customTags[tbsActiveGroup]) gs.config.customTags[tbsActiveGroup] = [];
    gs.config.customTags[tbsActiveGroup].push(trimmed);
    renderTags();
  };
  wrap.appendChild(addBtn);

  if (allTags.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tbs-empty';
    empty.textContent = '태그가 없어요 — 추가하거나 초기화하세요';
    wrap.insertBefore(empty, addBtn);
  }

  tagArea.appendChild(wrap);
}
