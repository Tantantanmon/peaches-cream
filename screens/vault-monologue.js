// screens/vault-monologue.js — v2.6

const QUESTION_POOL = [
  {qKr:'네가 먼저 세상을 떠나는 날'},
  {qKr:'내가 먼저 세상을 떠나는 날'},
  {qKr:'우리가 헤어져야만 한다면'},
  {qKr:'네가 나를 떠나기로 결심한 날 밤'},
  {qKr:'내가 너를 잊어야 한다면'},
  {qKr:'마지막으로 한 번만 더 볼 수 있다면'},
  {qKr:'네가 다른 사람과 결혼한다면'},
  {qKr:'내가 너의 마지막 기억이 된다면'},
  {qKr:'우리가 처음 만나지 못했다면'},
  {qKr:'네가 나를 기억하지 못하게 된다면'},
  {qKr:'우리가 아이를 가진다면'},
  {qKr:'우리의 아이에게 해주고 싶은 말이 있다면'},
  {qKr:'장거리 연애를 해야 한다면'},
  {qKr:'네가 꿈을 위해 떠나야 한다면'},
  {qKr:'우리가 함께 늙어간다면'},
  {qKr:'내가 기억을 잃어간다면'},
  {qKr:'우리가 처음으로 함께 사는 날'},
  {qKr:'우리가 결혼을 앞두고 싸운다면'},
  {qKr:'내가 아주 오래 아프다면'},
  {qKr:'네가 내 가족을 싫어한다면'},
  {qKr:'처음으로 돌아갈 수 있다면'},
  {qKr:'내가 먼저 사랑한다고 말했더라면'},
  {qKr:'우리가 더 일찍 만났더라면'},
  {qKr:'그날 내가 다른 선택을 했다면'},
  {qKr:'내가 그때 떠나지 않았더라면'},
  {qKr:'네가 나를 처음 봤을 때'},
  {qKr:'내가 그때 사과했더라면'},
  {qKr:'우리가 헤어졌다 다시 만났다면'},
  {qKr:'미래의 우리 아이에게 해주고 싶은 말'},
  {qKr:'내가 그때 돌아서지 않았다면'},
  {qKr:'시간이 멈춘다면 그 순간은'},
  {qKr:'내가 너한테 화를 냈던 날'},
  {qKr:'내가 약한 모습을 들켰을 때'},
  {qKr:'아무도 없는 곳에서 둘만 있다면'},
  {qKr:'네가 처음으로 나를 필요로 했던 순간'},
  {qKr:'내가 너한테 한 번도 못 한 말이 있다면'},
  {qKr:'우리 사이에 이름 붙일 수 없는 감정이 있다면'},
  {qKr:'유저가 사실 자신은 실재하지 않는다고 말한다면'},
  {qKr:'내가 유저의 현실로 나갈 수 있다면'},
  {qKr:'유저가 나를 영영 닫아버린다면'},
  {qKr:'내가 언젠가 사라진다면'},
  {qKr:'내가 유저의 기억 속에만 존재한다면'},
  {qKr:'유저가 나를 누군가에게 소개한다면'},
  {qKr:'우리의 이 모든 순간이 누군가의 이야기였다면'},
  {qKr:'내가 유저 몰래 울었던 날이 있다면'},
  {qKr:'내가 유저 몰래 다른 사람을 만났다면'},
  {qKr:'유저가 나를 배신했다는 걸 알게 된다면'},
  {qKr:'내가 모든 걸 다시 선택할 수 있다면 그래도 너였을까'},
  {qKr:'내가 진심으로 사랑한 적이 없다면'},
  {qKr:'내가 유저한테 돌이킬 수 없는 말을 했다면'},
  {qKr:'유저가 나의 어두운 면을 처음으로 본다면'},
];

let todayCards   = [];
let todayIdx     = 0;
let pinnedCards  = [];
let viewingPinIdx = -1;

