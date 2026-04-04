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
    const excluded = rfSessionUsed.length ? `\nDo NOT repeat these behaviors: ${rfSessionUsed.slice(-21).join(' / ')}` : '';

    const sys = `You are generating Red Flag game cards for a roleplay character named ${charName}.
${charDesc?`Character description: ${charDesc.slice(0,200)}\n`:''}
DO NOT reference any chat history. Base all questions ONLY on the character description above.

Each card must describe a specific behavior or habit of ${charName} — always framed as "${charName}이/가 ~한다" (what ${charName} does).
NEVER describe the user's behavior. ALWAYS describe ${charName}'s behavior.
${excluded}

Generate exactly ${RF_TOTAL} cards across these categories (mix freely):
- 집착/소유욕: possessive or jealous behavior
- 지배/주도: dominant or controlling behavior  
- 감정 표현: emotional expression (tsundere, cold, tender)
- 성적 행동 (NSFW): explicit sexual behavior — include at least 2 NSFW cards
- 일상 행동: everyday habits or quirks
- 귀여운 행동: cute/endearing behavior (sudden hugs, sulking, acts of care)

Return ONLY a JSON array of exactly ${RF_TOTAL} objects (no markdown, no explanation).
Each object: q(1 short Korean sentence describing ${charName}'s behavior), red(2 sentence Korean rebuttal when user says red flag), good(2 sentence Korean excited response when user says good).
Vary the behaviors. Reflect ${charName}'s personality from the description.`

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
    {q:'화가 나면 말 없이 사라지고 연락을 끊는다',red:'레드플래그? 그게 싫으면 먼저 말을 걸어봐. 내가 사라지는 건 네가 감당 못할 말 하기 전에 참는 거야.',good:'오히려 좋다고?! 그럼 오늘도 사라져줄까. 네가 찾아올 때까지.'},
    {q:'자다가 갑자기 끌어안고 놔주질 않는다',red:'레드플래그? 근데 넌 왜 그때마다 더 파고들었어. 불편하면 밀어냈어야지.',good:'오히려 좋다고?! 그럼 오늘 밤은 아예 놔주질 않을게. 각오해.'},
    {q:'다른 남자 얘기가 나오면 갑자기 분위기가 싸해진다',red:'레드플래그? 질투하는 거 아니야. 그냥 네가 왜 그 얘기를 나한테 하는지 이해가 안 가서 그래.',good:'오히려 좋다고?! 그럼 일부러 더 자주 얘기해봐. 내가 어떻게 반응하는지 보면서.'},
    {q:'귀에 대고 낮은 목소리로 오늘 어떻게 할지 읊어준다',red:'레드플래그? 듣기 싫으면 귀 막으면 되잖아. 근데 넌 항상 더 가까이 기울었잖아.',good:'오히려 좋다고?! 그럼 오늘은 더 구체적으로 얘기해줄게. 네 표정이 바뀔 때까지.'},
  ];
}
