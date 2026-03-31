// screens/vault-profile.js — 캐릭터 프로필

export function render() {
  syncStore();
  const cp = store.charProfile || {};
  const area = document.getElementById('scroll-area');

  area.innerHTML = `
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">FIXED SPECS</div>
      <div class="list-row">
        <span class="row-label">Size</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <input class="num-input" id="vp-size" type="number" placeholder="17" step="0.1" value="${esc(cp.size||'')}"/>
          <div style="display:flex;gap:3px;" id="vp-unit-group">
            <button class="pill${(cp.sizeUnit||'cm')==='cm'?' sel':''}" data-val="cm" id="vp-u-cm">cm</button>
            <button class="pill${cp.sizeUnit==='in'?' sel':''}" data-val="in" id="vp-u-in">in</button>
          </div>
        </div>
      </div>
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">ADDITIONAL FEATURES</div>
      <div style="padding:12px 16px;">
        <div class="tag-wrap" id="vp-addl-wrap">
          <button class="add-tag" onclick="vpAddFeature()">+ Add</button>
        </div>
      </div>
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">PHYSIQUE REACTION</div>
      ${row('Moaning', 'vez-bg-moaning', ['Muted','Low Groan','Vocal'], cp.moaning)}
      ${row('Semen',   'vez-bg-semen',   ['Normal','High','Extreme'],   cp.semen)}
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">MALE TRAITS</div>
      ${row('Multi-Round', 'vez-bg-multiRound', ['+1 Round','+2 Rounds','Limitless'], cp.multiRound)}
      ${row('Stamina',     'vez-bg-stamina',    ['Low','High','Infinite'],            cp.stamina)}
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">SENSITIVE ZONES</div>
      <div style="padding:12px 16px;">
        <div class="tag-wrap" id="vp-sensitive-wrap">
          <button class="add-tag" onclick="vpAddSensitive()">+ Add</button>
        </div>
      </div>
    </div>
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">CONDOM</div>
      ${row('Condom', 'vp-bg-condom', ['Always','Never','Situational'], cp.condom||'')}
    </div>
    <div style="height:80px;"></div>
  \`;

  // 태그 복원
  const addlWrap = document.getElementById('vp-addl-wrap');
  const addlBtn  = addlWrap.querySelector('.add-tag');
  (cp.additionalFeatures||[]).forEach(v => addlWrap.insertBefore(makeKwTag(v), addlBtn));

  const sensWrap = document.getElementById('vp-sensitive-wrap');
  const sensBtn  = sensWrap.querySelector('.add-tag');
  (cp.sensitiveZones||[]).forEach(v => sensWrap.insertBefore(makeKwTag(v), sensBtn));

  // btn-group 초기화 (unit 제외)
  document.querySelectorAll('.btn-group').forEach(g => {
    g.addEventListener('click', e => {
      const b = e.target.closest('.pill');
      if (!b) return;
      g.querySelectorAll('.pill').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
    });
  });

  // unit 스위치 — 별도 처리 (btn-group 공통 이벤트와 분리)
  document.getElementById('vp-u-cm').addEventListener('click', () => vpSwitchUnit('cm'));
  document.getElementById('vp-u-in').addEventListener('click', () => vpSwitchUnit('in'));

  // Save bar
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = '<button class="save-btn" id="vp-save-btn">Save</button>';
  document.getElementById('popup').appendChild(saveBar);
  document.getElementById('vp-save-btn').onclick = vpSave;
}

function row(label, groupId, vals, current) {
  return `
    <div class="list-row" style="flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:center;">
      <span class="row-label">${label}</span>
      <div class="btn-group" id="${groupId}" style="justify-content:flex-end;">
        ${vals.map(v=>`<button class="pill${v===current?' sel':''}" data-val="${v}">${v}</button>`).join('')}
      </div>
    </div>
  `;
}

let _vpUnit = 'cm';

window.vpSwitchUnit = function(newUnit) {
  const sizeEl  = document.getElementById('vp-size');
  const v       = parseFloat(sizeEl.value) || 0;
  const oldUnit = _vpUnit;
  if (newUnit === 'in' && oldUnit === 'cm' && v > 0)
    sizeEl.value = Math.round(v / 2.54 * 10) / 10;
  else if (newUnit === 'cm' && oldUnit === 'in' && v > 0)
    sizeEl.value = Math.round(v * 2.54 * 10) / 10;
  _vpUnit = newUnit;
  document.getElementById('vp-u-cm').classList.toggle('sel', newUnit === 'cm');
  document.getElementById('vp-u-in').classList.toggle('sel', newUnit === 'in');
};

// render 시 현재 unit 초기화
function initUnit() {
  syncStore();
  _vpUnit = (store.charProfile || {}).sizeUnit || 'cm';
}
initUnit();

window.vpAddFeature = function() {
  const val = prompt('Add feature (English):');
  if (!val || !val.trim()) return;
  const wrap = document.getElementById('vp-addl-wrap');
  wrap.insertBefore(makeKwTag(val.trim()), wrap.querySelector('.add-tag'));
};

window.vpAddSensitive = function() {
  const val = prompt('Add sensitive zone (English):');
  if (!val || !val.trim()) return;
  const wrap = document.getElementById('vp-sensitive-wrap');
  wrap.insertBefore(makeKwTag(val.trim()), wrap.querySelector('.add-tag'));
};

function vpGetSelected(groupId) {
  const g = document.getElementById(groupId);
  if (!g) return '';
  const s = g.querySelector('.pill.sel');
  return s ? s.dataset.val : '';
}

function vpSave() {
  const data = {
    size:               document.getElementById('vp-size')?.value || '',
    sizeUnit:           _vpUnit,
    additionalFeatures: getKwTags('vp-addl-wrap'),
    moaning:            vpGetSelected('vez-bg-moaning'),
    semen:              vpGetSelected('vez-bg-semen'),
    multiRound:         vpGetSelected('vez-bg-multiRound'),
    stamina:            vpGetSelected('vez-bg-stamina'),
    sensitiveZones:     getKwTags('vp-sensitive-wrap'),
    condom:             vpGetSelected('vp-bg-condom'),
  };
  doSave(() => {
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.charProfile = { ...(window.parent.__PC_STORE__.charProfile||{}), ...data };
    }
  });
}
