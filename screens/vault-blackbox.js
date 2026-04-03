// screens/vault-blackbox.js — Blackbox v1.0

let threatCards = [];
let complaintCards = [];
let threatIdx = 0;
let complaintIdx = 0;
let activeTab = 'threat';

export function render() {
  syncStore();
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="bb-tab-threat" onclick="bbSwitchTab('threat')">Threat Mail</button>
      <button class="tab-item" id="bb-tab-complaint" onclick="bbSwitchTab('complaint')">Complaints</button>
    </div>
    <div id="bb-pane-threat" style="display:flex;flex-direction:column;gap:12px;">
      <div class="loading-card" id="threat-loading" style="display:none;"><div class="sp"></div><span class="loading-text">불러오는 중...</span></div>
      <div id="threat-cards" style="display:flex;flex-direction:column;gap:12px;"></div>
      <button class="gen-btn" onclick="bbGenerate('threat')">✦ New Letters</button>
    </div>
    <div id="bb-pane-complaint" style="display:none;flex-direction:column;gap:12px;">
      <div class="loading-card" id="complaint-loading" style="display:none;"><div class="sp"></div><span class="loading-text">불러오는 중...</span></div>
      <div id="complaint-cards" style="display:flex;flex-direction:column;gap:12px;"></div>
      <button class="gen-btn" onclick="bbGenerate('complaint')">✦ New Cases</button>
    </div>
  `;

  if (!document.getElementById('bb-style')) {
    const s = document.createElement('style');
    s.id = 'bb-style';
    s.textContent = `
.bb-card{background:var(--surface);border-radius:var(--radius-md);box-shadow:var(--shadow);overflow:hidden;}
.bb-header{padding:12px 16px;border-bottom:0.5px solid var(--divider-light);display:flex;align-items:center;justify-content:space-between;}
.bb-from{font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase;}
.bb-num{font-size:11px;color:var(--text-hint);}
.bb-body{padding:14px 16px;}
.bb-text{font-size:14px;color:var(--text-primary);line-height:1.7;margin-bottom:12px;}
.bb-guess{font-size:12px;color:var(--text-hint);font-style:italic;border-left:2px solid var(--divider);padding-left:10px;margin-bottom:12px;}
.bb-comment{background:var(--background);border-radius:10px;padding:10px 14px;border-left:3px solid var(--text-primary);}
.bb-comment-label{font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
.bb-comment-text{font-size:13px;color:var(--text-primary);line-height:1.65;}
.bb-status{font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:var(--background);color:var(--text-muted);}
    `;
    document.head.appendChild(s);
  }

  if (threatCards.length) renderCards('threat');
  if (complaintCards.length) renderCards('complaint');
}

window.bbSwitchTab = function(tab) {
  activeTab = tab;
  document.getElementById('bb-tab-threat').className = 'tab-item' + (tab==='threat'?' active':'');
  document.getElementById('bb-tab-complaint').className = 'tab-item' + (tab==='complaint'?' active':'');
  document.getElementById('bb-pane-threat').style.display = tab==='threat' ? 'flex' : 'none';
  document.getElementById('bb-pane-complaint').style.display = tab==='complaint' ? 'flex' : 'none';
};

function renderCards(type) {
  const cards = type==='threat' ? threatCards : complaintCards;
  const wrap = document.getElementById(`${type}-cards`);
  if (!wrap || !cards.length) return;

  if (type === 'threat') {
    wrap.innerHTML = cards.map((c, i) => `
      <div class="bb-card">
        <div class="bb-header">
          <span class="bb-from">${esc(c.from||'Anonymous')}</span>
          <span class="bb-num">#${String(i+1).padStart(3,'0')}</span>
        </div>
        <div class="bb-body">
          <div class="bb-text">${esc(c.text)}</div>
          <div class="bb-guess">${esc(c.guess)}</div>
          <div class="bb-comment">
            <div class="bb-comment-label">Comment</div>
            <div class="bb-comment-text">${esc(c.comment)}</div>
          </div>
        </div>
      </div>
    `).join('');
  } else {
    wrap.innerHTML = cards.map((c, i) => `
      <div class="bb-card">
        <div class="bb-header">
          <span class="bb-from">Case #${String(391+i).padStart(4,'0')}</span>
          <span class="bb-status">${c.status==='dismissed'?'Dismissed':'Under Review'}</span>
        </div>
        <div class="bb-body">
          <div class="bb-from" style="margin-bottom:8px;">${esc(c.from||'Anonymous')}</div>
          <div class="bb-text">${esc(c.text)}</div>
          <div class="bb-guess">${esc(c.guess)}</div>
          <div class="bb-comment">
            <div class="bb-comment-label">Comment</div>
            <div class="bb-comment-text">${esc(c.comment)}</div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

window.bbGenerate = async function(type) {
  if (!generateWithRole) { alert('ST와 연결되지 않았어요.'); return; }
  const loading = document.getElementById(`${type}-loading`);
  if (loading) loading.style.display = 'flex';

  try {
    syncStore();
    const bbStore = store.blackboxHistory || { threat:[], complaint:[] };
    const history = type==='threat' ? (bbStore.threat||[]) : (bbStore.complaint||[]);
    const excluded = history.length ? `\nDo NOT reuse these ideas: ${history.slice(-9).join(' / ')}` : '';
    const isUserSender = Math.random() < 0.33;

    let sys;
    if (type === 'threat') {
      sys = `You are generating anonymous threat letters received by ${charName}.
${charDesc?`Character: ${charDesc.slice(0,100)}\n`:''}
${excluded}

Generate exactly 3 threat letter objects. Return ONLY a JSON array (no markdown).
Senders are anonymous but ${charName} can guess who it is based on clues.
${isUserSender ? `One letter must be from ${userName} (but sent anonymously). ${charName} immediately recognizes it's them.` : `All senders are from ${charName}'s world — rivals, ex-lovers, jealous fans, colleagues, etc. Match the character's world/occupation.`}
Mix tones: genuine threat, NSFW threat, comic/petty threat. Explicit content allowed. No female-degrading slurs.
${charName}'s reaction: completely unbothered, even amused. Max 20 words. ${charReaction}

Each object: from(anonymous description e.g. "No postmark", "Perfume traces"), text(Korean threat letter, 2-3 sentences), guess(Korean, ${charName}'s one-line guess of who sent it), comment(Korean, max 20 words, unbothered/cocky response).`;
    } else {
      sys = `You are generating anonymous complaints filed against ${charName}.
${charDesc?`Character: ${charDesc.slice(0,100)}\n`:''}
${excluded}

Generate exactly 3 complaint objects. Return ONLY a JSON array (no markdown).
Complainants are anonymous but ${charName} can guess who it is.
${isUserSender ? `One complaint must be from ${userName} (but filed anonymously). ${charName} immediately recognizes it.` : `All complainants are from ${charName}'s world — teammates, rivals, ex-lovers, officials, fans, etc. Match the character's world/occupation.`}
Mix tones: NSFW complaint, serious complaint, absurd/comic complaint. Explicit content allowed. No female-degrading slurs.
Processing status is always either "dismissed" or "under_review".
${charName}'s reaction: completely unbothered, shameless. Max 20 words. ${charReaction}

Each object: from(anonymous description), text(Korean complaint, 2-3 sentences), guess(Korean, ${charName}'s one-line guess), status("dismissed" or "under_review"), comment(Korean, max 20 words, shameless response).`;
    }

    const result = await generateWithRole(sys, `${type} 3개 생성`, 'blackbox');
    let cards = [];
    try { cards = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (!Array.isArray(cards)||!cards.length) { alert('생성에 실패했어요.'); if(loading) loading.style.display='none'; return; }

    const newHistory = [...history, ...cards.map(c=>c.text.slice(0,30))].slice(-15);
    if (window.parent?.__PC_STORE__) {
      if (!window.parent.__PC_STORE__.blackboxHistory) window.parent.__PC_STORE__.blackboxHistory = { threat:[], complaint:[] };
      window.parent.__PC_STORE__.blackboxHistory[type] = newHistory;
      if (saveStore) saveStore();
    }

    if (type==='threat') threatCards = cards;
    else complaintCards = cards;
    renderCards(type);
  } catch(err) { console.error('[Blackbox] error', err); alert('AI 호출 중 오류가 발생했어요.'); }

  if (loading) loading.style.display = 'none';
};
