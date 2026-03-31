// screens/lasttouch.js — Last Touch

export function render() {
  syncStore();
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="range-group">
      <div class="range-row">
        <span class="range-label">채팅 범위</span>
        <input class="range-input" id="lt-range-start" type="number" placeholder="#시작"/>
        <span class="range-sep">—</span>
        <input class="range-input" id="lt-range-end" type="number" placeholder="#끝"/>
        <span class="range-hint">비우면 최근 20개</span>
      </div>
    </div>
    <button class="ai-btn" id="lt-ai-btn" onclick="ltAIFetch()" style="margin-bottom:12px;">✦ AI 불러오기</button>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;padding:0 2px;">
      <span class="section-label" style="margin:0;">기록</span>
      <span style="font-size:13px;color:var(--text-hint);" id="lt-counter">0 / 5</span>
    </div>
    <div class="list-group" id="lt-list"></div>

    <!-- 팝업 -->
    <div class="popup-overlay" id="lt-popup-overlay">
      <div class="popup-card" id="lt-popup-card">
        <div class="popup-topbar">
          <span class="popup-title" id="lt-popup-title"></span>
          <button class="popup-close" onclick="ltClosePopup()">✕</button>
        </div>
        <div class="popup-scroll">
          <div class="popup-meta" id="lt-popup-meta"></div>
          <div class="popup-tags" id="lt-popup-tags"></div>
          <div class="popup-section-label">캐릭터 리뷰</div>
          <div class="popup-review" id="lt-popup-review"></div>
          <div class="popup-footer">
            <button class="popup-pin-btn" id="lt-popup-pin" onclick="ltTogglePin()">📌 핀</button>
            <button class="popup-del-btn" onclick="ltDelete()">삭제</button>
          </div>
        </div>
      </div>
    </div>
  `;
  renderList();
}

function renderList() {
  syncStore();
  const lt     = store.lastTouch || { cards:[], pinned:[] };
  const cards  = lt.cards  || [];
  const pinned = lt.pinned || [];
  document.getElementById('lt-counter').textContent = cards.length + ' / 5';
  const list = document.getElementById('lt-list');
  if (!cards.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-hint);font-size:15px;">아직 기록이 없어요</div>';
    return;
  }
  list.innerHTML = cards.map(c => `
    <div class="lt-card" onclick="ltOpenPopup('${c.id}')">
      <div style="flex:1;min-width:0;">
        <div class="lt-title">${esc(c.title)}</div>
        <div class="lt-meta">${esc(c.mood||'')}${c.place?' · '+esc(c.place):''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <div class="lt-pin-dot${pinned.includes(c.id)?' show':''}"></div>
        <span class="lt-date">${esc(c.date||'')}</span>
        <span class="lt-chevron">›</span>
      </div>
    </div>
  `).join('');
}

let activeCardId = null;

window.ltOpenPopup = function(id) {
  syncStore();
  const lt   = store.lastTouch || { cards:[], pinned:[] };
  const card = lt.cards.find(c => c.id === id);
  if (!card) return;
  activeCardId = id;
  const isPinned = (lt.pinned||[]).includes(id);

  document.getElementById('lt-popup-title').textContent = card.title || '';
  document.getElementById('lt-popup-meta').textContent  = (card.date||'') + (card.place?' · 📍'+card.place:'');
  const tagsEl = document.getElementById('lt-popup-tags');
  tagsEl.innerHTML = (card.mood?`<span class="popup-tag mood">${esc(card.mood)}</span>`:'') +
    (card.positions||[]).map(p=>`<span class="popup-tag pos">${esc(p)}</span>`).join('');
  document.getElementById('lt-popup-review').textContent = card.charReview || '-';
  const pinBtn = document.getElementById('lt-popup-pin');
  pinBtn.className = 'popup-pin-btn' + (isPinned?' active':'');
  pinBtn.textContent = isPinned ? '📌 핀됨' : '📌 핀';

  document.getElementById('lt-popup-overlay').classList.add('show');
};

window.ltClosePopup = function() {
  document.getElementById('lt-popup-overlay').classList.remove('show');
  activeCardId = null;
};

window.ltTogglePin = function() {
  if (!activeCardId || !window.parent?.__PC_STORE__) return;
  const pinned = window.parent.__PC_STORE__.lastTouch.pinned;
  const idx    = pinned.indexOf(activeCardId);
  if (idx >= 0) pinned.splice(idx,1); else pinned.push(activeCardId);
  if (saveStore) saveStore();
  syncStore();
  ltOpenPopup(activeCardId);
  renderList();
};

window.ltDelete = function() {
  if (!activeCardId || !window.parent?.__PC_STORE__) return;
  showModal({
    title:'기록 삭제', desc:'이 기록을 삭제할까요?', confirmText:'삭제', danger:true,
    onConfirm:() => {
      window.parent.__PC_STORE__.lastTouch.cards  = window.parent.__PC_STORE__.lastTouch.cards.filter(c=>c.id!==activeCardId);
      window.parent.__PC_STORE__.lastTouch.pinned = window.parent.__PC_STORE__.lastTouch.pinned.filter(p=>p!==activeCardId);
      if (saveStore) saveStore();
      ltClosePopup();
      syncStore();
      renderList();
    }
  });
};

window.ltAIFetch = async function() {
  if (!generate) { alert('ST와 연결되지 않았어요.'); return; }
  const btn = document.getElementById('lt-ai-btn');
  btn.classList.add('loading');
  btn.textContent = '분석 중...';
  try {
    const startVal = document.getElementById('lt-range-start')?.value.trim();
    const endVal   = document.getElementById('lt-range-end')?.value.trim();
    let messages;
    if ((startVal||endVal) && getChatRange) messages = getChatRange(startVal||null, endVal||null);
    else messages = getRecentChat(10);
    const chatText = messages.map(m=>`[${m.name||m.role}]: ${m.content}`).join('\n');

    const systemPrompt = `You are an analyst for a sexual roleplay chat logger.
Character name: ${charName}
User name: ${userName}
${charDesc?`Character description:\n${charDesc}\n`:''}
${getWorldInfo()?`World info:\n${getWorldInfo()}\n`:''}

Analyze the chat log and extract sexual encounter records.
Return ONLY a JSON array (no markdown, no explanation). Max 5 sessions.

Session splitting: Only split if there is a clear time gap or scene reset.

Each object:
- id: unique string (timestamp-based)
- title: short evocative Korean title
- date: today YYYY.MM.DD
- place: location or null
- mood: atmosphere in English (e.g. "Slow Burn", "Rough", "Tender")
- positions: array of up to 3 positions in English
- charReview: Korean 4-part review in ${charName}'s exact speech style — naturally woven as one paragraph covering: 전체 만족도, 신체 묘사 (based on actual character/user descriptions), 유저 반응, 하이라이트. Explicit, no female-degrading slurs.
- condom: boolean

If no sexual content, return [].`;

    const result = await generate(systemPrompt, `Chat:\n${chatText}`);
    let cards = [];
    try { cards = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (!Array.isArray(cards)||!cards.length) { alert('NSFW 내용을 찾지 못했어요.'); return; }

    if (window.parent?.__PC_STORE__) {
      const existing    = window.parent.__PC_STORE__.lastTouch.cards;
      const pinnedIds   = window.parent.__PC_STORE__.lastTouch.pinned;
      const pinnedCards = existing.filter(c=>pinnedIds.includes(c.id));
      window.parent.__PC_STORE__.lastTouch.cards = [...cards, ...pinnedCards].slice(0,5);
      if (saveStore) saveStore();
    }
    syncStore();
    renderList();
  } catch(err) { console.error('[LT] error',err); alert('AI 호출 중 오류가 발생했어요.'); }
  btn.classList.remove('loading');
  btn.textContent = '✦ AI 불러오기';
};
