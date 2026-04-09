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
.tbs-layout{display:flex;height:340px;border-top:0.5px solid var(--divider-light);}
.tbs-sidebar{width:108px;flex-shrink:0;border-right:0.5px solid var(--divider-light);background:var(--bg);overflow-y:auto;display:flex;flex-direction:column;scrollbar-width:none;}
.tbs-sidebar::-webkit-scrollbar{display:none;}
.tbs-sb-item{padding:10px 10px;font-size:12px;cursor:pointer;transition:all .1s;border-left:2.5px solid transparent;display:flex;align-items:center;justify-content:space-between;gap:4px;color:var(--text-muted);}
.tbs-sb-item.active{color:var(--text-primary);background:var(--surface);border-left-color:var(--text-primary);font-weight:600;}
.tbs-sb-item-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}
.tbs-sb-item-x{font-size:13px;color:var(--text-hint);cursor:pointer;line-height:1;flex-shrink:0;opacity:0;transition:opacity .1s,color .1s;}
.tbs-sb-item:hover .tbs-sb-item-x{opacity:1;}
.tbs-sb-item-x:hover{color:var(--danger);}
.tbs-sb-add{padding:10px 10px;font-size:12px;color:var(--text-hint);cursor:pointer;border-left:2.5px solid transparent;transition:color .1s;}
.tbs-sb-add:hover{color:var(--text-muted);}
.tbs-main{flex:1;display:flex;flex-direction:column;min-width:0;}
.tbs-main-header{padding:12px 14px 6px;font-size:11px;font-weight:600;letter-spacing:0.5px;color:var(--text-hint);text-transform:uppercase;flex-shrink:0;}
.tbs-tag-area{flex:1;padding:6px 14px;overflow-y:auto;scrollbar-width:none;}
.tbs-tag-area::-webkit-scrollbar{display:none;}
.tbs-tag-wrap{display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;}
.tbs-tag{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:20px;font-size:13px;background:var(--surface);border:0.5px solid var(--divider);color:var(--text-secondary);cursor:default;transition:all .1s;}
.tbs-tag-x{font-size:14px;color:var(--text-hint);cursor:pointer;line-height:1;margin-left:1px;transition:color .1s;}
.tbs-tag-x:hover{color:var(--danger);}
.tbs-tag-add{display:inline-flex;align-items:center;padding:7px 14px;border-radius:20px;font-size:13px;color:var(--text-hint);border:0.5px dashed var(--text-hint);cursor:pointer;background:transparent;transition:all .1s;font-family:inherit;}
.tbs-tag-add:hover{color:var(--text-muted);border-color:var(--text-muted);}
.tbs-empty{font-size:12px;color:var(--text-hint);padding:24px 0;text-align:center;width:100%;}
.tbs-bottom{padding:10px 14px 14px;border-top:0.5px solid var(--divider-light);display:flex;gap:8px;flex-shrink:0;}
.tbs-save-btn{flex:1;padding:12px;border-radius:var(--radius-sm);font-size:14px;font-weight:500;color:#fff;background:#1a1a2e;border:none;cursor:pointer;font-family:inherit;transition:all .15s;}
.tbs-save-btn:active{opacity:.8;}
.tbs-reset-btn{flex:1;padding:12px;border-radius:var(--radius-sm);font-size:14px;font-weight:500;color:var(--danger);background:var(--danger-bg);border:0.5px solid rgba(200,60,60,0.2);cursor:pointer;font-family:inherit;transition:all .15s;}
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
  area.style.background = 'var(--bg)';

  area.innerHTML = `
    <div class="tbs-layout">
      <div class="tbs-sidebar" id="tbs-sidebar"></div>
      <div class="tbs-main">
        <div class="tbs-main-header" id="tbs-main-header"></div>
        <div class="tbs-tag-area" id="tbs-tag-area"></div>
        <div class="tbs-bottom">
          <button class="tbs-save-btn" id="tbs-save-btn">저장</button>
          <button class="tbs-reset-btn" id="tbs-reset-btn">초기화</button>
        </div>
      </div>
    </div>
  `;

  // ensure active group is valid
  const visibleGroups = getVisibleGroupsList(globalStore);
  if (visibleGroups.length > 0 && !visibleGroups.find(g => g.id === tbsActiveGroup)) {
    tbsActiveGroup = visibleGroups[0].id;
  }

  renderSidebar();
  renderTags();

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
          // custom group: just clear its custom tags
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

    const label = document.createElement('span');
    label.className = 'tbs-sb-item-label';
    label.textContent = g.label;
    label.onclick = () => {
      tbsActiveGroup = g.id;
      renderSidebar();
      renderTags();
    };

    const xBtn = document.createElement('span');
    xBtn.className = 'tbs-sb-item-x';
    xBtn.textContent = '×';
    xBtn.onclick = (e) => {
      e.stopPropagation();
      const isDefault = TB_DEFAULT_GROUPS.some(dg => dg.id === g.id);
      if (isDefault) {
        if (!gs.config.deletedGroups.includes(g.id)) {
          gs.config.deletedGroups.push(g.id);
        }
      } else {
        gs.config.customGroups = gs.config.customGroups.filter(cg => cg.id !== g.id);
        delete gs.config.customTags[g.id];
        delete gs.config.deletedTags[g.id];
      }
      if (saveStore) saveStore();
      const visible = getVisibleGroupsList(gs);
      if (visible.length > 0 && !visible.find(v => v.id === tbsActiveGroup)) {
        tbsActiveGroup = visible[0].id;
      }
      renderSidebar();
      renderTags();
    };

    item.appendChild(label);
    item.appendChild(xBtn);
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
  const header = document.getElementById('tbs-main-header');
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
        // deleting a base tag
        if (isDefault) {
          if (!gs.config.deletedTags[tbsActiveGroup]) gs.config.deletedTags[tbsActiveGroup] = [];
          gs.config.deletedTags[tbsActiveGroup].push(tag);
        } else {
          // custom group base tag
          if (customGroup) {
            customGroup.tags = customGroup.tags.filter(t => t !== tag);
          }
        }
      } else {
        // deleting a custom tag
        gs.config.customTags[tbsActiveGroup] = (gs.config.customTags[tbsActiveGroup] || []).filter(t => t !== tag);
      }
      // don't auto-save, user clicks 저장
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

    // check duplicates
    if (allTags.includes(trimmed)) {
      showToast('이미 있는 태그예요');
      return;
    }

    if (isDefault) {
      if (!gs.config.customTags[tbsActiveGroup]) gs.config.customTags[tbsActiveGroup] = [];
      gs.config.customTags[tbsActiveGroup].push(trimmed);
    } else {
      // custom group — add to group's own tags or customTags
      if (!gs.config.customTags[tbsActiveGroup]) gs.config.customTags[tbsActiveGroup] = [];
      gs.config.customTags[tbsActiveGroup].push(trimmed);
    }
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
