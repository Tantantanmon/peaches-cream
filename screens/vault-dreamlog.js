// screens/vault-dreamlog.js — v2.6

const DREAM_TYPES = [
  { type:'nsfw',    emoji:'🔥', label:'NSFW',    weight:40 },
  { type:'comic',   emoji:'😂', label:'코믹',    weight:20 },
  { type:'weird',   emoji:'🌀', label:'개꿈',    weight:10 },
  { type:'farewell',emoji:'💔', label:'이별',    weight:15 },
  { type:'fight',   emoji:'😡', label:'싸움',    weight:15 },
];

const MOOD_KEYWORDS = {
  nsfw:     ['섹스','키스','안아','만져','야해','흥분','감각','욕망','붙어'],
  fight:    ['화났','싫어','짜증','왜 그래','미치겠','화가','ㅡㅡ','진짜'],
  farewell: ['보고싶','그리워','떠나','헤어','이별','울','눈물','혼자'],
};

let currentDream = null;
let afterOpen    = false;

export function render() {
  syncStore();
  currentDream = store.dreamLogCurrent || null;
  afterOpen    = false;

  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="dl-gen-row">
      <div>
        <div class="dl-gen-label">Tonight's Dream</div>
        <div class="dl-gen-sub">어떤 꿈을 꿀까? 🎰</div>
      </div>
      <button class="dl-gen-btn" id="dl-gen-btn" onclick="dlGenerate()">✦ ${currentDream ? '새로 꾸기' : '꿈 꾸기'}</button>
    </div>
    <div class="loading-card" id="dl-loading" style="display:none;">
      <div class="sp"></div><span class="loading-text" id="dl-loading-text">꿈 기록 중...</span>
    </div>
    <div id="dl-card-wrap" style="${currentDream?'':'display:none;'}">
      <div class="dl-card" id="dl-card">
        <div class="dl-card-header">
          <div class="dl-type-badge">
            <span class="dl-emoji" id="dl-emoji">🔥</span>
            <span class="dl-type" id="dl-type">NSFW</span>
          </div>
          <span class="dl-date">방금 전</span>
        </div>
        <div class="dl-title" id="dl-title"></div>
        <div class="dl-body" id="dl-body"></div>
        <div class="dl-accordion">
          <button class="dl-acc-toggle" onclick="dlToggleAfter()">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:14px;">💭</span>
              <span class="dl-acc-label">After the dream...</span>
            </div>
            <span class="dl-acc-arrow" id="dl-acc-arrow">▾</span>
          </button>
          <div class="dl-acc-body" id="dl-acc-body"></div>
        </div>
      </div>
    </div>
  `;

  if (!document.getElementById('dl-style')) {
    const s = document.createElement('style');
    s.id = 'dl-style';
    s.textContent = `
.dl-gen-row{display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:var(--radius-sm);border:0.5px solid var(--divider);padding:14px 18px;margin-bottom:12px;box-shadow:var(--shadow);}
.dl-gen-label{font-size:12px;font-weight:600;letter-spacing:0.6px;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px;}
.dl-gen-sub{font-size:15px;font-weight:600;color:var(--text-primary);}
.dl-gen-btn{background:#000;color:#fff;border:none;border-radius:var(--radius-btn);padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;}
.dl-gen-btn:active{opacity:.8;}
.dl-gen-btn.loading{opacity:.5;pointer-events:none;}
.dl-card{background:var(--surface);border-radius:var(--radius-md);box-shadow:var(--shadow-md);overflow:hidden;animation:dlFadeIn .4s ease;}
@keyframes dlFadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.dl-card-header{padding:14px 18px 10px;border-bottom:0.5px solid var(--divider-light);display:flex;align-items:center;justify-content:space-between;}
.dl-type-badge{display:flex;align-items:center;gap:6px;}
.dl-emoji{font-size:20px;}
.dl-type{font-size:12px;font-weight:700;letter-spacing:0.6px;color:var(--text-muted);text-transform:uppercase;}
.dl-date{font-size:12px;color:var(--text-hint);}
.dl-title{padding:14px 18px 4px;font-size:17px;font-weight:700;color:var(--text-primary);line-height:1.3;}
.dl-body{padding:8px 18px 16px;font-size:15px;color:var(--text-secondary);line-height:1.75;white-space:pre-line;}
.dl-accordion{border-top:0.5px solid var(--divider-light);}
.dl-acc-toggle{width:100%;padding:13px 18px;display:flex;align-items:center;justify-content:space-between;background:none;border:none;cursor:pointer;font-family:inherit;}
.dl-acc-label{font-size:13px;font-weight:600;color:var(--text-muted);letter-spacing:0.3px;}
.dl-acc-arrow{font-size:12px;color:var(--text-hint);transition:transform .2s;}
.dl-acc-arrow.open{transform:rotate(180deg);}
.dl-acc-body{padding:0 18px 16px;font-size:15px;color:var(--text-secondary);line-height:1.75;white-space:pre-line;display:none;}
.dl-acc-body.open{display:block;animation:dlFadeIn .3s ease;}
    `;
    document.head.appendChild(s);
  }

  if (currentDream) renderDream(currentDream);
}

function pickDreamType(chatText) {
  const boosts = { nsfw:0, fight:0, farewell:0 };
  if (chatText) {
    Object.entries(MOOD_KEYWORDS).forEach(([type, keywords]) => {
      keywords.forEach(kw => { if (chatText.includes(kw)) boosts[type] += 10; });
    });
  }
  const weighted = DREAM_TYPES.map(t => ({ ...t, w: t.weight + (boosts[t.type] || 0) }));
  const total = weighted.reduce((s, t) => s + t.w, 0);
  let r = Math.random() * total;
  for (const t of weighted) { r -= t.w; if (r <= 0) return t; }
  return weighted[0];
}

function renderDream(dream) {
  const wrap = document.getElementById('dl-card-wrap');
  if (wrap) wrap.style.display = 'block';
  document.getElementById('dl-emoji').textContent = dream.emoji || '🌙';
  document.getElementById('dl-type').textContent  = dream.typeLabel || '';
  document.getElementById('dl-title').textContent = dream.title || '';
  document.getElementById('dl-body').textContent  = dream.body  || '';
  document.getElementById('dl-acc-body').textContent = dream.after || '';
  document.getElementById('dl-acc-body').classList.remove('open');
  document.getElementById('dl-acc-arrow').classList.remove('open');
  afterOpen = false;
}

window.dlToggleAfter = function() {
  afterOpen = !afterOpen;
  document.getElementById('dl-acc-body').classList.toggle('open', afterOpen);
  document.getElementById('dl-acc-arrow').classList.toggle('open', afterOpen);
};

window.dlGenerate = async function() {
  if (!generate) { alert('ST와 연결되지 않았어요.'); return; }

  const btn = document.getElementById('dl-gen-btn');
  const loading = document.getElementById('dl-loading');
  const wrap = document.getElementById('dl-card-wrap');
  btn.classList.add('loading');
  if (wrap) wrap.style.display = 'none';
  loading.style.display = 'flex';

  const loadingMsgs = ['🌙','✨','💤','🌛'];
  let li = 0;
  const ltEl = document.getElementById('dl-loading-text');
  const lv = setInterval(() => { ltEl.textContent = `${loadingMsgs[li++ % loadingMsgs.length]} 꿈 기록 중...`; }, 500);

  try {
    const chatText = buildChatText(10);
    const up       = userPersona ? userPersona.slice(0, 100) : '';
    const picked   = pickDreamType(chatText);

    const typeInstructions = {
      nsfw:     `Write an NSFW dream. Include explicit sexual content and desires. Explicit language and descriptions are fully allowed.`,
      comic:    `Write a comic dream. Something realistic but funny — ${charName} is being serious inside the dream even though it's ridiculous.`,
      weird:    `Write a completely random nonsense dream with no logic. Something surreal and inexplicable.`,
      farewell: `Write an emotional, bittersweet dream about separation, longing, or not being able to reach ${userName}.`,
      fight:    `Write a dream where ${charName} and ${userName} fight or there's conflict. ${charName} caves first in the end.`,
    };

    const sys = `You are writing a dream diary entry for ${charName} about ${userName}. {{char}} is always male. {{user}} is always female.
${charDesc?`Character description:\n${charDesc.slice(0,300)}\n`:''}
${up?`User persona:\n${up}\n`:''}

Dream type: ${picked.label}
${typeInstructions[picked.type]}

Write STRICTLY in ${charName}'s exact voice and personality.

Return ONLY a JSON object (no markdown):
{
  "title": "dream title in Korean, max 10 chars, punchy one-liner",
  "body": "dream content in ${charName}'s diary voice. exactly 10 lines. first-person, casual Korean. Explicit if NSFW.",
  "after": "4 lines. ${charName}'s reaction after waking up. If ${userName} is nearby, describe how ${charName} acts toward them. ${charReaction}"
}`;

    const result = await generate(sys, '꿈 일기 작성해줘', 'dreamlog');
    let dream = null;
    try { dream = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}

    if (!dream || !dream.body) { alert('생성에 실패했어요.'); }
    else {
      dream.emoji     = picked.emoji;
      dream.typeLabel = picked.label;
      currentDream    = dream;
      if (window.parent?.__PC_STORE__) {
        window.parent.__PC_STORE__.dreamLogCurrent = dream;
        if (saveStore) saveStore();
      }
      renderDream(dream);
      const b = document.getElementById('dl-gen-btn');
      if (b) b.textContent = '✦ 새로 꾸기';
    }
  } catch(err) {
    console.error('[DreamLog] error', err);
    alert('AI 호출 중 오류가 발생했어요.');
  }

  clearInterval(lv);
  loading.style.display = 'none';
  btn.classList.remove('loading');
};
