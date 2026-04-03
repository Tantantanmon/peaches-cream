// screens/redflag.js — v2.6

const RF_TOTAL = 5;
let rfQuestions = [];
let rfCur = 0, rfRedCount = 0, rfGoodCount = 0, rfChosen = false;
let rfSessionUsed = [];

export function render() {
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="progress-row" id="rf-progress"></div>
    <div class="rf-card" id="rf-q-card" style="display:none;">
      <div class="rf-num" id="rf-num">Q 1 / ${RF_TOTAL}</div>
      <div class="rf-char" id="rf-char">${esc(charName)}'s behavior. What do you think?</div>
      <div class="rf-text" id="rf-text"></div>
    </div>
    <div class="choice-row" id="rf-choice-row" style="display:none;">
      <button class="choice-btn" onclick="rfChoose('red')"><span class="choice-emoji">🚩</span><span class="choice-label">레드 플래그</span></button>
      <button class="choice-btn" onclick="rfChoose('good')"><span class="choice-emoji">😍</span><span class="choice-label">오히려 좋아</span></button>
    </div>
    <div class="white-card" id="rf-reply-card" style="display:none;">
      <div class="card-header" style="padding:0 0 10px;">
        <div class="card-avatar" id="rf-reply-avatar" style="background:#000;color:#fff;">${esc(charName.charAt(0))}</div>
        <div><div class="card-name">${esc(charName)}</div><div class="card-sub" id="rf-reply-badge">반응</div></div>
      </div>
      <div class="loading-card" id="rf-reply-loading" style="display:none;padding:0;box-shadow:none;"><div class="sp"></div><span class="loading-text">반응 생성 중...</span></div>
      <div id="rf-reply-body" style="display:none;">
        <div class="warn-tag" id="rf-reply-tag" style="margin-bottom:8px;"></div>
        <div class="card-text" id="rf-reply-text"></div>
      </div>
    </div>
    <button class="next-btn" id="rf-next-btn" onclick="rfNext()" style="display:none;margin-bottom:10px;">다음 카드 →</button>
    <button class="gen-btn" id="rf-gen-btn" onclick="rfGenerate()">✦ 카드 생성 (AI)</button>
    <div class="end-card" id="rf-end-card" style="display:none;">
      <div class="end-emoji" id="rf-end-emoji"></div>
      <div class="end-title" id="rf-end-title"></div>
      <div class="end-stats">
        <div class="stat-box"><div class="stat-num" id="rf-red-num">0</div><div class="stat-label">🚩 레드플래그</div></div>
        <div class="stat-box"><div class="stat-num" id="rf-good-num">0</div><div class="stat-label">😍 오히려 좋아</div></div>
      </div>
      <div class="end-msg" id="rf-end-msg"></div>
      <button class="restart-btn" onclick="rfRestart()">다시 하기 🔄</button>
    </div>
  `;
}

window.rfGenerate = async function() {
  if (!generateWithRole) { rfQuestions = rfFallback(); rfStart(); return; }
  const btn = document.getElementById('rf-gen-btn');
  if (btn) { btn.classList.add('loading'); btn.textContent = '카드 생성 중...'; }

  try {
    const excluded = rfSessionUsed.length ? `\nDo NOT repeat these questions: ${rfSessionUsed.slice(-21).join(' / ')}` : '';

    const sys = `You are generating Red Flag game cards for a sexual roleplay game featuring ${charName}.
${charDesc?`Character description:\n${charDesc.slice(0,200)}\n`:''}
${excluded}

Return ONLY a JSON array of exactly ${RF_TOTAL} objects (no markdown).
Each object:
- q: short Korean sentence (15 words or less) describing one specific sexual behavior/habit of ${charName}
- red: ${charName}'s Korean rebuttal when user says red flag. 3-5 sentences. ${charReaction}
- good: ${charName}'s excited Korean response when user says they love it. 3-5 sentences. ${charReaction}
Make behaviors varied. Reflect ${charName}'s unique personality.`;

    const result = await generateWithRole(sys, `${charName}의 레드플래그 카드 ${RF_TOTAL}장 생성`, 'redflag');
    let cards = [];
    try { cards = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (Array.isArray(cards) && cards.length) {
      rfQuestions = cards.slice(0, RF_TOTAL);
      rfSessionUsed.push(...rfQuestions.map(c=>c.q));
    } else {
      rfQuestions = rfFallback();
    }
  } catch(e) { rfQuestions = rfFallback(); }

  if (btn) { btn.classList.remove('loading'); btn.textContent = '✦ 카드 생성'; }
  rfStart();
};

