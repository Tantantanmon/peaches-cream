// screens/vault-kink.js — Kink & Fetish

const VKF_DATA = {
  positions:   ['Missionary','Doggy Style','Cowgirl','Reverse Cowgirl','Spooning','Lotus','Standing','69','Face Sitting','Prone Bone','The Anvil','Wheelbarrow','Legs Up'],
  foreplay:    ['Deep Kissing','Neck Kissing','Teasing','Blowjob','Cunnilingus','Fingering','Handjob','Body Massage','Temperature Play','Blindfolding'],
  intercourse: ['Nipple Play','Dirty Talk','Hair Pulling','Spanking','Light Choking','Eye Contact','Grinding','Slow & Deep','Fast & Rough','Orgasm Control'],
  ejaculation: ['Internal (Vaginal)','External','On Body','On Face','Inside Mouth'],
  fetishes:    ['Uniforms','Lingerie','Stockings','High Heels','Leather','Latex','Glasses','Chokers','Silk & Satin','Thigh-highs','Formal Wear','Body Oil'],
};

export function render() {
  syncStore();
  const ck   = store.charKink || {};
  const area = document.getElementById('scroll-area');

  area.innerHTML = `
    ${section('POSITIONS',          'vkf-positions-wrap',   VKF_DATA.positions,   ck.positions||[])}
    ${customSection('FOREPLAY',      'vkf-foreplay-wrap',    VKF_DATA.foreplay,    ck.foreplay||[],   ck.customForeplay||[],    'vkf-foreplay-custom')}
    ${customSection('INTERCOURSE',   'vkf-intercourse-wrap', VKF_DATA.intercourse, ck.intercourse||[],ck.customIntercourse||[], 'vkf-intercourse-custom')}
    ${section('EJACULATION LOCATION','vkf-ejac-wrap',        VKF_DATA.ejaculation, ck.ejaculationLocation||[])}
    ${customSection('FETISHES',      'vkf-fetish-wrap',      VKF_DATA.fetishes,    ck.fetishes||[],   ck.customFetishes||[],    'vkf-fetish-custom')}
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">ROLE ALIGNMENT</div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Role</span>
        <div class="btn-group" id="vkf-bg-role">
          ${['Dominant','Submissive','Switch'].map(v=>`<button class="pill${v===(ck.role||'')?' sel':''}" data-val="${v}">${v}</button>`).join('')}
        </div>
      </div>
    </div>
    <div style="height:80px;"></div>
  `;

  // positions custom add
  const posWrap = document.getElementById('vkf-positions-wrap');
  const posAddBtn = document.createElement('button');
  posAddBtn.className = 'add-tag';
  posAddBtn.textContent = '+ Add';
  posAddBtn.onclick = () => addCustomKink('vkf-positions-wrap', 'positions');
  posWrap.appendChild(posAddBtn);
  (ck.customPositions||[]).forEach(v => posWrap.insertBefore(makeCustomTag(v), posAddBtn));

  // ejaculation custom add
  const ejacWrap = document.getElementById('vkf-ejac-wrap');
  const ejacAddBtn = document.createElement('button');
  ejacAddBtn.className = 'add-tag';
  ejacAddBtn.textContent = '+ Add';
  ejacAddBtn.onclick = () => addCustomKink('vkf-ejac-wrap', 'ejaculation');
  ejacWrap.appendChild(ejacAddBtn);

  initBtnGroups();

  // Save bar
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = '<button class="save-btn" id="vkf-save-btn">Save</button>';
  document.getElementById('popup').appendChild(saveBar);
  document.getElementById('vkf-save-btn').onclick = save;
}

function section(label, wrapId, items, selected) {
  return `
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">${label}</div>
      <div style="padding:10px 16px 14px;">
        <div class="tag-wrap" id="${wrapId}">
          ${items.map(t=>`<div class="kink-tag${selected.includes(t)?' active':''}" onclick="this.classList.toggle('active')">${esc(t)}</div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function customSection(label, wrapId, items, selected, custom, customId) {
  return `
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">${label}</div>
      <div style="padding:10px 16px 14px;">
        <div class="tag-wrap" id="${wrapId}">
          ${items.map(t=>`<div class="kink-tag${selected.includes(t)?' active':''}" onclick="this.classList.toggle('active')">${esc(t)}</div>`).join('')}
          ${custom.map(t=>`<div class="kink-tag custom-tag active" data-custom="1">${esc(t)}<span class="kw-x" onclick="this.parentElement.remove()">×</span></div>`).join('')}
          <button class="add-tag" onclick="addCustomKinkPrompt('${wrapId}')">+ Add</button>
        </div>
      </div>
    </div>
  `;
}

function makeCustomTag(val) {
  const div = document.createElement('div');
  div.className = 'kink-tag custom-tag active';
  div.dataset.custom = '1';
  div.innerHTML = `${esc(val)}<span class="kw-x" onclick="this.parentElement.remove()">×</span>`;
  return div;
}

window.addCustomKinkPrompt = function(wrapId) {
  const val = prompt('Add (English):');
  if (!val || !val.trim()) return;
  const wrap   = document.getElementById(wrapId);
  const addBtn = wrap.querySelector('.add-tag');
  wrap.insertBefore(makeCustomTag(val.trim()), addBtn);
};

window.addCustomKink = function(wrapId) {
  window.addCustomKinkPrompt(wrapId);
};

function initBtnGroups() {
  document.querySelectorAll('.btn-group').forEach(g => {
    g.addEventListener('click', e => {
      const b = e.target.closest('.pill');
      if (!b) return;
      g.querySelectorAll('.pill').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
    });
  });
}

function getActiveTags(wrapId) {
  return Array.from(document.getElementById(wrapId)?.querySelectorAll('.kink-tag.active:not([data-custom])') || []).map(t => t.textContent.trim());
}
function getCustomTags(wrapId) {
  return Array.from(document.getElementById(wrapId)?.querySelectorAll('.kink-tag[data-custom]') || []).map(t => t.textContent.replace('×','').trim());
}

function save() {
  const data = {
    positions:          getActiveTags('vkf-positions-wrap'),
    customPositions:    getCustomTags('vkf-positions-wrap'),
    foreplay:           getActiveTags('vkf-foreplay-wrap'),
    customForeplay:     getCustomTags('vkf-foreplay-wrap'),
    intercourse:        getActiveTags('vkf-intercourse-wrap'),
    customIntercourse:  getCustomTags('vkf-intercourse-wrap'),
    ejaculationLocation:getActiveTags('vkf-ejac-wrap'),
    fetishes:           getActiveTags('vkf-fetish-wrap'),
    customFetishes:     getCustomTags('vkf-fetish-wrap'),
    role:               getSelected('vkf-bg-role'),
  };
  doSave(() => {
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.charKink = { ...(window.parent.__PC_STORE__.charKink||{}), ...data };
    }
  });
  document.querySelector('.save-bar')?.remove();
}
