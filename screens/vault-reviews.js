// screens/vault-reviews.js — v2.6

export function render() {
  syncStore();
  const saved = store.reviewsSaved || [];
  const area  = document.getElementById('scroll-area');
  area.innerHTML = `
    ${saved.length ? renderAvg(saved) : ''}
    <div id="reviews-list" style="display:flex;flex-direction:column;gap:0;"></div>
    <div class="loading-card" id="rv-loading" style="display:none;margin-bottom:10px;"><div class="sp"></div><span class="loading-text">후기 생성 중...</span></div>
    <button class="gen-btn" id="rv-gen-btn" onclick="rvGenerate()">✦ 새 후기 생성</button>
  `;
  if (saved.length) renderList(saved);
}

function renderAvg(reviews) {
  const avg      = (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1);
  const recCount = reviews.filter(r=>r.rec).length;
  const stars    = Array.from({length:5},(_,i)=>`<span class="avg-star${i<Math.round(parseFloat(avg))?' on':''}">★</span>`).join('');
  return `
    <div class="avg-card">
      <div>
        <div style="font-size:11px;font-weight:600;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">평균 평점</div>
        <div style="display:flex;align-items:baseline;gap:5px;"><span class="avg-score">${avg}</span><span class="avg-max">/ 5</span></div>
        <div class="avg-stars-row">${stars}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;">
        <span class="avg-count">${reviews.length}개 후기</span>
        <span class="rec-ratio">👍 ${Math.round(recCount/reviews.length*100)}% 추천</span>
      </div>
    </div>
  `;
}

let openAccIdx = -1;

function renderList(reviews) {
  const list = document.getElementById('reviews-list');
  if (!list) return;
  list.innerHTML = reviews.map((r,i) => `
    <div class="acc-item${openAccIdx===i?' open':''}" id="acc-${i}">
      <div class="acc-header" onclick="rvToggle(${i})">
        <div class="acc-avatar">👤</div>
        <div class="acc-meta">
          <div class="acc-name">${esc(r.name)}</div>
          <div class="acc-stars-row">
            ${Array.from({length:5},(_,j)=>`<span class="acc-star${j<r.rating?' on':''}">★</span>`).join('')}
          </div>
        </div>
        <span class="acc-rec-badge ${r.rec?'rec':'norec'}">${r.rec?'👍 추천':'👎 비추'}</span>
        <span class="acc-arrow">▾</span>
      </div>
      <div class="acc-body">
        <div class="review-text">${esc(r.text)}</div>


      </div>
    </div>
  `).join('');
}

window.rvToggle = function(i) {
  openAccIdx = openAccIdx===i ? -1 : i;
  syncStore();
  renderList(store.reviewsSaved||[]);
};

window.rvGenerate = async function() {
  if (!generateWithRole) { alert('ST와 연결되지 않았어요.'); return; }
  const btn = document.getElementById('rv-gen-btn');
  btn.classList.add('loading'); btn.textContent = '후기 생성 중...';
  document.getElementById('rv-loading').style.display = 'flex';

  try {
    syncStore();
    const history  = store.reviewsHistory || [];
    const excluded = '';

    const sys = `You are generating anonymous reviews for ${charName} in a NSFW roleplay context.
${charDesc?`Character: ${charDesc.slice(0,300)}\n`:''}
${charName ? `Speak strictly in ${charName}'s tone and personality.\n` : ''}
${excluded}

IMPORTANT: Be creative. Do NOT reference specific chat events.
Return ONLY a JSON array of 3 objects (no markdown).
Each: name(Korean anonymous e.g. "익명의 클럽녀"), rating(1-5), rec(boolean), text(2-3 sentence Korean review, explicit ok, no slurs).
Vary sentiment and context.`

    const result = await generateWithRole(sys, '후기 3개 생성해줘', 'reviews');
    let reviews = [];
    try { reviews = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (!Array.isArray(reviews)||!reviews.length) { alert('생성에 실패했어요.'); return; }

    const newHistory = [...history, ...reviews.map(r=>r.name)].slice(-30);
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.reviewsHistory = newHistory;
      window.parent.__PC_STORE__.reviewsSaved   = reviews;
      if (saveStore) saveStore();
    }
    syncStore();
    openAccIdx = -1;

    const area = document.getElementById('scroll-area');
    const avgEl = area.querySelector('.avg-card');
    if (avgEl) avgEl.outerHTML = renderAvg(reviews);
    else area.insertAdjacentHTML('afterbegin', renderAvg(reviews));
    renderList(reviews);
  } catch(err) { console.error('[Reviews] error', err); alert('AI 호출 중 오류가 발생했어요.'); }

  btn.classList.remove('loading'); btn.textContent = '✦ 새 후기 생성';
  document.getElementById('rv-loading').style.display = 'none';
};