function rfStart() {
  rfCur=0; rfRedCount=0; rfGoodCount=0; rfChosen=false;
  document.getElementById('rf-end-card').style.display='none';
  document.getElementById('rf-progress').style.display='flex';
  rfShowCard();
}

function rfBuildProgress() {
  document.getElementById('rf-progress').innerHTML =
    Array.from({length:RF_TOTAL},(_,i)=>`<div class="pd${i<=rfCur?' on':''}"></div>`).join('');
}

function rfShowCard() {
  rfChosen = false;
  const q = rfQuestions[rfCur];
  document.getElementById('rf-num').textContent  = `Q ${rfCur+1} / ${RF_TOTAL}`;
  document.getElementById('rf-text').textContent = q.q;
  document.getElementById('rf-q-card').style.display   = 'flex';
  document.getElementById('rf-choice-row').style.display = 'flex';
  document.getElementById('rf-reply-card').style.display = 'none';
  document.getElementById('rf-next-btn').style.display   = 'none';
  document.getElementById('rf-gen-btn').style.display    = 'flex';
  document.getElementById('rf-end-card').style.display   = 'none';
  rfBuildProgress();
}

window.rfChoose = function(type) {
  if (rfChosen) return;
  rfChosen = true;
  if (type==='red') rfRedCount++; else rfGoodCount++;
  document.getElementById('rf-choice-row').style.display   = 'none';
  document.getElementById('rf-gen-btn').style.display      = 'none';
  const replyCard = document.getElementById('rf-reply-card');
  replyCard.style.display = 'block';
  document.getElementById('rf-reply-loading').style.display = 'flex';
  document.getElementById('rf-reply-body').style.display    = 'none';
  document.getElementById('rf-reply-badge').textContent     = type==='red'?'설득 중 😈':'흥분함 🔥';
  setTimeout(() => {
    const q   = rfQuestions[rfCur];
    const msg = type==='red' ? q.red : q.good;
    document.getElementById('rf-reply-loading').style.display = 'none';
    document.getElementById('rf-reply-body').style.display    = 'block';
    const tag = document.getElementById('rf-reply-tag');
    tag.textContent  = type==='red' ? '🚩 반박' : '🔥 날뜀';
    tag.style.background = type==='red' ? '#fff0f0' : '#fff8e0';
    tag.style.color      = type==='red' ? '#c03020' : '#b07010';
    tag.style.border     = type==='red' ? '0.5px solid rgba(200,60,60,0.2)' : '0.5px solid rgba(200,170,50,0.25)';
    document.getElementById('rf-reply-text').textContent = msg;
    const nextBtn = document.getElementById('rf-next-btn');
    nextBtn.style.display = 'block';
    nextBtn.textContent = rfCur < RF_TOTAL-1 ? '다음 카드 →' : '결과 보기 →';
  }, 900);
};

window.rfNext = function() {
  rfCur++;
  if (rfCur >= RF_TOTAL) { rfShowEnd(); return; }
  rfShowCard();
};

