// screens/erogenous.js — 유저 성감대 v2.6

export function render() {
  syncStore();
  const e = store.userErogenous || {};
  const area = document.getElementById('scroll-area');

  area.innerHTML = `
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">BODY RESPONSE</div>
      ${row('Tightness',   'bg-tightness',   ['Normal','Tight','Extreme'],  e.tightness)}
      ${row('Lubrication', 'bg-lubrication', ['Dry','Moist','Soaking'],     e.lubrication)}
      ${row('Squirting',   'bg-squirting',   ['None','Rare','Frequent'],    e.squirting)}
      ${row('Responsivity','bg-responsivity',['Normal','High','Extreme'],   e.responsivity)}
      ${row('Moaning',     'bg-moaning',     ['Muted','Vocal','Passionate'],e.moaning)}
    </div>
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">SEXUAL TRAITS</div>
      ${row('Experience',    'bg-experience', ['Novice','Skilled','Master'],  e.experience)}
      ${row('Preferred Vibe','bg-vibe',       ['Romantic','Rough','Slow'],    e.vibe)}
    </div>
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">SENSITIVE ZONES</div>
      <div style="padding:12px 16px;">
        <div id="ez-sensitive-wrap" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
          <button class="add-tag" onclick="ezAddTag('ez-sensitive-wrap')">+ Add</button>
        </div>
      </div>
    </div>
    <div style="height:80px;"></div>
  `;

  // 태그 복원
  const sensWrap   = document.getElementById('ez-sensitive-wrap');
  const sensAddBtn = sensWrap.querySelector('.add-tag');
  (e.sensitiveZones||[]).forEach(v => sensWrap.insertBefore(makeKwTag(v), sensAddBtn));

  initAllBtnGroups();

  // Save bar
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = '<button class="save-btn" id="ez-save-btn">Save</button>';
  document.getElementById('popup').appendChild(saveBar);
  document.getElementById('ez-save-btn').onclick = save;
}

function row(label, groupId, vals, current) {
  return `
    <div class="list-row" style="flex-wrap:wrap;gap:8px;">
      <span class="row-label">${label}</span>
      <div class="btn-group" id="${groupId}">
        ${vals.map(v=>`<button class="pill${v===current?' sel':''}" data-val="${v}">${v}</button>`).join('')}
      </div>
    </div>
  `;
}

function initAllBtnGroups() {
  document.querySelectorAll('.btn-group').forEach(g => {
    g.addEventListener('click', e => {
      const b = e.target.closest('.pill');
      if (!b) return;
      g.querySelectorAll('.pill').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
    });
  });
}

window.ezAddTag = function(wrapId) {
  const val = prompt('Add:');
  if (!val || !val.trim()) return;
  const wrap   = document.getElementById(wrapId);
  const addBtn = wrap.querySelector('.add-tag');
  wrap.insertBefore(makeKwTag(val.trim()), addBtn);
};

function save() {
  const data = {
    tightness:     getSelected('bg-tightness'),
    lubrication:   getSelected('bg-lubrication'),
    squirting:     getSelected('bg-squirting'),
    responsivity:  getSelected('bg-responsivity'),
    moaning:       getSelected('bg-moaning'),
    experience:    getSelected('bg-experience'),
    vibe:          getSelected('bg-vibe'),
    sensitiveZones: getKwTags('ez-sensitive-wrap'),
  };
  doSave(() => {
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.userErogenous = { ...(window.parent.__PC_STORE__.userErogenous||{}), ...data };
    }
  });
}