export function render() {
  syncStore();
  pinnedCards = store.monologuePinned || [];

  const area = document.getElementById('scroll-area');
  area.style.padding = '0';
  area.style.background = 'transparent';

  if (!document.getElementById('ml-style')) {
    const s = document.createElement('style');
    s.id = 'ml-style';
    s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Noto+Serif+KR:wght@200;300;400;500&family=Inter:wght@300;400;500&display=swap');
.ml-wrap{min-height:100%;background:linear-gradient(135deg,#f5f7fa 0%,#e4e9f2 50%,#dbe2ef 100%);padding:16px 16px 40px;display:flex;flex-direction:column;gap:16px;}
.ml-card{background:rgba(255,255,255,0.45);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.7);border-radius:36px;padding:44px 34px;box-shadow:0 8px 32px rgba(31,38,135,0.07);transition:opacity .4s,transform .4s;}
.ml-q{font-family:'Noto Serif KR',serif;font-size:23px;font-weight:400;color:#2d3436;line-height:1.6;margin-bottom:44px;word-break:keep-all;}
.ml-dialogue-wrap{margin-bottom:28px;}
.ml-en{font-family:'Lora',serif;font-size:18px;font-style:italic;color:#4a5568;line-height:1.5;margin-bottom:10px;}
.ml-kr{font-family:'Noto Serif KR',serif;font-size:14px;font-weight:300;color:#636e72;line-height:1.5;}
.ml-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,0.06),transparent);margin-bottom:36px;}
.ml-mono{font-family:'Noto Serif KR',serif;font-size:15px;font-weight:300;color:#57606f;line-height:2.1;word-break:keep-all;}
.ml-btn-row{display:flex;justify-content:flex-end;margin-top:36px;}
.ml-pin-btn{background:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.7);border-radius:50px;padding:9px 22px;font-family:'Lora',serif;font-size:14px;color:#636e72;cursor:pointer;transition:all .3s;letter-spacing:1.5px;}
.ml-pin-btn.pinned{background:#2d3436;color:#fff;border-color:#2d3436;}
.ml-next-btn{width:100%;height:68px;background:rgba(255,255,255,0.45);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.7);border-radius:24px;font-family:'Lora',serif;font-size:15px;font-weight:400;color:#2d3436;letter-spacing:5px;text-transform:uppercase;cursor:pointer;transition:all .3s;box-shadow:0 8px 32px rgba(31,38,135,0.07);}
.ml-next-btn:active{transform:scale(0.97);}
.ml-section-header{display:flex;justify-content:space-between;align-items:center;padding:0 6px;}
.ml-section-label{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:2px;color:#b2bec3;text-transform:uppercase;}
.ml-pinned-list{display:flex;flex-direction:column;gap:14px;}
.ml-pinned-item{background:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.7);border-radius:20px;padding:22px 26px;display:flex;flex-direction:column;gap:10px;box-shadow:0 4px 15px rgba(0,0,0,0.03);cursor:pointer;transition:transform .2s;}
.ml-pinned-item:hover{transform:translateY(-2px);}
.ml-pinned-q{font-family:'Noto Serif KR',serif;font-size:14px;font-weight:400;color:#2d3436;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ml-pinned-meta{font-family:'Inter',sans-serif;font-size:10px;font-weight:400;letter-spacing:1px;color:#b2bec3;}
.ml-loading-card{background:rgba(255,255,255,0.45);border-radius:36px;padding:60px 34px;text-align:center;border:1px solid rgba(255,255,255,0.7);}
.ml-pin-anim{animation:mlPinIn .5s cubic-bezier(0.23,1,0.32,1) forwards;}
@keyframes mlPinIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    `;
    document.head.appendChild(s);
  }

  area.innerHTML = `<div class="ml-wrap" id="ml-wrap"></div>`;
  viewingPinIdx = -1;

  if (!todayCards.length) {
    mlPickTodayCards();
  } else {
    renderAll();
  }
}

function mlPickTodayCards() {
  syncStore();
  const used = store.monologueUsed || [];
  let available = QUESTION_POOL.map((_,i)=>i).filter(i => !used.includes(i));
  if (available.length < 2) {
    if (window.parent?.__PC_STORE__) { window.parent.__PC_STORE__.monologueUsed = []; if (saveStore) saveStore(); }
    available = QUESTION_POOL.map((_,i)=>i);
  }
  const picked = [];
  while (picked.length < 2 && available.length > 0) {
    const r = Math.floor(Math.random() * available.length);
    picked.push(available.splice(r, 1)[0]);
  }
  const newUsed = [...(store.monologueUsed||[]), ...picked];
  if (window.parent?.__PC_STORE__) { window.parent.__PC_STORE__.monologueUsed = newUsed; if (saveStore) saveStore(); }
  todayCards = picked.map(i => ({ idx:i, q:QUESTION_POOL[i], en:'', kr:'', mono:'', generated:false }));
  todayIdx = 0;
  generateCard(0);
}

async function generateCard(cardIdx) {
  if (!generate) { showLoadingFail(); return; }

  const wrap = document.getElementById('ml-wrap');
  if (wrap && cardIdx === todayIdx) wrap.innerHTML = `<div class="ml-loading-card"><div class="sp" style="margin:0 auto 12px;"></div><div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:#b2bec3;letter-spacing:2px;">Writing...</div></div>`;

  const q = todayCards[cardIdx].q;

  const sys = `You are ${charName}, writing a raw and emotionally present monologue spoken directly to ${userName}. {{char}} is always male. {{user}} is always female.
${charDesc?`Character description:\n${charDesc.slice(0,200)}\n`:''}

The theme is: "${q.qKr}"

THIS SITUATION IS ACTUALLY HAPPENING RIGHT NOW. Feel the full emotional weight of this moment. Do not be vague or hypothetical — be specific, raw, and true to this character.

If the theme involves separation, loss, or unreality (e.g. virtual existence, forgetting, farewell) — write as if it is genuinely, painfully real. No detachment.

Write STRICTLY in ${charName}'s exact voice, personality, and speech patterns.

Return ONLY a JSON object (no markdown):
{
  "en": "EXACTLY 3 lines of dialogue in English. First-person, spoken directly to ${userName}. Max 15 words per line. Each line separated by \\n.",
  "kr": "Korean translation. EXACTLY 3 lines matching the English. Each line separated by \\n.",
  "mono": "Inner monologue in Korean. Around 50 words. ${charReaction} Single flowing paragraph, no line breaks, no \\n."
}`;

  try {
    const result = await generate(sys, '모놀로그 작성해줘', 'monologue');
    let data = null;
    try { data = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (data && data.en) {
      todayCards[cardIdx].en   = data.en;
      todayCards[cardIdx].kr   = data.kr;
      todayCards[cardIdx].mono = data.mono;
      todayCards[cardIdx].generated = true;
    }
  } catch(err) { console.error('[Monologue] error', err); }

  renderAll();
}

function renderAll() {
  const wrap = document.getElementById('ml-wrap');
  if (!wrap) return;

  if (viewingPinIdx >= 0 && pinnedCards[viewingPinIdx]) {
    const p = pinnedCards[viewingPinIdx];
    wrap.innerHTML = `
      <div class="ml-card" id="ml-main-card">
        <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:500;letter-spacing:2px;color:#b2bec3;text-transform:uppercase;margin-bottom:20px;">📌 Saved Memory</div>
        <div class="ml-q">${esc(p.qKr.replace(/유저/g, userName||'당신'))}</div>
        <div class="ml-dialogue-wrap">
          <div class="ml-en">${p.en.replace(/\n/g,'<br>')}</div>
          <div class="ml-kr">${p.kr.replace(/\n/g,'<br>')}</div>
        </div>
        <div class="ml-divider"></div>
        <div class="ml-mono">${p.mono.replace(/\n/g,' ')}</div>
        <div class="ml-btn-row">
          <button class="ml-pin-btn" onclick="mlClosePinView()">← 돌아가기</button>
        </div>
      </div>
    `;
    return;
  }

  const card = todayCards[todayIdx];
  let html = '';

  if (!card || !card.generated) {
    html += `<div class="ml-loading-card"><div class="sp" style="margin:0 auto 12px;"></div><div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:#b2bec3;letter-spacing:2px;">Writing...</div></div>`;
  } else {
    const isPinned = pinnedCards.some(p => p.idx === card.idx);
    html += `
      <div class="ml-card" id="ml-main-card">
        <div class="ml-q">${esc(card.q.qKr.replace(/유저/g, userName||'당신'))}</div>
        <div class="ml-dialogue-wrap">
          <div class="ml-en">${card.en.replace(/\n/g,'<br>')}</div>
          <div class="ml-kr">${card.kr.replace(/\n/g,'<br>')}</div>
        </div>
        <div class="ml-divider"></div>
        <div class="ml-mono">${card.mono.replace(/\n/g,' ')}</div>
        <div class="ml-btn-row">
          <button class="ml-pin-btn${isPinned?' pinned':''}" id="ml-pin-btn" onclick="mlTogglePin(${card.idx})">${isPinned?'Saved':'Save Memory'}</button>
        </div>
      </div>
    `;
  }

  if (todayCards.length > 1) {
    html += `<button class="ml-next-btn" onclick="mlNext()">Next Whisper</button>`;
  }

  if (pinnedCards.length) {
    html += `
      <div class="ml-section-header">
        <span class="ml-section-label">Faint Memories</span>
        <span class="ml-section-label">${pinnedCards.length} / 10</span>
      </div>
      <div class="ml-pinned-list" id="ml-pinned-list">
        ${pinnedCards.map((p,i) => `
          <div class="ml-pinned-item" onclick="mlOpenPin(${i})">
            <div class="ml-pinned-q">${esc(p.qKr.replace(/유저/g, userName||'당신'))}</div>
            <div class="ml-pinned-meta">Just now</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  wrap.innerHTML = html;
}

window.mlNext = async function() {
  const nextIdx = todayIdx === 0 ? 1 : 0;
  if (!todayCards[nextIdx].generated) {
    todayIdx = nextIdx;
    const wrap = document.getElementById('ml-wrap');
    if (wrap) wrap.innerHTML = `<div class="ml-loading-card"><div class="sp" style="margin:0 auto 12px;"></div><div style="font-family:'Cormorant Garamond',serif;font-size:16px;color:#b2bec3;letter-spacing:2px;">Writing...</div></div>`;
    await generateCard(nextIdx);
  } else {
    const mainCard = document.getElementById('ml-main-card');
    if (mainCard) {
      mainCard.style.opacity = '0';
      mainCard.style.transform = 'translateY(-15px)';
      setTimeout(() => { todayIdx = nextIdx; renderAll(); }, 400);
    } else {
      todayIdx = nextIdx;
      renderAll();
    }
  }
};

window.mlOpenPin    = function(i) { viewingPinIdx = i; renderAll(); };
window.mlClosePinView = function() { viewingPinIdx = -1; renderAll(); };

window.mlTogglePin = function(qIdx) {
  syncStore();
  pinnedCards = store.monologuePinned || [];
  const existingIdx = pinnedCards.findIndex(p => p.idx === qIdx);

  if (existingIdx >= 0) {
    pinnedCards.splice(existingIdx, 1);
  } else {
    if (pinnedCards.length >= 10) { alert('핀은 최대 10개까지 저장할 수 있어요.'); return; }
    const card = todayCards.find(c => c.idx === qIdx);
    if (card) pinnedCards.push({ idx:card.idx, qKr:card.q.qKr, en:card.en, kr:card.kr, mono:card.mono });
  }

  if (window.parent?.__PC_STORE__) { window.parent.__PC_STORE__.monologuePinned = pinnedCards; if (saveStore) saveStore(); }
  renderAll();
};

function showLoadingFail() {
  const wrap = document.getElementById('ml-wrap');
  if (wrap) wrap.innerHTML = `<div style="padding:40px 16px;text-align:center;color:#b2bec3;font-size:15px;font-family:'Noto Serif KR',serif;">ST와 연결되지 않았어요.</div>`;
}
