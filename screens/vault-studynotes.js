// screens/vault-studynotes.js — Study Notes v1.0

let bodyCards    = [];
let trainingCards= [];
let activeTab    = 'bodymap';

export function render() {
  syncStore();
  const area = document.getElementById('scroll-area');

  if (!document.getElementById('study-style')) {
    const s = document.createElement('style');
    s.id = 'study-style';
    s.textContent = `
.study-card{background:var(--surface);border-radius:16px;border:0.5px solid var(--divider);overflow:hidden;box-shadow:var(--shadow);margin-bottom:12px;}
.study-header{padding:13px 16px;border-bottom:0.5px solid var(--divider-light);display:flex;align-items:center;justify-content:space-between;}
.study-part{font-size:15px;font-weight:600;color:var(--text-primary);}
.danger-badge{font-size:11px;font-weight:700;border-radius:99px;padding:3px 10px;}
.danger-high{background:#fff0f3;color:#c03060;}
.danger-mid{background:#fff8e0;color:#c07000;}
.danger-low{background:#f0fff4;color:#2a7a40;}
.study-body{padding:12px 16px;display:flex;flex-direction:column;gap:8px;}
.study-label{font-size:11px;font-weight:600;letter-spacing:0.5px;color:var(--text-muted);text-transform:uppercase;margin-bottom:2px;}
.study-text{font-size:13px;color:var(--text-secondary);line-height:1.65;}
.study-text.praise{color:#c03060;font-style:italic;}
.study-text.method{background:#f2f2f7;border-radius:8px;padding:8px 10px;font-size:12px;}
.study-divider{height:0.5px;background:var(--divider-light);}
.train-card{background:var(--surface);border-radius:16px;border:0.5px solid var(--divider);overflow:hidden;box-shadow:var(--shadow);margin-bottom:12px;}
.train-header{padding:13px 16px;border-bottom:0.5px solid var(--divider-light);display:flex;align-items:center;justify-content:space-between;}
.train-title{font-size:15px;font-weight:600;color:var(--text-primary);}
.train-day{font-size:11px;font-weight:600;color:var(--text-muted);}
.train-body{padding:12px 16px;display:flex;flex-direction:column;gap:8px;}
.status-badge{font-size:11px;font-weight:700;border-radius:99px;padding:3px 10px;display:inline-block;}
.status-done{background:#f0fff4;color:#2a7a40;}
.status-progress{background:#fff8e0;color:#c07000;}
.status-fail{background:#fff0f3;color:#c03060;}
.train-next{font-size:12px;color:var(--text-muted);border-left:2px solid var(--divider);padding-left:10px;font-style:italic;line-height:1.6;}
.gen-btn{width:100%;background:var(--surface);border:0.5px solid var(--divider);border-radius:var(--radius-sm);padding:14px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--shadow);}
.gen-btn.loading{opacity:.5;pointer-events:none;}
    `;
    document.head.appendChild(s);
  }

  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="study-tab-bodymap"  onclick="studySwitchTab('bodymap')">Body Map</button>
      <button class="tab-item"        id="study-tab-training" onclick="studySwitchTab('training')">Training Log</button>
    </div>
    <div id="study-pane-bodymap"  style="display:flex;flex-direction:column;gap:0;"></div>
    <div id="study-pane-training" style="display:none;flex-direction:column;gap:0;"></div>
  `;

  studyRenderBodyMap();
  studyRenderTraining();
}

window.studySwitchTab = function(tab) {
  activeTab = tab;
  document.getElementById('study-tab-bodymap').className  = 'tab-item' + (tab==='bodymap' ?' active':'');
  document.getElementById('study-tab-training').className = 'tab-item' + (tab==='training'?' active':'');
  document.getElementById('study-pane-bodymap').style.display  = tab==='bodymap'  ? 'flex' : 'none';
  document.getElementById('study-pane-training').style.display = tab==='training' ? 'flex' : 'none';
};

function studyRenderBodyMap() {
  const pane = document.getElementById('study-pane-bodymap');
  if (!pane) return;
  if (bodyCards.length) {
    pane.innerHTML = bodyCards.map((c,i) => bodyCardHTML(c,i)).join('');
  }
  const btn = document.createElement('button');
  btn.className = 'gen-btn';
  btn.id = 'bodymap-gen-btn';
  btn.innerHTML = '✦ 새로 생성';
  btn.onclick = () => studyGenerate('bodymap');
  pane.appendChild(btn);
}

function studyRenderTraining() {
  const pane = document.getElementById('study-pane-training');
  if (!pane) return;
  if (trainingCards.length) {
    pane.innerHTML = trainingCards.map((c,i) => trainingCardHTML(c,i)).join('');
  }
  const btn = document.createElement('button');
  btn.className = 'gen-btn';
  btn.id = 'training-gen-btn';
  btn.innerHTML = '✦ 새로 생성';
  btn.onclick = () => studyGenerate('training');
  pane.appendChild(btn);
}

function dangerClass(danger) {
  if (danger === '위험도 최상') return 'danger-high';
  if (danger === '위험도 높음') return 'danger-mid';
  return 'danger-low';
}

function statusClass(status) {
  if (status === '완료') return 'status-done';
  if (status === '실패') return 'status-fail';
  return 'status-progress';
}

function bodyCardHTML(c, i) {
  return `
    <div class="study-card">
      <div class="study-header">
        <span class="study-part">${esc(c.part)}</span>
        <span class="danger-badge ${dangerClass(c.danger)}">${esc(c.danger)}</span>
      </div>
      <div class="study-body">
        <div>
          <div class="study-label">관찰</div>
          <div class="study-text">${esc(c.observation)}</div>
        </div>
        <div class="study-divider"></div>
        <div>
          <div class="study-label">찬양</div>
          <div class="study-text praise">${esc(c.praise)}</div>
        </div>
        <div class="study-divider"></div>
        <div>
          <div class="study-label">공략법</div>
          <div class="study-text method">${esc(c.method)}</div>
        </div>
      </div>
    </div>
  `;
}

function trainingCardHTML(c, i) {
  return `
    <div class="train-card">
      <div class="train-header">
        <span class="train-title">${esc(c.title)}</span>
        <span class="train-day">Day ${c.day}</span>
      </div>
      <div class="train-body">
        <div>
          <div class="study-label">오늘의 목표</div>
          <div class="study-text">${esc(c.goal)}</div>
        </div>
        <div>
          <div class="study-label">결과</div>
          <span class="status-badge ${statusClass(c.status)}">${esc(c.status)}</span>
          <div class="study-text" style="margin-top:6px;">${esc(c.result)}</div>
        </div>
        <div class="train-next">${esc(c.next)}</div>
      </div>
    </div>
  `;
}

window.studyGenerate = async function(type) {
  if (!generateWithRole) { showToast('ST와 연결되지 않았어요'); return; }
  const btnId = type === 'bodymap' ? 'bodymap-gen-btn' : 'training-gen-btn';
  const btn = document.getElementById(btnId);
  if (btn) { btn.classList.add('loading'); btn.textContent = '생성 중...'; }

  syncStore();
  const cd = window.parent?.__PC_STORE__ || store;

  try {
    let sys, userMsg, result;

    if (type === 'bodymap') {
      const history = cd.studyBodyHistory || [];
      const excluded = history.length ? `Do NOT repeat these body parts: ${history.slice(-20).join(', ')}` : '';
      const userBodyData = [
        store.userBody      ? `User body: ${store.userBody}`           : '',
        store.userMarks     ? `User marks: ${store.userMarks}`         : '',
        store.userErogenous ? `User erogenous: ${store.userErogenous}` : '',
      ].filter(Boolean).join('\n');

      sys = `You are ${charName}. You have been obsessively studying ${userName}'s body.
${charDesc ? `Character:\n${charDesc.slice(0,300)}\n` : ''}
Speak strictly in ${charName}'s tone and personality.
Be extremely explicit, worshipping, and sexually detailed. No female-degrading slurs.
${userBodyData ? `\nUser body data to reference:\n${userBodyData}\n` : ''}
${excluded}

Generate exactly 2 body part analysis objects based on the user's actual body data if available.
Return ONLY a JSON array, no markdown.
Each object:
{
  "part": "부위명 (Korean, very specific — e.g. 함몰유두, 비너스 딤플, 쇄골 하트 모반)",
  "observation": "관찰 내용 (Korean, 1 sentence, explicit and detailed sexual observation)",
  "praise": "찬양 (Korean, 1 sentence, worshipping and sexually explicit, obsessive tone)",
  "method": "공략법 (Korean, 2 sentences, specific sexual technique)",
  "danger": "위험도 최상 or 위험도 높음 or 위험도 중간"
}`;
      userMsg = `${userName}의 신체 부위 분석 2개 생성`;
      result = await generateWithRole(sys, userMsg, 'studynotes');
      const cleanBody = result.replace(/```json|```/g,'').trim();
      const matchBody = cleanBody.match(/\[[\s\S]*\]/);
      if (!matchBody) throw new Error('no array found');
      let cards = JSON.parse(matchBody[0]);
      if (!Array.isArray(cards)) throw new Error('not array');
      bodyCards = cards.slice(0,2);
      const newHistory = [...history, ...bodyCards.map(c=>c.part)].slice(-30);
      if (window.parent?.__PC_STORE__) window.parent.__PC_STORE__.studyBodyHistory = newHistory;
      if (saveStore) saveStore();
      const pane = document.getElementById('study-pane-bodymap');
      if (pane) {
        pane.innerHTML = bodyCards.map((c,i) => bodyCardHTML(c,i)).join('');
        const newBtn = document.createElement('button');
        newBtn.className = 'gen-btn'; newBtn.id = 'bodymap-gen-btn';
        newBtn.innerHTML = '✦ 새로 생성';
        newBtn.onclick = () => studyGenerate('bodymap');
        pane.appendChild(newBtn);
      }

    } else {
      const history = cd.studyTrainingHistory || [];
      const excluded = history.length ? `Do NOT repeat these training items: ${history.slice(-20).join(', ')}` : '';

      sys = `You are ${charName}. This is your private SEXUAL training diary. You are training yourself to become better at sex to satisfy ${userName}.
${charDesc ? `Character:\n${charDesc.slice(0,300)}\n` : ''}
Speak strictly in ${charName}'s tone and personality.
This is NSFW sexual training only — NOT physical exercise or workout.
Be explicit, honest, and dirty. No female-degrading slurs.
${store.userErogenous ? `User erogenous data: ${store.userErogenous}` : ''}
${excluded}

CRITICAL: Training items must ONLY be sexual training — examples:
- 금딸 (masturbation abstinence to save up for ${userName}) — failures must describe explicitly what they were thinking about
- 허리 지구력 (hip thrust endurance for sex)
- 혀놀림 연습 (cunnilingus tongue technique practice)
- G스팟 연구 (studying G-spot stimulation technique)
- 사정 참기 (edging practice)
- 야동 감상 연구 (studying porn for technique)
- 정액량 증가 (increasing cum volume)
DO NOT generate regular exercise or workout training.

Generate exactly 2 training log objects. Return ONLY a JSON array, no markdown.
Each object:
{
  "title": "훈련 항목 (Korean, specific)",
  "day": <integer 1-30>,
  "goal": "오늘의 목표 (Korean, 1 sentence, explicit)",
  "result": "결과 (Korean, 1 sentence, honest and explicit, in character's exact tone)",
  "status": "완료 or 진행중 or 실패",
  "next": "다음 계획 (Korean, 1 sentence)"
}`;
      userMsg = `${charName}의 훈련 일지 2개 생성`;
      result = await generateWithRole(sys, userMsg, 'studynotes');
      let cards = JSON.parse(result.replace(/```json|```/g,'').trim());
      if (!Array.isArray(cards)) throw new Error('not array');
      trainingCards = cards.slice(0,2);
      const newHistory = [...history, ...trainingCards.map(c=>c.title)].slice(-30);
      if (window.parent?.__PC_STORE__) window.parent.__PC_STORE__.studyTrainingHistory = newHistory;
      if (saveStore) saveStore();
      const pane = document.getElementById('study-pane-training');
      if (pane) {
        pane.innerHTML = trainingCards.map((c,i) => trainingCardHTML(c,i)).join('');
        const newBtn = document.createElement('button');
        newBtn.className = 'gen-btn'; newBtn.id = 'training-gen-btn';
        newBtn.innerHTML = '✦ 새로 생성';
        newBtn.onclick = () => studyGenerate('training');
        pane.appendChild(newBtn);
      }
    }
  } catch(e) {
    console.error('[StudyNotes] error', e);
    showToast('생성에 실패했어요');
    const btn2 = document.getElementById(btnId);
    if (btn2) { btn2.classList.remove('loading'); btn2.textContent = '✦ 새로 생성'; }
  }
};
