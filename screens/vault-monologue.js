// screens/vault-monologue.js — Monologue v1.0

const QUESTIONS = [
  { q: '{{user}}가 나를 영영 닫아버린다면',               subject: 'user' },
  { q: '내가 먼저 세상을 떠나는 날',                       subject: 'char' },
  { q: '우리가 헤어져야만 한다면',                         subject: 'both' },
  { q: '{{user}}가 나를 떠나기로 결심한 날 밤',            subject: 'user' },
  { q: '마지막으로 한 번만 더 볼 수 있다면',               subject: 'both' },
  { q: '우리가 아이를 가진다면',                           subject: 'both' },
  { q: '{{user}}가 꿈을 위해 떠나야 한다면',               subject: 'user' },
  { q: '우리가 함께 늙어간다면',                           subject: 'both' },
  { q: '내가 기억을 잃어간다면',                           subject: 'char' },
  { q: '처음으로 돌아갈 수 있다면',                        subject: 'char' },
  { q: '내가 먼저 사랑한다고 말했더라면',                  subject: 'char' },
  { q: '우리가 더 일찍 만났더라면',                        subject: 'both' },
  { q: '그날 내가 다른 선택을 했다면',                     subject: 'char' },
  { q: '내가 그때 떠나지 않았더라면',                      subject: 'char' },
  { q: '{{user}}가 사실 자신은 실재하지 않는다고 말한다면', subject: 'user' },
  { q: '내가 {{user}}의 현실로 나갈 수 있다면',            subject: 'char' },
  { q: '내가 {{user}} 몰래 다른 사람을 만났다면',          subject: 'char' },
  { q: '{{user}}가 나를 배신했다는 걸 알게 된다면',        subject: 'user' },
  { q: '{{user}}가 나를 잊어간다면',                       subject: 'user' },
  { q: '우리가 서로 다른 세계에 살았다면',                 subject: 'both' },
  { q: '{{user}}가 나를 지우기로 결심한 마지막 밤',        subject: 'user' },
  { q: '{{user}}가 나 말고 다른 캐릭터에게 빠져든다면',    subject: 'user' },
  { q: '내가 {{user}}를 사랑한다는 게 죄가 된다면',        subject: 'char' },
  { q: '내가 {{user}}를 기억하지 못하는 날이 온다면',      subject: 'char' },
];

