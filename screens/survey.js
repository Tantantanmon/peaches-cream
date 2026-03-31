// screens/survey.js — Survey

let surveyQuestions = [];
let surveyCur = 0;

export async function render() {
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="progress-row" id="sv-progress"></div>
    <div class="q-card" id="sv-q-card" style="display:none;">
      <div class="q-num" id="sv-num">Q 1 / 5</div>
      <div class="q-text" id="sv-text"></div>
      <div class="opt-list" id="sv-opts"></div>
    </div>
    <div class="white-card" id="sv-reply-card" style="display:none;gap:10px;">
      <div class="card-header" style="padding:0 0 10px;">
        <div class="card-avatar" style="background:#000;color:#fff;">${esc(charName.charAt(0))}</div>
        <div><div class="card-name">${esc(charName)}</div><div class="card-sub">답변</div></div>
      </div>
      <div class="loading-card" id="sv-loading" style="display:none;padding:0;box-shadow:none;"><div class="sp"></div><span class="loading-text">답변 생성 중...</span></div>
      <div id="sv-reply-body" style="display:none;flex-direction:column;gap:10px;">
        <div style="background:var(--bg);border-radius:10px;padding:12px 14px;font-size:15px;color:var(--text-secondary);line-height:1.9;" id="sv-char-answer"></div>
        <div style="height:0.5px;background:var(--divider-light);"></div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text-hint);text-transform:uppercase;">내 답변에 대한 반응</div>
        <div style="font-size:15px;color:var(--text-secondary);line-height:1.9;" id="sv-char-comment"></div>
      </div>
    </div>
    <button class="next-btn" id="sv-next-btn" onclick="svNext()" style="display:none;margin-bottom:10px;">다음 →</button>
    <button class="gen-btn" id="sv-gen-btn" onclick="svGenerate()">✦ 설문 시작</button>
    <div class="end-card" id="sv-end-card" style="display:none;">
      <div class="end-emoji">📋</div>
      <div class="end-title">설문 완료</div>
      <div class="end-msg" id="sv-end-msg"></div>
      <button class="restart-btn" onclick="svRestart()">다시 하기 🔄</button>
    </div>
  `;
}

window.svGenerate = async function() {
  if (!generate) { alert('ST와 연결되지 않았어요.'); return; }
  const btn = document.getElementById('sv-gen-btn');
  btn.classList.add('loading'); btn.textContent = '생성 중...';

  try {
    const chatText = buildChatText(10);
    const wi       = getWorldInfo();
    const sys = `You are creating a NSFW survey for a roleplay game featuring ${charName} and ${userName}.
${charDesc?`Character description:\n${charDesc}\n`:''}
${wi?`World info:\n${wi}\n`:''}
${chatText?`Recent chat:\n${chatText}\n`:''}

Return ONLY a JSON array of exactly 5 objects (no markdown).
Each object:
- q: Korean question about sexual preferences (explicit, direct)
- options: array of 4 answer choices in Korean (last one can be "직접 입력...")
- charAnswer: ${charName}'s own answer in Korean. 3-5 sentences. Explicit. ${charName}'s exact voice and speech style. No female-degrading slurs.
- comments: array of 4 Korean responses (one per option). Each 3-5 sentences. ${charName}'s exact voice reacting to that specific choice. Explicit. No female-degrading slurs.`;

    const result = await generate(sys, '설문조사 5개 생성해줘');
    let qs = [];
    try { qs = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (Array.isArray(qs) && qs.length) { surveyQuestions = qs.slice(0,5); }
    else { surveyQuestions = svFallback(); }
  } catch(e) { surveyQuestions = svFallback(); }

  btn.classList.remove('loading'); btn.textContent = '✦ 설문 시작';
  surveyCur = 0;
  document.getElementById('sv-end-card').style.display = 'none';
  document.getElementById('sv-progress').style.display = 'flex';
  svShowCard();
};

function svShowCard() {
  const q = surveyQuestions[surveyCur];
  document.getElementById('sv-num').textContent  = `Q ${surveyCur+1} / 5`;
  document.getElementById('sv-text').textContent = q.q;
  document.getElementById('sv-opts').innerHTML   = q.options.map((o,i)=>
    `<button class="opt-btn" onclick="svChoose(${i})">${esc(o)}</button>`
  ).join('');
  document.getElementById('sv-q-card').style.display    = 'flex';
  document.getElementById('sv-reply-card').style.display = 'none';
  document.getElementById('sv-next-btn').style.display   = 'none';
  // progress
  document.getElementById('sv-progress').innerHTML =
    Array.from({length:5},(_,i)=>`<div class="pd${i<=surveyCur?' on':''}"></div>`).join('');
  document.getElementById('scroll-area').scrollTop = 0;
}

