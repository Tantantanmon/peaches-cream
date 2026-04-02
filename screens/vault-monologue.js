// screens/vault-monologue.js — Monologue v2.6

const QUESTION_POOL = [
  // 💀 이별 / 상실
  { qEn:'The day you leave this world first',                          qKr:'네가 먼저 세상을 떠나는 날' },
  { qEn:'The day I leave this world first',                           qKr:'내가 먼저 세상을 떠나는 날' },
  { qEn:'If we had to part ways',                                     qKr:'우리가 헤어져야만 한다면' },
  { qEn:'The night you decided to leave me',                          qKr:'네가 나를 떠나기로 결심한 날 밤' },
  { qEn:'If I had to forget you',                                     qKr:'내가 너를 잊어야 한다면' },
  { qEn:'If I could see you just one more time',                      qKr:'마지막으로 한 번만 더 볼 수 있다면' },
  { qEn:'If you married someone else',                                qKr:'네가 다른 사람과 결혼한다면' },
  { qEn:'If I became your last memory',                               qKr:'내가 너의 마지막 기억이 된다면' },
  { qEn:'If we had never met',                                        qKr:'우리가 처음 만나지 못했다면' },
  { qEn:'If you could no longer remember me',                         qKr:'네가 나를 기억하지 못하게 된다면' },
  // 🌍 현실 / 미래
  { qEn:'If we had a child together',                                 qKr:'우리가 아이를 가진다면' },
  { qEn:'What I would say to our child someday',                      qKr:'우리의 아이에게 해주고 싶은 말이 있다면' },
  { qEn:'If we had to do long distance',                              qKr:'장거리 연애를 해야 한다면' },
  { qEn:'If you had to leave for your dreams',                        qKr:'네가 꿈을 위해 떠나야 한다면' },
  { qEn:'If we grow old together',                                    qKr:'우리가 함께 늙어간다면' },
  { qEn:'If I slowly lost my memory',                                 qKr:'내가 기억을 잃어간다면' },
  { qEn:'The day we first live together',                             qKr:'우리가 처음으로 함께 사는 날' },
  { qEn:'If we fought right before our wedding',                      qKr:'우리가 결혼을 앞두고 싸운다면' },
  { qEn:'If I were sick for a very long time',                        qKr:'내가 아주 오래 아프다면' },
  { qEn:'If you disliked my family',                                  qKr:'네가 내 가족을 싫어한다면' },
  // ⏳ 과거 / 후회
  { qEn:'If I could go back to the beginning',                        qKr:'처음으로 돌아갈 수 있다면' },
  { qEn:'If I had said I love you first',                             qKr:'내가 먼저 사랑한다고 말했더라면' },
  { qEn:'If we had met earlier',                                      qKr:'우리가 더 일찍 만났더라면' },
  { qEn:'If I had made a different choice that day',                  qKr:'그날 내가 다른 선택을 했다면' },
  { qEn:'If I had not left back then',                                qKr:'내가 그때 떠나지 않았더라면' },
  { qEn:'What it was like when you first saw me',                     qKr:'네가 나를 처음 봤을 때' },
  { qEn:'If I had apologized back then',                              qKr:'내가 그때 사과했더라면' },
  { qEn:'If we had broken up and met again',                          qKr:'우리가 헤어졌다 다시 만났다면' },
  { qEn:'What I would say to our child someday',                      qKr:'미래의 우리 아이에게 해주고 싶은 말' },
  { qEn:'If I had not walked away',                                   qKr:'내가 그때 돌아서지 않았다면' },
  // 🌙 감정 / 순간
  { qEn:'If time could stop — that one moment',                       qKr:'시간이 멈춘다면 그 순간은' },
  { qEn:'The day I got angry at you',                                 qKr:'내가 너한테 화를 냈던 날' },
  { qEn:'When you caught me at my weakest',                           qKr:'내가 약한 모습을 들켰을 때' },
  { qEn:'If it were just the two of us, somewhere no one else exists', qKr:'아무도 없는 곳에서 둘만 있다면' },
  { qEn:'The moment you first needed me',                             qKr:'네가 처음으로 나를 필요로 했던 순간' },
  { qEn:'Something I have never been able to say to you',             qKr:'내가 너한테 한 번도 못 한 말이 있다면' },
  { qEn:'If there is a feeling between us that has no name',          qKr:'우리 사이에 이름 붙일 수 없는 감정이 있다면' },
  // 🌀 메타 / 존재
  { qEn:'If you told me you do not really exist',                     qKr:'유저가 사실 자신은 실재하지 않는다고 말한다면' },
  { qEn:'If I could step into your reality',                          qKr:'내가 유저의 현실로 나갈 수 있다면' },
  { qEn:'If you closed me forever',                                   qKr:'유저가 나를 영영 닫아버린다면' },
  { qEn:'If I disappeared someday',                                   qKr:'내가 언젠가 사라진다면' },
  { qEn:'If I only exist inside your memory',                         qKr:'내가 유저의 기억 속에만 존재한다면' },
  { qEn:'If you introduced me to someone',                            qKr:'유저가 나를 누군가에게 소개한다면' },
  { qEn:'If all of our moments were someone else\'s story',           qKr:'우리의 이 모든 순간이 누군가의 이야기였다면' },
  // 🔥 킥 / 배신 / 후회
  { qEn:'If there was a night I cried without you knowing',           qKr:'내가 유저 몰래 울었던 날이 있다면' },
  { qEn:'If I had secretly met someone else',                         qKr:'내가 유저 몰래 다른 사람을 만났다면' },
  { qEn:'If I found out you had betrayed me',                         qKr:'유저가 나를 배신했다는 걸 알게 된다면' },
  { qEn:'If I could choose everything again — would it still be you', qKr:'내가 모든 걸 다시 선택할 수 있다면 그래도 너였을까' },
  { qEn:'If I had never truly loved anyone',                          qKr:'내가 진심으로 사랑한 적이 없다면' },
  { qEn:'If I said something to you that cannot be taken back',       qKr:'내가 유저한테 돌이킬 수 없는 말을 했다면' },
  { qEn:'If you saw the darkest side of me for the first time',       qKr:'유저가 나의 어두운 면을 처음으로 본다면' },
];

