// screens/profile.js — v2.6 (User + Character unified)

function escTA(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function render() {
  syncStore();
  const area = document.getElementById('scroll-area');

  // textarea 스타일
  if (!document.getElementById('pf-style')) {
    const s = document.createElement('style');
    s.id = 'pf-style';
    s.textContent = `
.pf-textarea{width:100%;padding:0;border:none;background:transparent;color:var(--text-primary);font-size:15px;font-family:inherit;resize:none;outline:none;line-height:1.7;}
.pf-textarea::placeholder{color:var(--text-hint);font-size:14px;}
    `;
    document.head.appendChild(s);
  }

  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="pf-tab-user" onclick="pfSwitchTab('user')">User</button>
      <button class="tab-item" id="pf-tab-char" onclick="pfSwitchTab('char')">Character</button>
    </div>

    <!-- USER TAB -->
    <div id="pf-pane-user" style="display:flex;flex-direction:column;gap:10px;">
      <div class="list-group">
        <div class="section-label" style="padding:14px 16px 4px;">BODY</div>
        <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 16px;">
          <textarea class="pf-textarea" id="pf-userBody" rows="5"
            placeholder="e.g. Small perky breasts with pink inverted nipples, slender waist with venus dimples above the lower back. Labia is pink with no pubic hair. Skin is smooth and flushes rose when aroused.">${escTA(store.userBody||'')}</textarea>
        </div>
        <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 16px;">
          <span class="row-label" style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Marks & Features</span>
          <textarea class="pf-textarea" id="pf-userMarks" rows="2"
            placeholder="e.g. Small scar on inner left thigh, freckle below left collarbone">${escTA(store.userMarks||'')}</textarea>
        </div>
      </div>
      <div class="list-group">
        <div class="section-label" style="padding:14px 16px 4px;">EROGENOUS</div>
        <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 16px;">
          <textarea class="pf-textarea" id="pf-userErogenous" rows="4"
            placeholder="e.g. Tight and gets wet easily. Ears and neck are extremely sensitive — light touch causes immediate moaning and full-body flushing. Reaches orgasm relatively quickly.">${escTA(store.userErogenous||'')}</textarea>
        </div>
      </div>
    </div>

    <!-- CHARACTER TAB -->
    <div id="pf-pane-char" style="display:none;flex-direction:column;gap:10px;">
      <div class="list-group">
        <div class="section-label" style="padding:14px 16px 4px;">BODY</div>
        <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 16px;">
          <textarea class="pf-textarea" id="pf-charBody" rows="5"
            placeholder="e.g. Thick and girthy, becomes very hard and thick when fully erect. Broad shoulders, muscular build, thick neck and large hands.">${escTA(store.charBody||'')}</textarea>
        </div>
        <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 16px;">
          <span class="row-label" style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Marks & Features</span>
          <textarea class="pf-textarea" id="pf-charMarks" rows="2"
            placeholder="e.g. Scar on left shoulder, large rough hands">${escTA(store.charMarks||'')}</textarea>
        </div>
      </div>
      <div class="list-group">
        <div class="section-label" style="padding:14px 16px 4px;">EROGENOUS</div>
        <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 16px;">
          <textarea class="pf-textarea" id="pf-charErogenous" rows="4"
            placeholder="e.g. Back of the ears and nape are sensitive — gets visibly aroused when touched there. Low quiet moans when stimulated.">${escTA(store.charErogenous||'')}</textarea>
        </div>
      </div>
    </div>

    <div style="height:80px;"></div>
  `;

  // Save bar
  const saveBar = document.createElement('div');
  saveBar.className = 'save-bar';
  saveBar.innerHTML = '<button class="save-btn" id="pf-save-btn">Save</button>';
  document.getElementById('popup').appendChild(saveBar);
  document.getElementById('pf-save-btn').onclick = pfSave;
}

window.pfSwitchTab = function(tab) {
  document.getElementById('pf-tab-user').className = 'tab-item' + (tab==='user'?' active':'');
  document.getElementById('pf-tab-char').className = 'tab-item' + (tab==='char'?' active':'');
  document.getElementById('pf-pane-user').style.display = tab==='user' ? 'flex' : 'none';
  document.getElementById('pf-pane-char').style.display = tab==='char' ? 'flex' : 'none';
};

function pfSave() {
  const data = {
    userBody:      document.getElementById('pf-userBody')?.value      || '',
    userMarks:     document.getElementById('pf-userMarks')?.value     || '',
    userErogenous: document.getElementById('pf-userErogenous')?.value || '',
    charBody:      document.getElementById('pf-charBody')?.value      || '',
    charMarks:     document.getElementById('pf-charMarks')?.value     || '',
    charErogenous: document.getElementById('pf-charErogenous')?.value || '',
  };
  doSave(() => {
    if (window.parent?.__PC_STORE__) {
      Object.assign(window.parent.__PC_STORE__, data);
    }
  });
}
