// screens/clinic.js — Clinic

const DOCTORS = [
  { emoji:'👨‍⚕️', name:'박 원장',    sub:'산부인과 원장 · 경력 28년',   tone:'strict'  },
  { emoji:'👩‍⚕️', name:'김 레지던트', sub:'산부인과 레지던트 1년차',     tone:'shocked' },
  { emoji:'🧓',   name:'최 과장',    sub:'산부인과 과장 · 다 봤음',     tone:'tired'   },
  { emoji:'💉',   name:'이 인턴',    sub:'산부인과 인턴 · 열정 넘침',   tone:'eager'   },
];

export function render() {
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="white-card" style="gap:10px;">
      <div style="font-size:13px;color:var(--text-muted);">고민이나 궁금한 점을 적어봐요</div>
      <textarea class="q-input-area" id="clinic-input" placeholder="예: 거친 섹스를 자주 하는데 괜찮을까요?"></textarea>
      <div class="quick-row">
        <button class="quick-btn" onclick="clinicSetQ('거친 섹스 자주 해도 괜찮아?')">거친 섹스 자주 해도 괜찮아?</button>
        <button class="quick-btn" onclick="clinicSetQ('콘돔 안 쓰면 얼마나 위험해?')">콘돔 안 쓰면 위험해?</button>
        <button class="quick-btn" onclick="clinicSetQ('수갑 쓸 때 주의할 점은?')">수갑 주의사항</button>
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

  const doc = DOCTORS[Math.floor(Math.random() * DOCTORS.length)];
  const btn = document.getElementById('clinic-ask-btn');
  btn.disabled = true;
  document.getElementById('clinic-answers').innerHTML = '';

  const loadingEl = document.getElementById('clinic-loading');
  const loadingText = document.getElementById('clinic-loading-text');
  loadingEl.style.display = 'flex';

  const steps = ['연동 데이터 분석 중...', `${doc.name} 호출 중...`];
  let si = 0;
  loadingText.textContent = steps[0];
  const iv = setInterval(() => { si++; if (si < steps.length) loadingText.textContent = steps[si]; }, 650);

  try {
    // 연동 데이터 구성
    syncStore();
    const p  = store.userProfile   || {};
    const lt = store.lastTouch     || { cards:[] };
    const cp = store.charProfile   || {};
    const lastCard = lt.cards[0];
    const contextData = [
      p.chest         ? `User bust: ${p.chest}-cup`      : '',
      p.bodyType      ? `User body: ${p.bodyType}`        : '',
      lastCard        ? `Last encounter: ${lastCard.mood||''} (${lastCard.date||''})` : '',
      lastCard        ? `Condom used: ${lastCard.condom?'Yes':'No'}`  : '',
      lastCard?.positions?.length ? `Positions: ${lastCard.positions.join(', ')}` : '',
      cp.size         ? `${charName}'s size: ${cp.size}${cp.sizeUnit||'cm'}` : '',
    ].filter(Boolean).join('\n');

    // 의사 성격별 시스템
    const docPersonas = {
      strict:  `You are Dr. Park, a strict and authoritative OB/GYN with 28 years of experience. You are very direct, slightly judgmental, and like to lecture. You take patient data seriously and will call out risky behaviors bluntly.`,
      shocked: `You are Dr. Kim, a 1st-year OB/GYN resident. You are easily flustered and shocked by explicit cases, but try to be professional. You sometimes lose composure mid-sentence.`,
      tired:   `You are Dr. Choi, a senior OB/GYN attending physician who has seen everything. You are utterly exhausted and speak in a dry, deadpan tone. You've given up being surprised.`,
      eager:   `You are Dr. Lee, an enthusiastic OB/GYN intern who loves to share medical knowledge. You are overly detailed and excited, often going on tangents about anatomy.`,
    };

    // 1회 호출로 의사 + 캐릭터 반응 동시 생성
    const combinedSys = `${docPersonas[doc.tone]}

Patient context data:
${contextData || 'No data available'}

Character ${charName} description (brief):
${charDesc ? charDesc.slice(0, 250) : 'No description'}

Step 1 — Answer the patient's question in Korean as the doctor. 3-4 sentences. Stay in character.
Add a comic prescription line starting with "처방:" on a new line.

Then output exactly this separator on its own line: ---CHAR---

Step 2 — Write ${charName}'s reaction in Korean. 3-4 sentences in their exact voice and personality. Explicit, unapologetic or defensive. No female-degrading slurs in either section.`;

    const combined  = await generate(combinedSys, `환자 질문: ${q}`);
    const splitIdx  = combined.indexOf('---CHAR---');
    const docResult = splitIdx >= 0 ? combined.slice(0, splitIdx).trim() : combined.trim();
    const charResult= splitIdx >= 0 ? combined.slice(splitIdx + 10).trim() : '';

    clearInterval(iv);
    loadingEl.style.display = 'none';
    btn.disabled = false;

    // 처방전 분리
    const parts       = docResult.split(/처방:/i);
    const docText     = parts[0].trim();
    const rxText      = parts[1] ? '처방: ' + parts[1].trim() : '';
    const hasWarning  = /콘돔|위험|감염|손상|주의/.test(q + docText);

    document.getElementById('clinic-answers').innerHTML = `
      <div class="white-card" style="gap:10px;">
        <div class="card-header" style="padding:0 0 10px;">
          <div class="card-avatar" style="font-size:20px;">${doc.emoji}</div>
          <div><div class="card-name">${doc.name}</div><div class="card-sub">${doc.sub}</div></div>
        </div>
        ${hasWarning?'<div class="warn-tag">⚠️ 주의 필요</div>':''}
        <div class="card-text">${esc(docText).replace(/<br>/g,'<br>')}</div>
        ${rxText?`<div class="rx-card"><div class="rx-label">📋 처방전</div><div class="rx-text">${esc(rxText)}</div></div>`:''}
      </div>
      <div class="dark-card">
        <div class="card-header">
          <div class="card-avatar" style="background:rgba(255,255,255,0.1);font-size:15px;font-weight:700;color:#e0e8f0;">${esc(charName.charAt(0))}</div>
          <div><div class="card-name">${esc(charName)}의 한마디</div><div class="card-sub">방금 읽고 반응</div></div>
        </div>
        <div class="card-body"><div class="card-text">${esc(charResult)}</div></div>
      </div>
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