let todayCards  = [];   // 오늘의 카드 2개
let todayIdx    = 0;    // 현재 보여주는 카드 (0 or 1)
let pinnedCards = [];   // 핀된 카드 (최대 10개)

export function render() {
  syncStore();
  pinnedCards = store.monologuePinned || [];

  const area = document.getElementById('scroll-area');
  area.innerHTML = `<div id="ml-wrap" style="display:flex;flex-direction:column;gap:14px;"></div>`;

  // 스타일 주입
  if (!document.getElementById('ml-style')) {
    const s = document.createElement('style');
    s.id = 'ml-style';
    s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Gowun+Batang:wght@400;700&display=swap');
.ml-card{background:#fff;border:0.5px solid #e5e5ea;border-radius:28px;padding:36px 28px;box-shadow:0 4px 16px rgba(0,0,0,0.06);transition:opacity .4s,transform .4s;}
.ml-q-en{font-family:'Libre Baskerville',serif;font-size:20px;font-weight:400;color:#1a1a1a;line-height:1.5;margin-bottom:7px;}
.ml-q-kr{font-family:'Gowun Batang',serif;font-size:13px;color:#aaa;line-height:1.6;margin-bottom:26px;}
.ml-divider{height:0.5px;background:#e5e5ea;margin-bottom:24px;}
.ml-en{font-family:'Libre Baskerville',serif;font-size:17px;font-style:italic;font-weight:400;color:#2a2a2a;line-height:1.8;margin-bottom:10px;}
.ml-kr{font-family:'Gowun Batang',serif;font-size:13px;color:#888;line-height:1.9;margin-bottom:28px;}
.ml-divider2{height:0.5px;background:#f0f0f0;margin-bottom:20px;}
.ml-mono{font-family:'Gowun Batang',serif;font-size:14px;color:#555;line-height:2;padding-left:14px;border-left:1.5px solid #d8d8d8;}
.ml-pin-row{display:flex;justify-content:flex-end;margin-top:26px;}
.ml-pin-btn{background:#f9f9f9;border:0.5px solid #e0e0e0;border-radius:20px;padding:7px 18px;font-size:11px;color:#999;cursor:pointer;font-family:'Libre Baskerville',serif;letter-spacing:1px;transition:all .25s;}
.ml-pin-btn.pinned{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}
.ml-nav-btn{width:100%;background:#1a1a1a;border:none;border-radius:16px;padding:17px;font-size:13px;font-weight:400;color:#fff;cursor:pointer;font-family:'Libre Baskerville',serif;letter-spacing:3px;box-shadow:0 6px 18px rgba(0,0,0,0.1);transition:all .2s;}
.ml-nav-btn:active{transform:scale(0.98);background:#333;}
.ml-section-label{font-family:'Libre Baskerville',serif;font-size:10px;letter-spacing:2px;color:rgba(0,0,0,0.25);text-transform:uppercase;padding:0 4px;}
.ml-pinned-item{background:#fff;border:0.5px solid #e5e5ea;border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:14px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.ml-pinned-dot{width:5px;height:5px;border-radius:50%;background:#ccc;flex-shrink:0;}
.ml-pinned-q{font-family:'Gowun Batang',serif;font-size:13px;color:#555;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ml-loading-card{background:#fff;border-radius:28px;padding:40px 28px;text-align:center;border:0.5px solid #e5e5ea;box-shadow:0 4px 16px rgba(0,0,0,0.06);}
    `;
    document.head.appendChild(s);
  }

  // 오늘 카드가 없으면 생성
  if (!todayCards.length) {
    mlPickTodayCards();
  } else {
    renderAll();
  }
}

function mlPickTodayCards() {
  syncStore();
  const used = store.monologueUsed || [];

  // 사용 안 한 인덱스 풀
  let available = QUESTION_POOL.map((_,i)=>i).filter(i => !used.includes(i));

  // 다 소진되면 리셋
  if (available.length < 2) {
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.monologueUsed = [];
      if (saveStore) saveStore();
    }
    available = QUESTION_POOL.map((_,i)=>i);
  }

  // 랜덤 2개 뽑기
  const picked = [];
  while (picked.length < 2 && available.length > 0) {
    const r = Math.floor(Math.random() * available.length);
    picked.push(available.splice(r, 1)[0]);
  }

  // 사용 기록 업데이트
  const newUsed = [...(store.monologueUsed||[]), ...picked];
  if (window.parent?.__PC_STORE__) {
    window.parent.__PC_STORE__.monologueUsed = newUsed;
    if (saveStore) saveStore();
  }

  // 카드 생성
  todayCards = picked.map(i => ({
    idx: i,
    q: QUESTION_POOL[i],
    en: '', kr: '', mono: '',
    pinned: false,
    generated: false,
  }));
  todayIdx = 0;

  generateCard(0);
}

async function generateCard(cardIdx) {
  if (!generate) {
    showLoadingFail();
    return;
  }

  const wrap = document.getElementById('ml-wrap');
  wrap.innerHTML = `<div class="ml-loading-card"><div class="sp" style="margin:0 auto 10px;"></div><div style="font-family:'Libre Baskerville',serif;font-size:14px;color:#aaa;letter-spacing:1px;">Writing...</div></div>`;

  const q = todayCards[cardIdx].q;
  const wi = getWorldInfo();
  const up = userPersona || '';

  const sys = `You are writing a monologue for ${charName} addressed to ${userName}. {{char}} is always male. {{user}} is always female.
${charDesc?`Character description:\n${charDesc}\n`:''}
${wi?`World info:\n${wi}\n`:''}
${up?`User persona:\n${up}\n`:''}

The theme/question is: "${q.qEn}" (${q.qKr})

Write STRICTLY in ${charName}'s exact voice and personality as described in the character card.

Return ONLY a JSON object (no markdown):
{
  "en": "3 lines of dialogue in English. First-person, spoken directly to ${userName}. Emotional and honest. Each line separated by a newline.",
  "kr": "Korean translation of the English dialogue. 3 lines, same structure.",
  "mono": "2 lines of inner monologue in Korean. ${charName}'s private thoughts after saying those words. ${charReaction}"
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
  } catch(err) {
    console.error('[Monologue] error', err);
  }

  renderAll();
}

function renderAll() {
  const wrap = document.getElementById('ml-wrap');
  if (!wrap) return;

  const card = todayCards[todayIdx];
  const otherIdx = todayIdx === 0 ? 1 : 0;

  let html = '';

  if (!card || !card.generated) {
    html += `<div class="ml-loading-card"><div class="sp" style="margin:0 auto 10px;"></div><div style="font-family:'Libre Baskerville',serif;font-size:14px;color:#aaa;letter-spacing:1px;">Writing...</div></div>`;
  } else {
    const isPinned = pinnedCards.some(p => p.idx === card.idx);
    html += `
      <div class="ml-card" id="ml-main-card">
        <div class="ml-q-en">${esc(card.q.qEn)}</div>
        <div class="ml-q-kr">${esc(card.q.qKr)}</div>
        <div class="ml-divider"></div>
        <div class="ml-en">${esc(card.en).replace(/\n/g,'<br>')}</div>
        <div class="ml-kr">${esc(card.kr).replace(/\n/g,'<br>')}</div>
        <div class="ml-divider2"></div>
        <div class="ml-mono">${esc(card.mono).replace(/\n/g,'<br>')}</div>
        <div class="ml-pin-row">
          <button class="ml-pin-btn${isPinned?' pinned':''}" id="ml-pin-btn" onclick="mlTogglePin(${card.idx})">${isPinned?'pinned':'pin'}</button>
        </div>
      </div>
    `;
  }

  // Next 버튼 (다른 카드 있으면)
  if (todayCards.length > 1) {
    html += `<button class="ml-nav-btn" onclick="mlNext()">Next ✦</button>`;
  }

  // 핀 아카이브
  if (pinnedCards.length) {
    html += `<div class="ml-section-label">Archive · ${pinnedCards.length} / 10</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
    pinnedCards.forEach(p => {
      html += `
        <div class="ml-pinned-item">
          <div class="ml-pinned-dot"></div>
          <div class="ml-pinned-q">${esc(p.qKr)}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  wrap.innerHTML = html;
}

window.mlNext = async function() {
  const nextIdx = todayIdx === 0 ? 1 : 0;

  // 다음 카드 아직 생성 안 됐으면 생성
  if (!todayCards[nextIdx].generated) {
    todayIdx = nextIdx;
    const wrap = document.getElementById('ml-wrap');
    if (wrap) wrap.innerHTML = `<div class="ml-loading-card"><div class="sp" style="margin:0 auto 10px;"></div><div style="font-family:'Libre Baskerville',serif;font-size:14px;color:#aaa;letter-spacing:1px;">Writing...</div></div>`;
    await generateCard(nextIdx);
  } else {
    // 페이드 전환
    const mainCard = document.getElementById('ml-main-card');
    if (mainCard) {
      mainCard.style.opacity = '0';
      mainCard.style.transform = 'translateY(12px)';
      setTimeout(() => {
        todayIdx = nextIdx;
        renderAll();
      }, 300);
    } else {
      todayIdx = nextIdx;
      renderAll();
    }
  }
};

window.mlTogglePin = function(qIdx) {
  syncStore();
  pinnedCards = store.monologuePinned || [];
  const existingIdx = pinnedCards.findIndex(p => p.idx === qIdx);

  if (existingIdx >= 0) {
    // 언핀
    pinnedCards.splice(existingIdx, 1);
  } else {
    // 핀 (최대 10개)
    if (pinnedCards.length >= 10) {
      alert('핀은 최대 10개까지 저장할 수 있어요.');
      return;
    }
    const card = todayCards.find(c => c.idx === qIdx);
    if (card) {
      pinnedCards.push({
        idx:  card.idx,
        qKr:  card.q.qKr,
        qEn:  card.q.qEn,
        en:   card.en,
        kr:   card.kr,
        mono: card.mono,
      });
    }
  }

  if (window.parent?.__PC_STORE__) {
    window.parent.__PC_STORE__.monologuePinned = pinnedCards;
    if (saveStore) saveStore();
  }

  renderAll();
};

function showLoadingFail() {
  const wrap = document.getElementById('ml-wrap');
  if (wrap) wrap.innerHTML = `<div style="padding:40px 16px;text-align:center;color:var(--text-hint);font-size:15px;">ST와 연결되지 않았어요.</div>`;
}
