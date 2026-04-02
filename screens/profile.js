// screens/profile.js — 유저 프로필 v2.6

export function render() {
  syncStore();
  const p = store.userProfile || {};
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">PHYSICAL FEATURES</div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Body type</span>
        <div class="btn-group" id="bg-bodyType">
          ${pills(['Slim','Average','Glamorous','Athletic'], p.bodyType)}
        </div>
      </div>
      <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:6px;">
        <span class="row-label">Bust</span>
        <textarea class="ps-textarea" id="p-bust" placeholder="예: 움직일 때마다 흔들리는 크고 부드러운 가슴">${esc(p.bust||'')}</textarea>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Butt</span>
        <div class="btn-group" id="bg-butt">
          ${pills(['Small &amp; firm','Average','Large &amp; full'], p.butt)}
        </div>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Waist-hip</span>
        <div class="btn-group" id="bg-waistHip">
          ${pills(['Slim','Hourglass','Full'], p.waistHip)}
        </div>
      </div>
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">INTIMATE</div>
      <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:6px;">
        <span class="row-label">Peach</span>
        <textarea class="ps-textarea" id="p-peach" placeholder="예: 분홍빛, 음모 없음, 작고 단정한">${esc(p.peach||'')}</textarea>
      </div>
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">MARKS & DETAILS</div>
      <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:6px;">
        <span class="row-label">Marks & Features</span>
        <textarea class="ps-textarea" id="p-marks" placeholder="예: 왼쪽 허벅지 안쪽에 작은 흉터, 쇄골 아래 점">${esc(p.marks||'')}</textarea>
      </div>
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">VIBE / SCENT</div>
      <div class="list-row">
        <span class="row-label">Scent</span>
        <input class="ps-text-input" id="p-scent" type="text" placeholder="예: 달콤한 바닐라향" value="${esc(p.scent||'')}"/>
      </div>
    </div>
    <div style="height:80px;"></div>
  `;

  // textarea 스타일 추가
  if (!document.getElementById('ps-textarea-style')) {
    const s = document.createElement('style');
    s.id = 'ps-textarea-style';
    s.textContent = `.ps-textarea{width:100%;padding:8px 10px;border-radius:9px;border:0.5px solid var(--divider);background:#f9f9f9;color:var(--text-primary);font-size:15px;outline:none;font-family:inherit;resize:none;min-height:60px;line-height:1.6;}.ps-textarea:focus{border-color:#aaa;}`;
    document.head.appendChild(s);
  }

  // Save bar
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = '<button class="save-btn" id="profile-save-btn">Save</button>';
  document.getElementById('popup').appendChild(saveBar);
  document.getElementById('profile-save-btn').onclick = save;

  initAllBtnGroups();
}

function pills(vals, current) {
  return vals.map(v => `<button class="pill${v===current?' sel':''}" data-val="${v}">${v}</button>`).join('');
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

function save() {
  let butt = getSelected('bg-butt');
  if (butt === 'Small &amp; firm') butt = 'Small & firm';
  if (butt === 'Large &amp; full') butt = 'Large & full';

  const data = {
    bodyType: getSelected('bg-bodyType'),
    bust:     document.getElementById('p-bust')?.value  || '',
    butt,
    waistHip: getSelected('bg-waistHip'),
    peach:    document.getElementById('p-peach')?.value || '',
    marks:    document.getElementById('p-marks')?.value || '',
    scent:    document.getElementById('p-scent')?.value || '',
  };

  doSave(() => {
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.userProfile = { ...(window.parent.__PC_STORE__.userProfile||{}), ...data };
    }
  });
}