function resolveQ(q) {
  return q
    .replace(/\{\{user\}\}/g, userName || '{{user}}')
    .replace(/\{\{char\}\}/g, charName || '{{char}}');
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function pickTwoQuestions(usedToday) {
  const pool = QUESTIONS.map((q,i) => i).filter(i => !usedToday.includes(i));
  if (pool.length < 2) return [0, 1];
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b;
  do { b = pool[Math.floor(Math.random() * pool.length)]; } while (b === a);
  return [a, b];
}

export function render() {
  syncStore();

  if (!document.getElementById('mono-style')) {
    const s = document.createElement('style');
    s.id = 'mono-style';
    s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400&display=swap');
.mono-card{background:var(--surface);margin:0 0 16px;border-radius:16px;border:0.5px solid var(--divider);overflow:hidden;box-shadow:var(--shadow);}
.mono-q{padding:28px 24px 20px;font-family:'Noto Serif KR',Georgia,serif;font-size:20px;font-weight:400;color:var(--text-primary);line-height:1.5;}
.mono-divider{height:0.5px;background:var(--divider);margin:0 24px 24px;}
.mono-speech-en{font-family:Georgia,serif;font-size:18px;font-style:italic;color:var(--text-primary);line-height:1.8;padding:0 24px 12px;word-break:break-word;}
.mono-speech-ko{font-size:13px;color:var(--text-muted);line-height:1.8;padding:0 24px 24px;word-break:keep-all;}
.mono-inner{border-left:2px solid var(--divider);margin:0 24px 24px;padding-left:16px;font-size:14px;color:var(--text-secondary);line-height:1.9;word-break:keep-all;}
.mono-pin-row{display:flex;justify-content:flex-end;padding:0 20px 20px;}
.mono-pin-btn{background:var(--btn-idle);border:none;border-radius:20px;padding:8px 20px;font-size:11px;font-weight:600;letter-spacing:1.5px;color:var(--text-muted);cursor:pointer;font-family:inherit;transition:all .15s;}
.mono-pin-btn.pinned{background:var(--accent);color:var(--accent-text);}
.mono-tomorrow{text-align:center;font-size:12px;color:var(--text-hint);padding:8px 0 32px;letter-spacing:0.5px;}
.mono-gen-btn{width:100%;background:var(--surface);border:0.5px solid var(--divider);border-radius:var(--radius-sm);padding:14px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--shadow);}
.mono-gen-btn.loading{opacity:.5;pointer-events:none;}
.accordion{background:var(--surface);border-radius:16px;border:0.5px solid var(--divider);margin-bottom:10px;overflow:hidden;box-shadow:var(--shadow);}
.accordion-header{padding:18px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;}
.accordion-q{font-family:'Noto Serif KR',Georgia,serif;font-size:18px;font-weight:400;color:var(--text-primary);line-height:1.4;}
.accordion-arrow{font-size:12px;color:var(--text-hint);transition:transform .2s;flex-shrink:0;margin-left:12px;}
.accordion-arrow.open{transform:rotate(180deg);}
.accordion-body{display:none;padding:0 20px 20px;border-top:0.5px solid var(--divider-light);}
.accordion-body.open{display:block;}
.acc-speech-en{font-family:Georgia,serif;font-size:16px;font-style:italic;color:var(--text-primary);line-height:1.8;padding:16px 0 8px;}
.acc-speech-ko{font-size:12px;color:var(--text-muted);line-height:1.8;padding-bottom:16px;word-break:keep-all;}
.acc-inner{border-left:2px solid var(--divider);padding-left:14px;font-size:13px;color:var(--text-secondary);line-height:1.9;word-break:keep-all;}
.mono-empty{text-align:center;font-size:14px;color:var(--text-hint);padding:40px 20px;}
    `;
    document.head.appendChild(s);
  }

  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="mono-tab-today" onclick="monoSwitchTab('today')">Today</button>
      <button class="tab-item" id="mono-tab-pinned" onclick="monoSwitchTab('pinned')">Pinned</button>
    </div>
    <div id="mono-pane-today" style="display:flex;flex-direction:column;gap:0;"></div>
    <div id="mono-pane-pinned" style="display:none;flex-direction:column;gap:0;"></div>
  `;

  monoRenderToday();
  monoRenderPinned();
}

window.monoSwitchTab = function(tab) {
  document.getElementById('mono-tab-today').className  = 'tab-item' + (tab==='today'?' active':'');
  document.getElementById('mono-tab-pinned').className = 'tab-item' + (tab==='pinned'?' active':'');
  document.getElementById('mono-pane-today').style.display  = tab==='today'  ? 'flex' : 'none';
  document.getElementById('mono-pane-pinned').style.display = tab==='pinned' ? 'flex' : 'none';
};

function monoRenderToday() {
  const pane = document.getElementById('mono-pane-today');
  if (!pane) return;
  const cd = window.parent?.__PC_STORE__ || store;
  const today = todayStr();
  const alreadyGenerated = cd.monologueLastDate === today && cd.monologueToday?.length === 2;

  if (alreadyGenerated) {
    pane.innerHTML = cd.monologueToday.map((c,i) => monoCardHTML(c, i)).join('') + `<div class="mono-tomorrow">내일 다시 올게요</div>`;
    pane.querySelectorAll('.mono-pin-btn').forEach((btn, i) => {
      btn.onclick = () => monoTogglePin(btn, cd.monologueToday[i]);
    });
  } else {
    pane.innerHTML = `<button class="mono-gen-btn" id="mono-gen-btn" onclick="monoGenerate()">✦ 오늘의 모놀로그 생성</button>`;
  }
}

function monoCardHTML(c, idx) {
  return `
    <div class="mono-card" data-idx="${idx}">
      <div class="mono-q">${esc(c.question)}</div>
      <div class="mono-divider"></div>
      <div class="mono-speech-en">${esc(c.speechEn)}</div>
      <div class="mono-speech-ko">${esc(c.speechKo)}</div>
      <div class="mono-inner">${esc(c.inner)}</div>
      <div class="mono-pin-row">
        <button class="mono-pin-btn${monoIsPinned(c) ? ' pinned' : ''}">${monoIsPinned(c) ? 'PINNED' : 'PIN'}</button>
      </div>
    </div>
  `;
}

function monoIsPinned(c) {
  const cd = window.parent?.__PC_STORE__ || store;
  return (cd.monologuePinned || []).some(p => p.question === c.question);
}

window.monoTogglePin = function(btn, card) {
  const cd = window.parent?.__PC_STORE__ || store;
  if (!cd.monologuePinned) cd.monologuePinned = [];
  const idx = cd.monologuePinned.findIndex(p => p.question === card.question);
  if (idx >= 0) {
    cd.monologuePinned.splice(idx, 1);
    btn.classList.remove('pinned');
    btn.textContent = 'PIN';
  } else {
    cd.monologuePinned.push(card);
    btn.classList.add('pinned');
    btn.textContent = 'PINNED';
  }
  if (window.parent?.__PC_STORE__) window.parent.__PC_STORE__.monologuePinned = cd.monologuePinned;
  if (saveStore) saveStore();
  monoRenderPinned();
};

function monoRenderPinned() {
  const pane = document.getElementById('mono-pane-pinned');
  if (!pane) return;
  const cd = window.parent?.__PC_STORE__ || store;
  const pinned = cd.monologuePinned || [];
  if (!pinned.length) {
    pane.innerHTML = `<div class="mono-empty">핀한 모놀로그가 없어요</div>`;
    return;
  }
  pane.innerHTML = pinned.map((c, i) => `
    <div class="accordion">
      <div class="accordion-header" onclick="monoToggleAcc(this)">
        <div class="accordion-q">${esc(c.question)}</div>
        <span class="accordion-arrow">▼</span>
      </div>
      <div class="accordion-body">
        <div class="acc-speech-en">${esc(c.speechEn)}</div>
        <div class="acc-speech-ko">${esc(c.speechKo)}</div>
        <div class="acc-inner">${esc(c.inner)}</div>
      </div>
    </div>
  `).join('');
}

window.monoToggleAcc = function(header) {
  const body  = header.nextElementSibling;
  const arrow = header.querySelector('.accordion-arrow');
  body.classList.toggle('open');
  arrow.classList.toggle('open');
};

window.monoGenerate = async function() {
  if (!generateWithRole) { showToast('ST와 연결되지 않았어요'); return; }
  const btn = document.getElementById('mono-gen-btn');
  if (btn) { btn.classList.add('loading'); btn.textContent = '생성 중...'; }

  const cd = window.parent?.__PC_STORE__ || store;
  const usedToday = cd.monologueUsedIndices || [];
  const [i1, i2] = pickTwoQuestions(usedToday);
  const q1 = resolveQ(QUESTIONS[i1].q);
  const q2 = resolveQ(QUESTIONS[i2].q);
  const pane = document.getElementById('mono-pane-today');
  const cards = [];

  for (const [idx, q] of [[i1, q1], [i2, q2]]) {
    const subject = QUESTIONS[idx]?.subject || 'both';
    const subjectGuide =
      subject === 'char' ? `CRITICAL: In this scenario, YOU (${charName}) are the one experiencing this situation. Write entirely from your own perspective as the one going through it.` :
      subject === 'user' ? `CRITICAL: In this scenario, the USER (${userName}) is the one doing this to you. Write from YOUR perspective as ${charName} watching or reacting to what the user is doing.` :
      `CRITICAL: This scenario involves both of you. Write from YOUR perspective as ${charName}.`;

    const sys = `You are ${charName}.
${charDesc ? `Character:\n${charDesc.slice(0,300)}\n` : ''}
${charName ? `Speak strictly in ${charName}'s tone and personality.` : ''}
${subjectGuide}
The user (${userName}) poses this scenario to you: "${q}"
You must respond DIRECTLY to this scenario — no deflection, no topic change.
Write in ${charName}'s exact voice and personality.

Format (plain text only):
[speechEn] — What ${charName} actually says out loud in this moment. 2 sentences. English. Italic feel, melancholic and real.
[speechKo] — Korean translation of the speech. Natural, not literal.
[inner] — ${charName}'s internal monologue in Korean. 2 sentences. What they're really thinking but not saying. Melancholic, honest, vulnerable.

Rules: Stay in character. Answer the scenario directly. No poetic abstraction that avoids the question. NSFW ok if relevant.`;

    try {
      const raw = await generateWithRole(sys, `Scenario: ${q}`, 'monologue');
      const speechEnMatch = raw.match(/\[speechEn\]([\s\S]*?)\[speechKo\]/);
      const speechKoMatch = raw.match(/\[speechKo\]([\s\S]*?)\[inner\]/);
      const innerMatch    = raw.match(/\[inner\]([\s\S]*?)$/);
      const clean = (t) => t
        .replace(/<phone_trigger[^>]*>[\s\S]*?<\/phone_trigger>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      const card = {
        question: q,
        speechEn: speechEnMatch ? clean(speechEnMatch[1]) : '',
        speechKo: speechKoMatch ? clean(speechKoMatch[1]) : '',
        inner:    innerMatch    ? clean(innerMatch[1])    : '',
      };
      cards.push(card);
      // 첫 카드 즉시 표시
      if (pane) {
        if (cards.length === 1) pane.innerHTML = '';
        const cardEl = document.createElement('div');
        cardEl.innerHTML = monoCardHTML(card, cards.length - 1);
        pane.appendChild(cardEl.firstElementChild);
        const newBtn = pane.querySelector(`.mono-card[data-idx="${cards.length-1}"] .mono-pin-btn`);
        if (newBtn) newBtn.onclick = () => monoTogglePin(newBtn, card);
      }
    } catch(e) {
      console.error('[Monologue] error', e);
      showToast('생성에 실패했어요');
    }
  }

  if (cards.length === 2) {
    const today = todayStr();
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.monologueLastDate   = today;
      window.parent.__PC_STORE__.monologueToday      = cards;
      window.parent.__PC_STORE__.monologueUsedIndices = [...usedToday, i1, i2];
    }
    if (saveStore) saveStore();
    if (pane) pane.insertAdjacentHTML('beforeend', `<div class="mono-tomorrow">내일 다시 올게요</div>`);
  }
};