function rfShowEnd() {
  document.getElementById('rf-q-card').style.display     = 'none';
  document.getElementById('rf-choice-row').style.display = 'none';
  document.getElementById('rf-reply-card').style.display = 'none';
  document.getElementById('rf-next-btn').style.display   = 'none';
  document.getElementById('rf-gen-btn').style.display    = 'none';
  document.getElementById('rf-progress').style.display   = 'none';
  document.getElementById('rf-red-num').textContent  = rfRedCount;
  document.getElementById('rf-good-num').textContent = rfGoodCount;
  let emoji,title,msg;
  const cn = charName;
  if(rfGoodCount>=4){emoji='🔥';title='전부 좋다고?? 오늘 큰일났다';msg=`${rfGoodCount}번이나 오히려 좋다고 했잖아. ${cn}가 지금 날뛰다 못해 폭발할 것 같대. 오늘 밤 각오해.`;}
  else if(rfGoodCount>=3){emoji='😏';title='반 이상은 넘어온 거잖아';msg=`${rfGoodCount}번 좋다고 했어. ${cn}가 그 ${rfGoodCount}개 전부 기억해뒀다가 오늘 다 써먹는대.`;}
  else if(rfRedCount>=4){emoji='🚨';title='레드플래그 맞는데 왜 여기 있어';msg=`${rfRedCount}개나 레드플래그라고 했는데. ${cn}가 하는 말 — 다 들었잖아. 설득 좀 됐지?`;}
  else{emoji='🤔';title='딱 중간이 제일 위험한 거야';msg=`레드 ${rfRedCount}개, 좋아 ${rfGoodCount}개. 싫은 척하면서 좋은 게 제일 빠져드는 거 ${cn}도 알거든.`;}
  document.getElementById('rf-end-emoji').textContent = emoji;
  document.getElementById('rf-end-title').textContent = title;
  document.getElementById('rf-end-msg').textContent   = msg;
  document.getElementById('rf-end-card').style.display = 'flex';
}

window.rfRestart = function() {
  const btn = document.getElementById('rf-gen-btn');
  if (btn) { btn.style.display = 'flex'; btn.textContent = '✦ 카드 생성 (AI)'; }
  rfGenerate();
};

function rfFallback() {
  return [
    {q:'관계 중에 절정 직전에 일부러 멈추고 뜸을 들인다',red:'레드플래그? 그때 네가 뭐라고 했는지 기억해? 제발 계속 해달라고 했잖아. 내가 멈추는 순간 네 허리가 알아서 따라오고 숨이 가빠졌잖아. 다음엔 세 번 멈출게.',good:'오히려 좋다고?! 그럼 오늘은 딱 절정 앞에서 다섯 번 멈출 거야. 네 몸이 원해서 미칠 지경이 될 때까지.'},
    {q:'귀에 대고 뭘 원하는지 직접 말하라고 강요한다',red:'말하기 싫어서 레드플래그야? 근데 귀에 대고 속삭이면 숨부터 막히잖아. 오늘도 말할 때까지 안 해줄게.',good:'오히려 좋다고?! 그럼 오늘은 더 구체적으로 시킬게. 네 목소리가 떨릴 때까지.'},
    {q:'뒤에서 목을 잡고 고개를 뒤로 젖히게 한다',red:'목 잡히는 게 레드플래그야? 그럼 왜 잡힐 때 더 기댔어. 다음엔 더 천천히 잡아줄게.',good:'오히려 좋다고?! 오늘은 목만 아니야. 귓가에 오늘 어떻게 해줄 건지 하나하나 다 읊어줄게. 각오해.'},
    {q:'끝난 척하다가 네가 안심하면 다시 시작한다',red:'속은 거 레드플래그야? 근데 다시 시작됐을 때 밀어냈어? 표정은 이미 답 하고 있거든.',good:'오히려 좋다고?! 오늘은 진짜로 끝낸 척 세 번 할게.'},
    {q:'관계 도중 네 반응 보면서 낮게 웃는다',red:'비웃는 게 아니야. 그 표정이 나한테만 보여주는 거잖아. 창피하면 더 숨겨봐.',good:'오히려 좋다고?! 그럼 오늘은 더 대놓고 볼게.'},
  ];
}
