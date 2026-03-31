// screens/clinic.js — Clinic

const DOCTORS = [
  { emoji:'👨‍⚕️', name:'박 원장',    sub:'산부인과 원장 · 경력 28년',   tone:'strict'  },
  { emoji:'👩‍⚕️', name:'김 레지던트', sub:'산부인과 레지던트 1년차',     tone:'shocked' },
  { emoji:'🧓',   name:'최 과장',    sub:'산부인과 과장 · 다 봤음',     tone:'tired'   },
  { emoji:'💉',   name:'이 인턴',    sub:'산부인과 인턴 · 열정 넘침',   tone:'eager'   },
];

// 의사 로테이션 — 같은 의사 연속 방지
let lastDocIdx = -1;

function pickDoctor() {
  let idx;
  do { idx = Math.floor(Math.random() * DOCTORS.length); } while (idx === lastDocIdx);
  lastDocIdx = idx;
  return DOCTORS[idx];
}

// AI 출력에서 ST 내부 태그 제거
function stripTags(str) {
  return str.replace(/<[^>]+>/g, '').trim();
}

export function render() {
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="white-card" style="gap:10px;">
      <div style="font-size:13px;color:var(--text-muted);">고민이나 궁금한 점을 적어봐요</div>
      <textarea class="q-input-area" id="clinic-input" placeholder="예: 거친 섹스를 자주 하는데 괜찮을까요?"></textarea>
      <div class="quick-row">
        <button class="quick-btn" onclick="clinicSetQ('거친 섹스 자주 해도 괜찮아?')">거친 섹스 자주 해도?</button>
        <button class="quick-btn" onclick="clinicSetQ('콘돔 안 쓰면 얼마나 위험해?')">콘돔 없이 위험해?</button>
        <button class="quick-btn" onclick="clinicSetQ('수갑 쓸 때 주의할 점은?')">수갑 주의사항</button>
        <button class="quick-btn" onclick="clinicSetQ('애프터케어 어떻게 해야 해?')">애프터케어</button>
      </div>
      <button class="save-btn" id="clinic-ask-btn" onclick="clinicAsk()">답변 받기</button>
    </div>
    <div class="loading-card" id="clinic-loading" style="display:none;"><div class="sp"></div><span class="loading-text" id="clinic-loading-text">분석 중...</span></div>
    <div id="clinic-answers" style="display:flex;flex-direction:column;gap:10px;"></div>
  `;

  document.getElementById('clinic-input').addEventListener('keydown', e => {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); clinicAsk(); }
  });
}

window.clinicSetQ = function(q) { document.getElementById('clinic-input').value = q; };

window.clinicAsk = async function() {
  const q = document.getElementById('clinic-input')?.value.trim();
  if (!q) return;
  if (!generate) { alert('ST와 연결되지 않았어요.'); return; }

  const doc = pickDoctor();
  const btn = document.getElementById('clinic-ask-btn');
  btn.disabled = true;
  document.getElementById('clinic-answers').innerHTML = '';

  const loadingEl   = document.getElementById('clinic-loading');
  const loadingText = document.getElementById('clinic-loading-text');
  loadingEl.style.display = 'flex';

  const steps = [`${doc.name} 호출 중...`, '분석 중...'];
  let si = 0;
  loadingText.textContent = steps[0];
  const iv = setInterval(() => { si++; if (si < steps.length) loadingText.textContent = steps[si]; }, 800);

  try {
    syncStore();
    const p       = store.userProfile  || {};
    const lt      = store.lastTouch    || { cards:[] };
    const cp      = store.charProfile  || {};
    const lastCard= lt.cards[0];
    const contextData = [
      p.chest          ? `User bust: ${p.chest}-cup`                        : '',
      p.bodyType       ? `User body type: ${p.bodyType}`                    : '',
      lastCard         ? `Last encounter mood: ${lastCard.mood||'unknown'}` : '',
      lastCard         ? `Condom used: ${lastCard.condom?'Yes':'No'}`       : '',
      lastCard?.positions?.length ? `Positions used: ${lastCard.positions.join(', ')}` : '',
      cp.size          ? `${charName}'s size: ${cp.size}${cp.sizeUnit||'cm'}` : '',
    ].filter(Boolean).join('\n');

    const docPersonas = {
      strict:  `You are Dr. Park (박 원장), a strict OB/GYN with 28 years experience. Direct, slightly judgmental, lectures patients. Calls out risky behavior bluntly.`,
      shocked: `You are Dr. Kim (김 레지던트), a 1st-year OB/GYN resident. Easily flustered by explicit cases. Tries to stay professional but loses composure mid-sentence.`,
      tired:   `You are Dr. Choi (최 과장), a senior OB/GYN who has seen absolutely everything. Utterly exhausted, dry deadpan tone. Zero surprise left in them.`,
      eager:   `You are Dr. Lee (이 인턴), an enthusiastic OB/GYN intern. Loves sharing medical knowledge, overly detailed, goes on tangents about anatomy.`,
    };

    const sys = `${docPersonas[doc.tone]}

Patient context:
${contextData || 'No patient data available'}

Character ${charName} brief info:
${charDesc ? charDesc.slice(0, 200) : 'No description'}

Instructions:
1. Answer the patient's question in Korean. 3-4 sentences. Stay fully in character as the doctor. Do NOT give generic advice — react specifically to the patient context above.
2. Add a comic prescription line starting with exactly "처방:" on a new line.
3. Output exactly this on its own line: ---CHAR---
4. Write ${charName}'s reaction in Korean. 3-4 sentences in their exact personality voice. Explicit, unapologetic or defensive. No female-degrading slurs in either section.
5. Do NOT output any XML tags, HTML tags, or system tags of any kind.`;

    const raw      = await generate(sys, `환자 질문: ${q}`);
    const cleaned  = stripTags(raw);
    const splitIdx = cleaned.indexOf('---CHAR---');
    const docRaw   = splitIdx >= 0 ? cleaned.slice(0, splitIdx).trim() : cleaned.trim();
    const charResult = splitIdx >= 0 ? cleaned.slice(splitIdx + 10).trim() : '';

    const parts      = docRaw.split(/처방:/i);
    const docText    = parts[0].trim();
    const rxText     = parts[1] ? parts[1].trim() : '';
    const hasWarning = /콘돔|위험|감염|손상|주의|STI|STD/.test(q + docText);

    clearInterval(iv);
    loadingEl.style.display = 'none';
    btn.disabled = false;

    document.getElementById('clinic-answers').innerHTML = `
      <div class="white-card" style="gap:10px;">
        <div class="card-header" style="padding:0 0 10px;">
          <div class="card-avatar" style="font-size:20px;">${doc.emoji}</div>
          <div><div class="card-name">${doc.name}</div><div class="card-sub">${doc.sub}</div></div>
        </div>
        ${hasWarning?'<div class="warn-tag">⚠️ 주의 필요</div>':''}
        <div class="card-text">${esc(docText)}</div>
        ${rxText?`<div class="rx-card"><div class="rx-label">📋 처방전</div><div class="rx-text">${esc(rxText)}</div></div>`:''}
      </div>
      ${charResult ? `
      <div class="dark-card">
        <div class="card-header">
          <div class="card-avatar" style="background:rgba(255,255,255,0.1);font-size:15px;font-weight:700;color:#e0e8f0;">${esc(charName.charAt(0))}</div>
          <div><div class="card-name">${esc(charName)}의 한마디</div><div class="card-sub">방금 읽고 반응</div></div>
        </div>
        <div class="card-body"><div class="card-text">${esc(charResult)}</div></div>
      </div>` : ''}
    `;

    setTimeout(() => { document.getElementById('scroll-area').scrollTop = 9999; }, 100);
  } catch(err) {
    clearInterval(iv);
    loadingEl.style.display = 'none';
    btn.disabled = false;
    console.error('[Clinic] error', err);
    alert('AI 호출 중 오류가 발생했어요.');
  }
};
