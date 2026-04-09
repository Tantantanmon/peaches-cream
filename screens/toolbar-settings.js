// screens/toolbar-settings.js — Toolbar Settings (Sidebar + Hamburger)

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
let tbsMenuOpen = false;

export function render() {
  if (!document.getElementById('tbs-style')) {
    const s = document.createElement('style');
    s.id = 'tbs-style';
    s.textContent = `
.tbs-layout{display:flex;height:100%;position:relative;}
.tbs-sidebar{width:108px;flex-shrink:0;background:#f5f5f7;border-right:0.5px solid var(--divider-light);overflow-y:hidden;display:flex;flex-direction:column;padding:0;scrollbar-width:none;}
.tbs-sidebar::-webkit-scrollbar{display:none;}
.tbs-sb-top{padding:10px 10px 8px;display:flex;justify-content:flex-start;border-bottom:0.5px solid var(--divider-light);flex-shrink:0;}
.tbs-hamburger{width:34px;height:34px;border-radius:10px;background:#2c2f3a;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;transition:opacity .1s;}
.tbs-hamburger:active{opacity:.8;}
.tbs-hamburger-icon{display:flex;flex-direction:column;gap:3px;}
.tbs-hamburger-line{width:16px;height:1.8px;background:#fff;border-radius:1px;}
.tbs-sb-items{flex:1;overflow-y:auto;padding:6px 0;scrollbar-width:none;}
.tbs-sb-items::-webkit-scrollbar{display:none;}
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
.tbs-fav{font-size:13px;cursor:pointer;color:var(--text-hint);transition:color .1s;}
.tbs-fav.on{color:#f0a020;}
.tbs-fav:hover{color:#f0a020;}
.tbs-tag-x{font-size:14px;color:var(--text-hint);cursor:pointer;line-height:1;transition:color .1s;}
.tbs-tag-x:hover{color:var(--danger);}
.tbs-add-input{padding:7px 12px;border-radius:20px;font-size:13px;background:var(--surface);color:var(--text-primary);border:0.5px solid var(--divider);outline:none;font-family:inherit;width:100px;}
.tbs-add-input::placeholder{color:var(--text-hint);}
.tbs-add-input:focus{border-color:#aaa;}
.tbs-tag-add{display:inline-flex;align-items:center;padding:7px 12px;border-radius:20px;font-size:13px;color:var(--text-hint);border:0.5px dashed #ccc;cursor:pointer;background:transparent;transition:all .1s;font-family:inherit;}
.tbs-tag-add:hover{color:var(--text-muted);border-color:#aaa;}
.tbs-empty{font-size:13px;color:var(--text-hint);padding:40px 0;text-align:center;width:100%;}
.tbs-bottom{padding:12px 16px 16px;display:flex;gap:10px;flex-shrink:0;}
.tbs-save-btn{flex:1;padding:14px;border-radius:var(--radius-sm);font-size:15px;font-weight:500;color:#fff;background:#1a1a2e;border:none;cursor:pointer;font-family:inherit;transition:all .15s;}
.tbs-save-btn:active{opacity:.8;}
.tbs-reset-btn{flex:1;padding:14px;border-radius:var(--radius-sm);font-size:15px;font-weight:500;color:var(--danger);background:#fff0f0;border:none;cursor:pointer;font-family:inherit;transition:all .15s;}
.tbs-reset-btn:active{opacity:.8;}
.tbs-menu-overlay{display:none;position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.25);z-index:10;border-radius:0;}
.tbs-menu-overlay.show{display:block;}
.tbs-menu{display:none;position:absolute;top:52px;left:8px;background:var(--surface);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);z-index:11;min-width:200px;padding:6px 0;border:0.5px solid var(--divider);}
.tbs-menu.show{display:block;}
.tbs-menu-item{padding:11px 16px;font-size:13.5px;color:var(--text-primary);cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .1s;font-family:inherit;}
.tbs-menu-item:hover{background:#f5f5f7;}
.tbs-menu-item:active{background:#eee;}
.tbs-menu-item-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0;}
.tbs-menu-item.danger{color:var(--danger);}
.tbs-menu-divider{height:0.5px;background:var(--divider);margin:4px 0;}
.tbs-menu-toggle{margin-left:auto;font-size:12px;font-weight:500;padding:2px 8px;border-radius:6px;}
.tbs-menu-toggle.on{color:#2a7a40;background:#edf7f0;}
.tbs-menu-toggle.off{color:var(--text-muted);background:var(--btn-idle);}
    `;
    document.head.appendChild(s);
  }

  const globalStore = window.parent?.__PC_GLOBAL_STORE__;
  if (!globalStore) return;

  if (!globalStore.config.deletedTags)   globalStore.config.deletedTags   = {};
  if (!globalStore.config.deletedGroups) globalStore.config.deletedGroups = [];
  if (!globalStore.config.customGroups)  globalStore.config.customGroups  = [];
  if (!globalStore.config.favoriteTags)  globalStore.config.favoriteTags  = [];
  if (globalStore.config.favoriteTabEnabled===undefined) globalStore.config.favoriteTabEnabled = false;

  const area = document.getElementById('scroll-area');
  area.style.padding = '0';
  area.style.background = '#f5f5f7';

  area.innerHTML = `
    <div class="tbs-layout">
      <div class="tbs-sidebar">
        <div class="tbs-sb-top">
          <button class="tbs-hamburger" id="tbs-hamburger">
            <div class="tbs-hamburger-icon">
              <div class="tbs-hamburger-line"></div>
              <div class="tbs-hamburger-line"></div>
              <div class="tbs-hamburger-line"></div>
            </div>
          </button>
        </div>
        <div class="tbs-sb-items" id="tbs-sidebar"></div>
      </div>
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
      <div class="tbs-menu-overlay" id="tbs-menu-overlay"></div>
      <div class="tbs-menu" id="tbs-menu">
        <div class="tbs-menu-item" id="tbs-menu-fav">
          <span class="tbs-menu-item-icon">★</span>
          <span>즐겨찾기 탭</span>
          <span class="tbs-menu-toggle ${globalStore.config.favoriteTabEnabled?'on':'off'}" id="tbs-fav-toggle">${globalStore.config.favoriteTabEnabled?'ON':'OFF'}</span>
        </div>
        <div class="tbs-menu-divider"></div>
        <div class="tbs-menu-item" id="tbs-menu-export">
          <span class="tbs-menu-item-icon">↑</span>
          <span>설정 내보내기</span>
        </div>
        <div class="tbs-menu-item" id="tbs-menu-import">
          <span class="tbs-menu-item-icon">↓</span>
          <span>설정 가져오기</span>
        </div>
        <div class="tbs-menu-divider"></div>
        <div class="tbs-menu-item danger" id="tbs-menu-reset">
          <span class="tbs-menu-item-icon">↻</span>
          <span>전체 초기화</span>
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

  // hamburger menu
  document.getElementById('tbs-hamburger').onclick = (e) => { e.stopPropagation(); tbsToggleMenu(); };
  document.getElementById('tbs-menu-overlay').onclick = () => tbsToggleMenu(false);

  // fav toggle
  document.getElementById('tbs-menu-fav').onclick = () => {
    const gs = window.parent?.__PC_GLOBAL_STORE__;
    if(!gs) return;
    gs.config.favoriteTabEnabled = !gs.config.favoriteTabEnabled;
    const t = document.getElementById('tbs-fav-toggle');
    t.textContent = gs.config.favoriteTabEnabled ? 'ON' : 'OFF';
    t.className = 'tbs-menu-toggle ' + (gs.config.favoriteTabEnabled ? 'on' : 'off');
    if(saveStore) saveStore();
  };

  // export
  document.getElementById('tbs-menu-export').onclick = () => {
    tbsToggleMenu(false);
    const gs = window.parent?.__PC_GLOBAL_STORE__;
    if(!gs) return;
    const groups = getVisibleGroupsList(gs);
    const exportData = { groups: groups.map(g => {
      const isDefault = TB_DEFAULT_GROUPS.some(dg => dg.id === g.id);
      const fixed = isDefault ? (TB_FIXED[g.id]||[]) : [];
      const deleted = gs.config.deletedTags?.[g.id] || [];
      const custom = gs.config.customTags?.[g.id] || [];
      const customGroup = gs.config.customGroups?.find(cg => cg.id === g.id);
      const base = isDefault ? fixed.filter(t => !deleted.includes(t)) : (customGroup?.tags || []);
      return { id: g.id, label: g.label, tags: [...base, ...custom] };
    }), favoriteTags: gs.config.favoriteTags || [] };
    const json = JSON.stringify(exportData, null, 2);
    if(navigator.clipboard){
      navigator.clipboard.writeText(json).then(()=>showToast('클립보드에 복사됨 ✓')).catch(()=>showToast('복사 실패'));
    } else {
      showToast('복사 실패');
    }
  };

  // import
  document.getElementById('tbs-menu-import').onclick = () => {
    tbsToggleMenu(false);
    const val = prompt('JSON을 붙여넣으세요:');
    if(!val||!val.trim()) return;
    try {
      const data = JSON.parse(val.trim());
      if(!data.groups || !Array.isArray(data.groups)) { showToast('잘못된 형식이에요'); return; }
      const gs = window.parent?.__PC_GLOBAL_STORE__;
      if(!gs) return;
      data.groups.forEach(ig => {
        const isDefault = TB_DEFAULT_GROUPS.some(dg => dg.id === ig.id);
        if(isDefault){
          // restore deleted group
          gs.config.deletedGroups = (gs.config.deletedGroups||[]).filter(id => id !== ig.id);
          // restore deleted tags
          gs.config.deletedTags[ig.id] = [];
          // merge custom tags
          const fixed = TB_FIXED[ig.id] || [];
          const newCustom = (ig.tags||[]).filter(t => !fixed.includes(t));
          if(!gs.config.customTags[ig.id]) gs.config.customTags[ig.id] = [];
          newCustom.forEach(t => {
            if(!gs.config.customTags[ig.id].includes(t)) gs.config.customTags[ig.id].push(t);
          });
        } else {
          // custom group — add if not exists
          if(!gs.config.customGroups.find(cg => cg.id === ig.id)){
            gs.config.customGroups.push({ id: ig.id, label: ig.label, tags: ig.tags||[] });
          } else {
            const existing = gs.config.customGroups.find(cg => cg.id === ig.id);
            (ig.tags||[]).forEach(t => {
              if(!existing.tags.includes(t)) existing.tags.push(t);
            });
          }
          if(!gs.config.customTags[ig.id]) gs.config.customTags[ig.id] = [];
        }
      });
      // merge favorite tags
      if(data.favoriteTags && Array.isArray(data.favoriteTags)){
        data.favoriteTags.forEach(t => {
          if(!gs.config.favoriteTags.includes(t)) gs.config.favoriteTags.push(t);
        });
      }
      if(saveStore) saveStore();
      showToast('가져오기 완료 ✓');
      renderSidebar();
      renderTags();
    } catch(e) {
      showToast('JSON 파싱 실패');
    }
  };

  // reset all
  document.getElementById('tbs-menu-reset').onclick = () => {
    tbsToggleMenu(false);
    showModal({
      title: '전체 초기화',
      desc: '모든 그룹과 태그를 기본값으로 복원할까요? 커스텀 그룹과 태그가 전부 삭제돼요.',
      confirmText: '초기화',
      danger: true,
      onConfirm: () => {
        const gs = window.parent?.__PC_GLOBAL_STORE__;
        if(!gs) return;
        gs.config.deletedTags = {};
        gs.config.deletedGroups = [];
        gs.config.customGroups = [];
        gs.config.customTags = { sfw:[], mood:[], foreplay:[], position:[], action:[], finish:[], orgasm:[], fetish:[] };
        gs.config.favoriteTags = [];
        if(saveStore) saveStore();
        tbsActiveGroup = 'sfw';
        showToast('전체 초기화됐어요');
        renderSidebar();
        renderTags();
      }
    });
  };

  // group delete
  document.getElementById('tbs-del-group').onclick = () => {
    const gs = window.parent?.__PC_GLOBAL_STORE__;
    if(!gs) return;
    showModal({
      title: '그룹 삭제',
      desc: `"${getActiveGroupLabel(gs)}" 그룹을 삭제할까요?`,
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        const isDefault = TB_DEFAULT_GROUPS.some(dg => dg.id === tbsActiveGroup);
        if(isDefault){
          if(!gs.config.deletedGroups.includes(tbsActiveGroup)) gs.config.deletedGroups.push(tbsActiveGroup);
        } else {
          gs.config.customGroups = gs.config.customGroups.filter(cg => cg.id !== tbsActiveGroup);
          delete gs.config.customTags[tbsActiveGroup];
          delete gs.config.deletedTags[tbsActiveGroup];
        }
        if(saveStore) saveStore();
        const visible = getVisibleGroupsList(gs);
        if(visible.length > 0) tbsActiveGroup = visible[0].id;
        renderSidebar();
        renderTags();
        showToast('삭제됐어요');
      }
    });
  };

  // save
  document.getElementById('tbs-save-btn').onclick = () => {
    if(saveStore) saveStore();
    const btn = document.getElementById('tbs-save-btn');
    btn.textContent = '저장됨 ✓';
    btn.style.background = '#2a7a40';
    setTimeout(() => { btn.textContent = '저장'; btn.style.background = '#1a1a2e'; }, 1200);
  };

  // reset group
  document.getElementById('tbs-reset-btn').onclick = () => {
    showModal({
      title: '이 그룹 초기화',
      desc: '삭제된 기본 태그를 복원하고 커스텀 태그를 삭제할까요?',
      confirmText: '초기화',
      danger: true,
      onConfirm: () => {
        const gs = window.parent?.__PC_GLOBAL_STORE__;
        if(!gs) return;
        const isDefault = TB_DEFAULT_GROUPS.some(g => g.id === tbsActiveGroup);
        if(isDefault){
          gs.config.deletedTags[tbsActiveGroup] = [];
          gs.config.customTags[tbsActiveGroup] = [];
        } else {
          gs.config.customTags[tbsActiveGroup] = [];
          const cg = gs.config.customGroups.find(g => g.id === tbsActiveGroup);
          if(cg) cg.tags = [];
        }
        if(saveStore) saveStore();
        showToast('초기화됐어요');
        renderTags();
      }
    });
  };
}

function tbsToggleMenu(show){
  const m = document.getElementById('tbs-menu');
  const o = document.getElementById('tbs-menu-overlay');
  if(!m||!o) return;
  tbsMenuOpen = typeof show === 'boolean' ? show : !tbsMenuOpen;
  m.classList.toggle('show', tbsMenuOpen);
  o.classList.toggle('show', tbsMenuOpen);
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
  if(!sb) return;
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if(!gs) return;
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

  const addDiv = document.createElement('div');
  addDiv.className = 'tbs-sb-add';
  addDiv.textContent = '+ Group';
  addDiv.onclick = () => {
    const name = prompt('그룹 이름:');
    if(!name||!name.trim()) return;
    const trimmed = name.trim();
    const id = 'custom_' + trimmed.toLowerCase().replace(/[^a-z0-9]/g,'_') + '_' + Date.now();
    if(gs.config.customGroups.find(g => g.label === trimmed)){
      showToast('이미 있는 그룹이에요');
      return;
    }
    gs.config.customGroups.push({ id, label: trimmed, tags: [] });
    if(!gs.config.customTags[id]) gs.config.customTags[id] = [];
    if(saveStore) saveStore();
    tbsActiveGroup = id;
    renderSidebar();
    renderTags();
  };
  sb.appendChild(addDiv);
}

function renderTags() {
  const tagArea = document.getElementById('tbs-tag-area');
  const header = document.getElementById('tbs-header-label');
  if(!tagArea||!header) return;
  const gs = window.parent?.__PC_GLOBAL_STORE__;
  if(!gs) return;

  const groups = getVisibleGroupsList(gs);
  if(groups.length === 0){
    header.textContent = '';
    tagArea.innerHTML = '<div class="tbs-empty">그룹이 없어요 — 사이드바에서 추가하세요</div>';
    return;
  }

  const group = groups.find(g => g.id === tbsActiveGroup);
  if(!group){
    tbsActiveGroup = groups[0].id;
    renderSidebar();
    renderTags();
    return;
  }

  header.textContent = group.label;
  const isDefault = TB_DEFAULT_GROUPS.some(dg => dg.id === tbsActiveGroup);
  const fixed = isDefault ? (TB_FIXED[tbsActiveGroup]||[]) : [];
  const deleted = gs.config.deletedTags?.[tbsActiveGroup] || [];
  const custom = gs.config.customTags?.[tbsActiveGroup] || [];
  const customGroup = gs.config.customGroups?.find(g => g.id === tbsActiveGroup);
  const baseTags = isDefault ? fixed.filter(t => !deleted.includes(t)) : (customGroup?.tags||[]);
  const allTags = [...baseTags, ...custom];

  tagArea.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'tbs-tag-wrap';

  allTags.forEach((tag, i) => {
    const chip = document.createElement('div');
    chip.className = 'tbs-tag';

    const label = document.createElement('span');
    label.textContent = tag;

    const fav = document.createElement('span');
    const isFav = (gs.config.favoriteTags||[]).includes(tag);
    fav.className = 'tbs-fav' + (isFav ? ' on' : '');
    fav.textContent = isFav ? '★' : '☆';
    fav.onclick = () => {
      if(!gs.config.favoriteTags) gs.config.favoriteTags = [];
      if(isFav){
        gs.config.favoriteTags = gs.config.favoriteTags.filter(t => t !== tag);
      } else {
        gs.config.favoriteTags.push(tag);
      }
      renderTags();
    };

    const xBtn = document.createElement('span');
    xBtn.className = 'tbs-tag-x';
    xBtn.textContent = '×';
    xBtn.onclick = () => {
      if(i < baseTags.length){
        if(isDefault){
          if(!gs.config.deletedTags[tbsActiveGroup]) gs.config.deletedTags[tbsActiveGroup] = [];
          gs.config.deletedTags[tbsActiveGroup].push(tag);
        } else {
          if(customGroup) customGroup.tags = customGroup.tags.filter(t => t !== tag);
        }
      } else {
        gs.config.customTags[tbsActiveGroup] = (gs.config.customTags[tbsActiveGroup]||[]).filter(t => t !== tag);
      }
      renderTags();
    };

    chip.appendChild(label);
    chip.appendChild(fav);
    chip.appendChild(xBtn);
    wrap.appendChild(chip);
  });

  // inline add input + button
  const addInput = document.createElement('input');
  addInput.className = 'tbs-add-input';
  addInput.type = 'text';
  addInput.placeholder = 'Tag name...';

  const addBtn = document.createElement('button');
  addBtn.className = 'tbs-tag-add';
  addBtn.textContent = '+ add';

  const doAdd = () => {
    const val = addInput.value.trim();
    if(!val) return;
    if(allTags.includes(val)){
      showToast('이미 있는 태그예요');
      return;
    }
    if(!gs.config.customTags[tbsActiveGroup]) gs.config.customTags[tbsActiveGroup] = [];
    gs.config.customTags[tbsActiveGroup].push(val);
    addInput.value = '';
    renderTags();
  };

  addInput.onkeydown = (e) => { if(e.key==='Enter'){ e.preventDefault(); doAdd(); } };
  addBtn.onclick = () => doAdd();

  wrap.appendChild(addInput);
  wrap.appendChild(addBtn);

  if(allTags.length === 0){
    const empty = document.createElement('div');
    empty.className = 'tbs-empty';
    empty.textContent = '태그가 없어요 — 추가하거나 초기화하세요';
    wrap.insertBefore(empty, addInput);
  }

  tagArea.appendChild(wrap);
}
