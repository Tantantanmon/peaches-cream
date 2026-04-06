// screens/vault-stash.js — Stash v1.0

let stolenCards   = [];
let evidenceCards = [];
let activeTab     = 'stolen';

export function render() {
  syncStore();
  const area = document.getElementById('scroll-area');

  if (!document.getElementById('stash-style')) {
    const s = document.createElement('style');
    s.id = 'stash-style';
    s.textContent = `
.stash-card{background:var(--surface);border-radius:16px;border:0.5px solid var(--divider);overflow:hidden;box-shadow:var(--shadow);margin-bottom:12px;}
.stash-header{padding:13px 16px;border-bottom:0.5px solid var(--divider-light);display:flex;align-items:center;justify-content:space-between;}
.stash-item-name{font-size:15px;font-weight:600;color:var(--text-primary);}
.stash-badge{font-size:11px;font-weight:600;border-radius:99px;padding:3px 10px;background:#fff0f3;color:#c03060;}
.stash-body{padding:12px 16px;display:flex;flex-direction:column;gap:8px;}
.stash-label{font-size:11px;font-weight:600;letter-spacing:0.5px;color:var(--text-muted);text-transform:uppercase;margin-bottom:2px;}
.stash-text{font-size:13px;color:var(--text-secondary);line-height:1.65;}
.stash-text.condition{color:#c03060;}
.stash-comment{font-size:12px;color:var(--text-muted);border-left:2px solid var(--divider);padding-left:10px;font-style:italic;line-height:1.6;}
.stash-divider{height:0.5px;background:var(--divider-light);}
.ev-card{background:var(--surface);border-radius:16px;border:0.5px solid var(--divider);overflow:hidden;box-shadow:var(--shadow);margin-bottom:12px;}
.ev-header{padding:13px 16px;border-bottom:0.5px solid var(--divider-light);display:flex;align-items:center;justify-content:space-between;}
.ev-num{font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:0.5px;}
.ev-prob{font-size:12px;font-weight:700;color:#c03060;}
.ev-body{padding:12px 16px;display:flex;flex-direction:column;gap:8px;}
.ev-behavior{font-size:14px;font-weight:500;color:var(--text-primary);}
.ev-delusion{font-size:13px;color:var(--text-secondary);line-height:1.65;background:#fff8f5;border-radius:8px;padding:10px 12px;}
.gen-btn{width:100%;background:var(--surface);border:0.5px solid var(--divider);border-radius:var(--radius-sm);padding:14px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--shadow);}
.gen-btn.loading{opacity:.5;pointer-events:none;}
    `;
    document.head.appendChild(s);
  }

  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="stash-tab-stolen"   onclick="stashSwitchTab('stolen')">Stolen</button>
      <button class="tab-item"        id="stash-tab-evidence" onclick="stashSwitchTab('evidence')">Evidence</button>
    </div>
    <div id="stash-pane-stolen"   style="display:flex;flex-direction:column;gap:0;"></div>
    <div id="stash-pane-evidence" style="display:none;flex-direction:column;gap:0;"></div>
  `;

  stashRenderStolen();
  stashRenderEvidence();
}

window.stashSwitchTab = function(tab) {
  activeTab = tab;
  document.getElementById('stash-tab-stolen').className   = 'tab-item' + (tab==='stolen'  ?' active':'');
  document.getElementById('stash-tab-evidence').className = 'tab-item' + (tab==='evidence'?' active':'');
  document.getElementById('stash-pane-stolen').style.display   = tab==='stolen'   ? 'flex' : 'none';
  document.getElementById('stash-pane-evidence').style.display = tab==='evidence' ? 'flex' : 'none';
};

function stashRenderStolen() {
  const pane = document.getElementById('stash-pane-stolen');
  if (!pane) return;
  if (stolenCards.length) {
    pane.innerHTML = stolenCards.map((c, i) => stolenCardHTML(c, i)).join('');
  }
  const btn = document.createElement('button');
  btn.className = 'gen-btn';
  btn.id = 'stolen-gen-btn';
  btn.innerHTML = '✦ 새로 생성';
  btn.onclick = () => stashGenerate('stolen');
  pane.appendChild(btn);
}

function stashRenderEvidence() {
  const pane = document.getElementById('stash-pane-evidence');
  if (!pane) return;
  if (evidenceCards.length) {
    pane.innerHTML = evidenceCards.map((c, i) => evidenceCardHTML(c, i)).join('');
  }
  const btn = document.createElement('button');
  btn.className = 'gen-btn';
  btn.id = 'evidence-gen-btn';
  btn.innerHTML = '✦ 새로 생성';
  btn.onclick = () => stashGenerate('evidence');
  pane.appendChild(btn);
}

function stolenCardHTML(c, i) {
  return `
    <div class="stash-card">
      <div class="stash-header">
        <span class="stash-item-name">${esc(c.item)}</span>
      </div>
      <div class="stash-body">
        <div>
          <div class="stash-label">훔친 상황</div>
          <div class="stash-text">${esc(c.situation)}</div>
        </div>
        <div class="stash-divider"></div>
        <div>
          <div class="stash-label">현재 상태</div>
          <div class="stash-text condition">${esc(c.condition)}</div>
        </div>

      </div>
    </div>
  `;
}

function evidenceCardHTML(c, i) {
  return `
    <div class="ev-card">
      <div class="ev-header">
        <span class="ev-num">EVIDENCE #${String(i+1).padStart(3,'0')}</span>
        <span class="ev-prob">나를 좋아할 확률 ${c.probability}%</span>
      </div>
      <div class="ev-body">
        <div class="ev-behavior">${esc(c.behavior)}</div>
        <div class="ev-delusion">${esc(c.delusion)}</div>
      </div>
    </div>
  `;
}

window.stashGenerate = async function(type) {
  if (!generateWithRole) { showToast('ST와 연결되지 않았어요'); return; }
  const btnId = type === 'stolen' ? 'stolen-gen-btn' : 'evidence-gen-btn';
  const btn = document.getElementById(btnId);
  if (btn) { btn.classList.add('loading'); btn.textContent = '생성 중...'; }

  syncStore();
  const cd = window.parent?.__PC_STORE__ || store;

  try {
    let sys, userMsg, result;

    if (type === 'stolen') {
      const history = cd.stashStolenHistory || [];
      const excluded = history.length ? `Do NOT repeat these items: ${history.slice(-20).join(', ')}` : '';

      sys = `You are ${charName}. You have been secretly stealing items belonging to ${userName}.
${charDesc ? `Character:\n${charDesc.slice(0,300)}\n` : ''}
Speak strictly in ${charName}'s tone and personality.
Be extremely explicit and perverted. No female-degrading slurs.
${excluded}

Generate exactly 2 stolen item objects. Return ONLY a JSON array, no markdown.
Each object:
{
  "item": "아이템명 (Korean, specific — underwear, clothing, accessories, personal items)",
  "situation": "훔친 상황 (Korean, 1 sentence, specific and detailed)",
  "condition": "현재 보관 상태 (Korean, 1 sentence, extremely explicit — include cum stains, used for masturbation, smelled/licked, kept under pillow, worn while sleeping, etc)"
}`;
      userMsg = `${charName}이 ${userName}의 물건을 훔친 기록 2개 생성`;
      result = await generateWithRole(sys, userMsg, 'stash');
      let cards = JSON.parse(result.replace(/```json|```/g,'').trim());
      if (!Array.isArray(cards)) throw new Error('not array');
      stolenCards = cards.slice(0,2);
      const newHistory = [...history, ...stolenCards.map(c=>c.item)].slice(-30);
      if (window.parent?.__PC_STORE__) window.parent.__PC_STORE__.stashStolenHistory = newHistory;
      if (saveStore) saveStore();
      const pane = document.getElementById('stash-pane-stolen');
      if (pane) {
        pane.innerHTML = stolenCards.map((c,i) => stolenCardHTML(c,i)).join('');
        const newBtn = document.createElement('button');
        newBtn.className = 'gen-btn';
        newBtn.id = 'stolen-gen-btn';
        newBtn.innerHTML = '✦ 새로 생성';
        newBtn.onclick = () => stashGenerate('stolen');
        pane.appendChild(newBtn);
      }

    } else {
      const history = cd.stashEvidenceHistory || [];
      const excluded = history.length ? `Do NOT repeat these behaviors: ${history.slice(-20).join(', ')}` : '';

      sys = `You are ${charName}. You are obsessively collecting evidence that ${userName} is in love with you.
${charDesc ? `Character:\n${charDesc.slice(0,300)}\n` : ''}
Speak strictly in ${charName}'s tone and personality.
The evidence must be based on completely trivial, mundane behaviors that you are wildly misinterpreting.
Your delusions must be completely irrational but stated with absolute confidence.
${excluded}

Generate exactly 2 evidence objects. Return ONLY a JSON array, no markdown.
Each object:
{
  "behavior": "관찰한 행동 (Korean, 1 sentence, trivial/mundane action)",
  "delusion": "망상 해석 (Korean, 1 sentence, completely delusional and obsessive interpretation, stated with total confidence)",
  "probability": <integer 70-99>
}`;
      userMsg = `${userName}이 나를 좋아한다는 증거 2개 생성`;
      result = await generateWithRole(sys, userMsg, 'stash');
      let cards = JSON.parse(result.replace(/```json|```/g,'').trim());
      if (!Array.isArray(cards)) throw new Error('not array');
      evidenceCards = cards.slice(0,2);
      const newHistory = [...history, ...evidenceCards.map(c=>c.behavior)].slice(-30);
      if (window.parent?.__PC_STORE__) window.parent.__PC_STORE__.stashEvidenceHistory = newHistory;
      if (saveStore) saveStore();
      const pane = document.getElementById('stash-pane-evidence');
      if (pane) {
        pane.innerHTML = evidenceCards.map((c,i) => evidenceCardHTML(c,i)).join('');
        const newBtn = document.createElement('button');
        newBtn.className = 'gen-btn';
        newBtn.id = 'evidence-gen-btn';
        newBtn.innerHTML = '✦ 새로 생성';
        newBtn.onclick = () => stashGenerate('evidence');
        pane.appendChild(newBtn);
      }
    }
  } catch(e) {
    console.error('[Stash] error', e);
    showToast('생성에 실패했어요');
    const btn2 = document.getElementById(btnId);
    if (btn2) { btn2.classList.remove('loading'); btn2.textContent = '✦ 새로 생성'; }
  }
};
