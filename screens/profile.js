// screens/profile.js — 유저 프로필

export function render() {
  syncStore();
  const p = store.userProfile || {};
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">BASIC INFO</div>
      <div class="list-row">
        <span class="row-label">Height</span>
        <div style="display:flex;align-items:center;gap:4px;">
          <input class="ps-input" id="p-height" type="number" placeholder="165" value="${esc(p.height||'')}"/>
          <span class="ps-unit">cm</span>
        </div>
      </div>
      <div class="list-row">
        <span class="row-label">Weight</span>
        <div style="display:flex;align-items:center;gap:4px;">
          <input class="ps-input" id="p-weight" type="number" placeholder="52" value="${esc(p.weight||'')}"/>
          <span class="ps-unit">kg</span>
        </div>
      </div>
      <div class="list-row">
        <span class="row-label">Eye color</span>
        <input class="ps-text-input" id="p-eye" type="text" placeholder="Dark brown" value="${esc(p.eyeColor||'')}"/>
      </div>
      <div class="list-row">
        <span class="row-label">Hair</span>
        <input class="ps-text-input" id="p-hair" type="text" placeholder="Black, long" value="${esc(p.hair||'')}"/>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Skin tone</span>
        <div class="btn-group" id="bg-skinTone">
          ${pills(['Light','Medium','Dark'], p.skinTone)}
        </div>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Body type</span>
        <div class="btn-group" id="bg-bodyType">
          ${pills(['Slim','Average','Glamorous','Athletic'], p.bodyType)}
        </div>
      </div>
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">PHYSICAL FEATURES</div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Bust</span>
        <div class="btn-group" id="bg-chest">
          ${pills(['A','B','C','D','D+'], p.chest)}
        </div>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Butt</span>
        <div class="btn-group" id="bg-butt">
          ${pills(['Small &amp; firm','Large &amp; full','Average'], p.butt)}
        </div>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Waist-hip</span>
        <div class="btn-group" id="bg-waistHip">
          ${pills(['Slim','Hourglass','Full'], p.waistHip)}
        </div>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Skin texture</span>
        <div class="btn-group" id="bg-skinTexture">
          ${pills(['Soft','Firm','Average'], p.skinTexture)}
        </div>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Body hair</span>
        <div class="btn-group" id="bg-bodyHair">
          ${pills(['Yes','None','A little'], p.bodyHair)}
        </div>
      </div>
      <div class="list-row">
        <span class="row-label">Peach color</span>
        <input class="ps-text-input" id="p-peachcolor" type="text" placeholder="e.g. pink, peach" value="${esc(p.peachColor||'')}"/>
      </div>
      <div class="list-row" style="flex-wrap:wrap;gap:8px;">
        <span class="row-label">Venus dimples</span>
        <div class="btn-group" id="bg-venusDimples">
          ${pills(['Yes','No'], p.venusDimples)}
        </div>
      </div>
    </div>

    <div class="list-group" style="margin-bottom:10px;">
      <div class="section-label" style="padding:14px 16px 4px;">VIBE / SCENT</div>
      <div class="list-row">
        <span class="row-label">Scent type</span>
        <input class="ps-text-input" id="p-scent" type="text" placeholder="e.g. sweet vanilla" value="${esc(p.scent||'')}"/>
      </div>
    </div>
    <div style="height:80px;"></div>
  `;

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
  const data = {
    height:       document.getElementById('p-height')?.value || '',
    weight:       document.getElementById('p-weight')?.value || '',
    eyeColor:     document.getElementById('p-eye')?.value    || '',
    hair:         document.getElementById('p-hair')?.value   || '',
    peachColor:   document.getElementById('p-peachcolor')?.value || '',
    scent:        document.getElementById('p-scent')?.value  || '',
    skinTone:     getSelected('bg-skinTone'),
    bodyType:     getSelected('bg-bodyType'),
    chest:        getSelected('bg-chest'),
    butt:         getSelected('bg-butt'),
    waistHip:     getSelected('bg-waistHip'),
    skinTexture:  getSelected('bg-skinTexture'),
    bodyHair:     getSelected('bg-bodyHair'),
    venusDimples: getSelected('bg-venusDimples'),
  };
  // butt HTML entities 복원
  if (data.butt === 'Small &amp; firm') data.butt = 'Small & firm';
  if (data.butt === 'Large &amp; full') data.butt = 'Large & full';

  doSave(() => {
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.userProfile = { ...(window.parent.__PC_STORE__.userProfile||{}), ...data };
    }
  });
  // save bar 제거
}
