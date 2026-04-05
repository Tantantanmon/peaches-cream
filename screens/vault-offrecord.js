// screens/vault-offrecord.js — v2.6

let cogCards  = [];
let darkCards = [];
let cogIdx    = 0;
let darkIdx   = 0;
let activeTab = 'cog';

export async function render() {
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="otr-tab-cog"  onclick="otrSwitchTab('cog')">Caught Off Guard</button>
      <button class="tab-item"        id="otr-tab-dark" onclick="otrSwitchTab('dark')">Dark Thoughts</button>
    </div>
    <div id="otr-pane-cog" style="display:flex;flex-direction:column;gap:10px;">
      <div class="otr-card" id="cog-card">
        <div class="otr-num" id="cog-num">1 / 5</div>
        <div class="otr-text" id="cog-text">생성 버튼을 눌러 시작하세요</div>
        <div class="otr-divider"></div>
        <div class="otr-comment" id="cog-comment">...</div>
      </div>
      <div class="nav-row">
        <button class="nav-btn" onclick="otrPrev('cog')">← 이전</button>
        <button class="nav-btn primary" onclick="otrNext('cog')">다음 →</button>
      </div>
      <div class="loading-card" id="cog-loading" style="display:none;"><div class="sp"></div><span class="loading-text">생성 중...</span></div>
      <button class="gen-btn" onclick="otrGenerate('cog')">✦ 새로 생성</button>
    </div>
    <div id="otr-pane-dark" style="display:none;flex-direction:column;gap:10px;">
      <div class="otr-card" id="dark-card">
        <div class="otr-num" id="dark-num">1 / 5</div>
        <div class="otr-text" id="dark-text">생성 버튼을 눌러 시작하세요</div>
        <div class="otr-divider"></div>
        <div class="otr-comment" id="dark-comment">...</div>
      </div>
      <div class="nav-row">
        <button class="nav-btn" onclick="otrPrev('dark')">← 이전</button>
        <button class="nav-btn primary" onclick="otrNext('dark')">다음 →</button>
      </div>
      <div class="loading-card" id="dark-loading" style="display:none;"><div class="sp"></div><span class="loading-text">생성 중...</span></div>
      <button class="gen-btn" onclick="otrGenerate('dark')">✦ 새로 생성</button>
    </div>
  `;
  syncStore();
  if (store.cogCards  && store.cogCards.length)  { cogCards  = store.cogCards;  cogIdx=0; renderCard('cog');  }
  if (store.darkCards && store.darkCards.length) { darkCards = store.darkCards; darkIdx=0; renderCard('dark'); }
}

window.otrSwitchTab = function(tab) {
  activeTab = tab;
  document.getElementById('otr-tab-cog').className  = 'tab-item' + (tab==='cog'?' active':'');
  document.getElementById('otr-tab-dark').className = 'tab-item' + (tab==='dark'?' active':'');
  document.getElementById('otr-pane-cog').style.display  = tab==='cog'  ? 'flex' : 'none';
  document.getElementById('otr-pane-dark').style.display = tab==='dark' ? 'flex' : 'none';
};

function renderCard(type) {
  const cards = type==='cog' ? cogCards : darkCards;
  const idx   = type==='cog' ? cogIdx   : darkIdx;
  if (!cards.length) return;
  const c = cards[idx];
  document.getElementById(`${type}-num`).textContent     = `${idx+1} / ${cards.length}`;
  document.getElementById(`${type}-text`).textContent    = c.text    || '';
  document.getElementById(`${type}-comment`).textContent = c.comment || '';
}

window.otrNext = function(type) {
  const cards = type==='cog' ? cogCards : darkCards;
  if (!cards.length) return;
  if (type==='cog') cogIdx  = (cogIdx+1)  % cards.length;
  else              darkIdx = (darkIdx+1) % cards.length;
  renderCard(type);
};

window.otrPrev = function(type) {
  const cards = type==='cog' ? cogCards : darkCards;
  if (!cards.length) return;
  if (type==='cog') cogIdx  = (cogIdx-1+cards.length)  % cards.length;
  else              darkIdx = (darkIdx-1+darkCards.length) % darkCards.length;
  renderCard(type);
};

window.otrGenerate = async function(type) {
  if (!generateWithRole) { alert('ST와 연결되지 않았어요.'); return; }
  const loading = document.getElementById(`${type}-loading`);
  if (loading) loading.style.display = 'flex';

  try {
    syncStore();
    const history  = type==='cog' ? (store.cogHistory||[])  : (store.darkHistory||[]);
    const excluded = '';

    let sys;
    if (type === 'cog') {
      sys = `You are generating "Caught Off Guard" cards for ${charName} about ${userName}.
${charDesc?`Character: ${charDesc.slice(0,300)}\n`:''}
${charName ? `Speak strictly in ${charName}'s tone and personality.\n` : ''}
${excluded}

IMPORTANT: Be creative. Do NOT reference specific chat events.
Return ONLY a JSON array of 3 objects (no markdown).
Each: text(1 sentence Korean, secret SFW action), comment(2 line Korean inner monologue).`
    } else {
      sys = `You are generating "Dark Thoughts" cards for ${charName} about ${userName}.
${charDesc?`Character: ${charDesc.slice(0,300)}\n`:''}
${charName ? `Speak strictly in ${charName}'s tone and personality.\n` : ''}
${excluded}

IMPORTANT: Be creative. Do NOT reference specific chat events.
Return ONLY a JSON array of 3 objects (no markdown).
Each: text(1 sentence Korean, explicit sexual confession), comment(2 line Korean inner monologue).`
    }

    const result = await generateWithRole(sys, '카드 3장 생성해줘', 'offrecord');
    let cards = [];
    try { cards = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (!Array.isArray(cards)||!cards.length) { alert('생성에 실패했어요.'); if(loading) loading.style.display='none'; return; }

    const newHistory = [...history, ...cards.map(c=>c.text)].slice(-30);
    if (window.parent?.__PC_STORE__) {
      if (type==='cog') {
        window.parent.__PC_STORE__.cogHistory = newHistory;
        window.parent.__PC_STORE__.cogCards   = cards;
        cogCards = cards; cogIdx = 0;
      } else {
        window.parent.__PC_STORE__.darkHistory = newHistory;
        window.parent.__PC_STORE__.darkCards   = cards;
        darkCards = cards; darkIdx = 0;
      }
      if (saveStore) saveStore();
    }
    renderCard(type);
  } catch(err) { console.error('[OTR] error', err); alert('AI 호출 중 오류가 발생했어요.'); }

  if (loading) loading.style.display = 'none';
};