window.svChoose = function(idx) {
  document.querySelectorAll('.opt-btn').forEach((b,i)=>{ b.classList.toggle('selected',i===idx); b.style.pointerEvents='none'; });
  const replyCard = document.getElementById('sv-reply-card');
  replyCard.style.display = 'flex';
  document.getElementById('sv-loading').style.display    = 'flex';
  document.getElementById('sv-reply-body').style.display = 'none';
  setTimeout(()=>{
    const q = surveyQuestions[surveyCur];
    document.getElementById('sv-loading').style.display    = 'none';
    document.getElementById('sv-reply-body').style.display = 'flex';
    document.getElementById('sv-char-answer').textContent  = q.charAnswer;
    document.getElementById('sv-char-comment').textContent = q.comments[idx] || q.comments[0];
    const nextBtn = document.getElementById('sv-next-btn');
    nextBtn.style.display = 'block';
    nextBtn.textContent = surveyCur < 4 ? '다음 →' : '결과 보기 →';
    setTimeout(()=>{ document.getElementById('scroll-area').scrollTop = 9999; }, 100);
  }, 800);
};

window.svNext = function() {
  surveyCur++;
  if (surveyCur >= 5) { svShowEnd(); return; }
  svShowCard();
};

function svShowEnd() {
  document.getElementById('sv-q-card').style.display    = 'none';
  document.getElementById('sv-reply-card').style.display = 'none';
  document.getElementById('sv-next-btn').style.display   = 'none';
  document.getElementById('sv-progress').style.display   = 'none';
  document.getElementById('sv-end-msg').textContent = `${charName}가 네 답변 전부 읽었어. 다음에 써먹을 것들 메모해뒀대.`;
  document.getElementById('sv-end-card').style.display = 'flex';
}

window.svRestart = function() { window.svGenerate(); };

function svFallback() {
  return [
    { q:'가장 좋아하는 체위는?', options:['Missionary','Doggy Style','Cowgirl','직접 입력...'],
      charAnswer:`Doggy. 뒤에서 네 허리 잡을 수 있잖아. 네가 고개 돌려서 나 보려고 할 때 그냥 눌러버리는 게 좋거든. 그 순간 표정이 — 진짜야. 다른 거 할 생각 없어.`,
      comments:['정상위? 눈 마주치는 거 좋아하는 거잖아. 숨기려고 해도 다 보이거든. 솔직히 나도 싫지 않아 — 네 표정 제대로 볼 수 있으니까. 근데 가끔은 돌려놓을 거야.',
                '오, 나랑 같네. 기대해. 오늘 실망 안 시켜줄게.',
                '카우걸... 주도권 잡고 싶은 거야? 재밌겠다. 어디까지 할 수 있는지 보자.',
                '직접 입력이라고? 말해봐. 지금 당장. 듣고 싶어.'] },
    { q:'관계 중 가장 흥분되는 순간은?', options:['상대가 신음할 때','눈이 마주칠 때','귀에 속삭일 때','멈추고 뜸들일 때'],
      charAnswer:`네가 참으려다 결국 소리 낼 때. 일부러 천천히 하는 이유가 그거야. 오래 참을수록 나중에 무너지는 게 더 크거든. 그 순간을 기다리는 거야. 항상.`,
      comments:['신음 소리... 그거 내가 만들어줄 수 있어. 오늘 확인해봐.','눈 마주치는 거 좋아해? 그럼 오늘은 내내 눈 못 피하게 할게.','귀에 속삭이는 거라면 — 할 말이 많은데. 준비해.','뜸들이는 거 좋아해? 그거 내 특기야. 각오해.'] },
    { q:'끝나고 원하는 건?', options:['그냥 안겨있기','바로 잠들기','한 번 더','대화하기'],
      charAnswer:`솔직히 — 그냥 네 옆에 있고 싶어. 말 안 해도 되니까. 끝나고 네 숨소리 들으면서 있는 게 — 뭔가 이상하게 좋더라. 티 내기 싫은데.`,
      comments:['안겨있고 싶어? ...그래. 그거라면.','바로 잠든다고? 나 옆에 있는데? 섭섭하네.','한 번 더라고. 체력은 있네. 오늘 확인해볼게.','대화하고 싶어? 끝나고도 내 목소리 듣고 싶은 거잖아.'] },
    { q:'가장 약한 부위는?', options:['목','귀','허리','직접 입력...'],
      charAnswer:`목. 거기 건드리면 — 나도 이성 잃어. 알면서 건드리면 어떻게 되는지는 직접 확인해봐.`,
      comments:['목이라고. 기억해뒀어.','귀. 그럼 오늘 귀에 집중할게.','허리. 잡으면 되겠네.','직접 입력이라고? 솔직하게 말해줘서 고마워. 써먹을게.'] },
    { q:'분위기는 어떤 게 더 좋아?', options:['천천히, 감정적으로','빠르고 거칠게','뜸들이면서 길게','그때그때 달라'],
      charAnswer:`빠르고 거칠게. 근데 — 가끔 네가 울 것 같은 표정 지을 때는 천천히 해주고 싶어. 그것도 내 방식이야.`,
      comments:['천천히 감정적으로. 그런 날도 있어. 맞춰줄게.','거칠게라고. 오늘 마음에 드는 답 들었어.','뜸들이는 거 좋아해? 나도 그거 좋아. 잘 됐네.','그때그때 다르다고. 그럼 내가 읽어줄게. 매번.'] },
  ];
}
