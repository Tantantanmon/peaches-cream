// screens/vault-kink.js — Kink & Fetish

const VKF_DATA = {
  positions:   ['Missionary','Doggy Style','Cowgirl','Reverse Cowgirl','Spooning','Lotus','Standing','69','Face Sitting','Prone Bone','The Anvil','Wheelbarrow','Legs Up'],
  foreplay:    ['Deep Kissing','Neck Kissing','Teasing','Blowjob','Cunnilingus','Fingering','Handjob','Body Massage','Temperature Play','Blindfolding'],
  intercourse: ['Nipple Play','Dirty Talk','Hair Pulling','Spanking','Light Choking','Eye Contact','Grinding','Slow & Deep','Fast & Rough','Orgasm Control'],
  ejaculation: ['Internal (Vaginal)','External','On Body','On Face','Inside Mouth'],
  fetishes:    ['Uniforms','Lingerie','Stockings','High Heels','Leather','Latex','Glasses','Chokers','Silk & Satin','Thigh-highs','Formal Wear','Body Oil'],
};

// 선택 상태를 JS 객체로 관리 (DOM 의존 최소화)
const vkfState = {
  positions:   new Set(),
  foreplay:    new Set(),
  intercourse: new Set(),
  ejaculation: new Set(),
  fetishes:    new Set(),
  customPositions:   [],
  customForeplay:    [],
  customIntercourse: [],
  customFetishes:    [],
  role: '',
};

export function render() {
  syncStore();
  const ck = store.charKink || {};

  // 상태 초기화
  Object.keys(VKF_DATA).forEach(key => {
    const saved = ck[key === 'ejaculation' ? 'ejaculationLocation' : key] || [];
    vkfState[key] = new Set(saved);
  });
  vkfState.customPositions   = [...(ck.customPositions||[])];
  vkfState.customForeplay    = [...(ck.customForeplay||[])];
  vkfState.customIntercourse = [...(ck.customIntercourse||[])];
  vkfState.customFetishes    = [...(ck.customFetishes||[])];
  vkfState.role              = ck.role || '';

  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    ${renderSection('POSITIONS',           'positions',   VKF_DATA.positions,   true)}
    ${renderSection('FOREPLAY',            'foreplay',    VKF_DATA.foreplay,    true)}
    ${renderSection('INTERCOURSE ACTS',    'intercourse', VKF_DATA.intercourse, true)}
    ${renderSection('EJACULATION LOCATION','ejaculation', VKF_DATA.ejaculation, false)}
    ${renderSection('FETISHES',            'fetishes',    VKF_DATA.fetishes,    true)}
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">ROLE ALIGNMENT</div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Role</span>
        <div class="btn-group" id="vkf-bg-role">
          ${['Dominant','Submissive','Switch'].map(v=>`<button class="pill${v===vkfState.role?' sel':''}" data-val="${v}">${v}</button>`).join('')}
        </div>
      </div>
    </div>
    <div style="height:80px;"></div>
  `;

  // role btn-group
  const roleG = document.getElementById('vkf-bg-role');
  roleG.addEventListener('click', e => {
    const b = e.target.closest('.pill');
    if (!b) return;
    roleG.querySelectorAll('.pill').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel');
    vkfState.role = b.dataset.val;
  });

  // 커스텀 태그 렌더
  renderCustomTags();

  // Save bar
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = '<button class="save-btn" id="vkf-save-btn">Save</button>';
  document.getElementById('popup').appendChild(saveBar);
  document.getElementById('vkf-save-btn').onclick = vkfSave;
}

function renderSection(label, key, items, hasCustom) {
  return `
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">${label}</div>
      <div style="padding:10px 16px 14px;">
        <div class="tag-wrap" id="vkf-wrap-${key}">
          ${items.map(t => `
            <div class="kink-tag${vkfState[key].has(t)?' active':''}"
                 onclick="vkfToggle('${key}','${t.replace(/'/g,"\\'")}')">${esc(t)}</div>
          `).join('')}
          ${hasCustom ? `<button class="add-tag" onclick="vkfAddCustom('${key}')">+ Add</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function renderCustomTags() {
  const customMap = {
    positions:   'customPositions',
    foreplay:    'customForeplay',
    intercourse: 'customIntercourse',
    fetishes:    'customFetishes',
  };
  Object.entries(customMap).forEach(([key, stateKey]) => {
    const wrap   = document.getElementById(`vkf-wrap-${key}`);
    const addBtn = wrap?.querySelector('.add-tag');
    if (!wrap || !addBtn) return;
    vkfState[stateKey].forEach(val => {
      wrap.insertBefore(makeCustomTag(val, stateKey), addBtn);
    });
  });
}

function makeCustomTag(val, stateKey) {
  const div = document.createElement('div');
  div.className = 'kink-tag active';
  div.innerHTML = `${esc(val)}<span class="kw-x" style="margin-left:4px;cursor:pointer;">×</span>`;
  div.querySelector('.kw-x').onclick = (e) => {
    e.stopPropagation();
    vkfState[stateKey] = vkfState[stateKey].filter(v => v !== val);
    div.remove();
  };
  return div;
}

window.vkfToggle = function(key, val) {
  if (vkfState[key].has(val)) vkfState[key].delete(val);
  else vkfState[key].add(val);
  // DOM 업데이트
  const wrap = document.getElementById(`vkf-wrap-${key}`);
  if (!wrap) return;
  wrap.querySelectorAll('.kink-tag:not([data-custom])').forEach(el => {
    const t = el.textContent.replace('×','').trim();
    el.classList.toggle('active', vkfState[key].has(t));
  });
};

window.vkfAddCustom = function(key) {
  const val = prompt('Add (English):');
  if (!val || !val.trim()) return;
  const trimmed = val.trim();
  const stateKey = { positions:'customPositions', foreplay:'customForeplay', intercourse:'customIntercourse', fetishes:'customFetishes' }[key];
  if (!stateKey) return;
  vkfState[stateKey].push(trimmed);
  const wrap   = document.getElementById(`vkf-wrap-${key}`);
  const addBtn = wrap?.querySelector('.add-tag');
  if (wrap && addBtn) wrap.insertBefore(makeCustomTag(trimmed, stateKey), addBtn);
};

function vkfSave() {
  const data = {
    positions:           [...vkfState.positions],
    customPositions:     [...vkfState.customPositions],
    foreplay:            [...vkfState.foreplay],
    customForeplay:      [...vkfState.customForeplay],
    intercourse:         [...vkfState.intercourse],
    customIntercourse:   [...vkfState.customIntercourse],
    ejaculationLocation: [...vkfState.ejaculation],
    fetishes:            [...vkfState.fetishes],
    customFetishes:      [...vkfState.customFetishes],
    role:                vkfState.role,
  };
  doSave(() => {
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.charKink = { ...(window.parent.__PC_STORE__.charKink||{}), ...data };
    }
  });
}
