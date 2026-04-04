// screens/vault-wanted.js — Wanted & Trial v1.0

let wantedCrimes = [];
let crimeCounter = 0;
let totalBounty  = 0;

export function render() {
  syncStore();

  if (!document.getElementById('wanted-style')) {
    const s = document.createElement('style');
    s.id = 'wanted-style';
    s.textContent = `
.wanted-banner{background:var(--surface);border-radius:var(--radius-sm);border:0.5px solid var(--divider);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow);}
.wanted-level-label{font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;}
.wanted-level-badge{display:inline-flex;align-items:center;gap:5px;background:var(--danger-bg);border-radius:20px;padding:4px 12px;font-size:13px;font-weight:700;color:var(--danger);}
.wanted-bounty-label{font-size:11px;color:var(--text-muted);margin-bottom:2px;text-align:right;}
.wanted-bounty-val{font-size:22px;font-weight:700;color:var(--text-primary);text-align:right;}
.crime-card{background:var(--surface);border-radius:var(--radius-sm);border:0.5px solid var(--divider);overflow:hidden;box-shadow:var(--shadow);}
.crime-card-header{padding:11px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:0.5px solid var(--divider-light);}
.crime-num{font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;}
.crime-bounty{font-size:11px;font-weight:700;color:var(--danger);}
.crime-body{padding:12px 16px;}
.crime-title{font-size:15px;font-weight:600;color:var(--text-primary);margin-bottom:4px;}
.crime-desc{font-size:13px;color:var(--text-secondary);line-height:1.7;}
.trial-info{background:var(--surface);border-radius:var(--radius-sm);border:0.5px solid var(--divider);padding:16px 18px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow);}
.trial-icon{width:44px;height:44px;border-radius:12px;background:var(--btn-idle);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.trial-info-t{font-size:15px;font-weight:600;color:var(--text-primary);}
.trial-info-s{font-size:12px;color:var(--text-muted);margin-top:2px;}
.verdict-card{background:#fffef9;border-radius:var(--radius-md);border:0.5px solid #e8e4d8;overflow:hidden;}
.verdict-header{padding:22px 20px 16px;text-align:center;position:relative;}
.verdict-stamp-guilty{position:absolute;top:16px;right:16px;width:46px;height:46px;border-radius:50%;border:2.5px solid #c03020;display:flex;align-items:center;justify-content:center;color:#c03020;font-size:10px;font-weight:700;transform:rotate(-12deg);opacity:.85;line-height:1.2;text-align:center;}
.verdict-stamp-innocent{position:absolute;top:16px;right:16px;width:46px;height:46px;border-radius:50%;border:2.5px solid #2a7a40;display:flex;align-items:center;justify-content:center;color:#2a7a40;font-size:10px;font-weight:700;transform:rotate(-12deg);opacity:.85;line-height:1.2;text-align:center;}
.verdict-title{font-size:26px;font-weight:700;letter-spacing:3px;color:#000;font-family:Georgia,serif;}
.verdict-divider{height:0.5px;background:#e8e4d8;margin:0 20px;}
.verdict-body{padding:16px 20px 6px;font-size:13.5px;color:#1a1a1a;line-height:2;word-break:keep-all;}
.verdict-sentence{background:#fff0f0;border-radius:12px;padding:12px 14px;margin:12px 0;border-left:3px solid #c03020;}
.verdict-sentence-label{font-size:10px;font-weight:700;letter-spacing:1px;color:#c03020;text-transform:uppercase;margin-bottom:4px;}
.verdict-sentence-text{font-size:14px;font-weight:600;color:#1a1a1a;line-height:1.7;}
.verdict-sign{padding:12px 20px 16px;border-top:0.5px solid #e8e4d8;font-size:12px;color:#aaa;text-align:right;}
    `;
    document.head.appendChild(s);
  }

  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="wt-tab-wanted" onclick="wtSwitchTab('wanted')">Wanted</button>
      <button class="tab-item" id="wt-tab-trial" onclick="wtSwitchTab('trial')">Trial</button>
    </div>

    <!-- Wanted -->
    <div id="wt-pane-wanted" style="display:flex;flex-direction:column;gap:10px;">
      <div class="wanted-banner" id="wt-banner">
        <div>
          <div class="wanted-level-label">수배 등급</div>
          <div class="wanted-level-badge" id="wt-level">— 기록 없음</div>
        </div>
        <div>
          <div class="wanted-bounty-label">누적 현상금</div>
          <div class="wanted-bounty-val" id="wt-bounty">$0</div>
        </div>
      </div>
      <div class="loading-card" id="wt-loading" style="display:none;"><div class="sp"></div><span class="loading-text">죄목 작성 중...</span></div>
      <div id="wt-crimes"></div>
      <button class="gen-btn" id="wt-gen-btn" onclick="wtGenerate()">✦ 새 죄목 추가</button>
    </div>

    <!-- Trial -->
    <div id="wt-pane-trial" style="display:none;flex-direction:column;gap:10px;">
      <div class="trial-info" id="wt-trial-info">
        <div class="trial-icon">⚖️</div>
        <div>
          <div class="trial-info-t" id="wt-trial-summary">죄목 0건 · $0</div>
          <div class="trial-info-s">죄목이 쌓일수록 형량이 무거워집니다</div>
        </div>
      </div>
      <button class="gen-btn" id="wt-trial-btn" onclick="wtTrial()">✦ 재판 시작</button>
      <div class="loading-card" id="wt-trial-loading" style="display:none;"><div class="sp"></div><span class="loading-text">판결문 작성 중...</span></div>
      <div id="wt-verdict"></div>
    </div>
  `;

  wtRenderAll();
}

window.wtSwitchTab = function(tab) {
  document.getElementById('wt-tab-wanted').className = 'tab-item' + (tab==='wanted'?' active':'');
  document.getElementById('wt-tab-trial').className  = 'tab-item' + (tab==='trial'?' active':'');
  document.getElementById('wt-pane-wanted').style.display = tab==='wanted' ? 'flex' : 'none';
  document.getElementById('wt-pane-trial').style.display  = tab==='trial'  ? 'flex' : 'none';
  if (tab==='trial') wtUpdateTrialInfo();
};

function wtLevel(bounty) {
  if (bounty === 0)       return '— 기록 없음';
  if (bounty < 1000)      return '👀 관심경보';
  if (bounty < 5000)      return '⚠️ 위험인물';
  if (bounty < 20000)     return '🔴 지명수배';
  return '🚨 최우선수배';
}

function wtRenderAll() {
  const wrap = document.getElementById('wt-crimes');
  if (!wrap) return;
  if (!wantedCrimes.length) { wrap.innerHTML = ''; wtUpdateBanner(); return; }
  wrap.innerHTML = [...wantedCrimes].reverse().map((c, i) => `
    <div class="crime-card">
      <div class="crime-card-header">
        <span class="crime-num">죄목 #${String(wantedCrimes.length - i).padStart(3,'0')}</span>
        <span class="crime-bounty">+$${c.bounty.toLocaleString()}</span>
      </div>
      <div class="crime-body">
        <div class="crime-title">${esc(c.title)}</div>
        <div class="crime-desc">${esc(c.desc)}</div>
      </div>
    </div>
  `).join('');
  wtUpdateBanner();
}

function wtUpdateBanner() {
  const lv = document.getElementById('wt-level');
  const bv = document.getElementById('wt-bounty');
  if (lv) lv.textContent = wtLevel(totalBounty);
  if (bv) bv.textContent = '$' + totalBounty.toLocaleString();
}

function wtUpdateTrialInfo() {
  const el = document.getElementById('wt-trial-summary');
  if (el) el.textContent = `죄목 ${wantedCrimes.length}건 · $${totalBounty.toLocaleString()}`;
}

window.wtGenerate = async function() {
  if (!generateWithRole) { showToast('ST와 연결되지 않았어요'); return; }
  const btn = document.getElementById('wt-gen-btn');
  btn.classList.add('loading'); btn.textContent = '작성 중...';
  document.getElementById('wt-loading').style.display = 'flex';

  const chatText = buildChatText(15);
  const sys = `You are ${charName}, the victim. You are filing a formal crime report against ${userName}.
${charDesc ? `Character:\n${charDesc.slice(0,150)}\n` : ''}
Based on the recent conversation, identify ONE thing ${userName} did that wronged you (emotionally, physically, NSFW, or just annoying).
Be creative — crimes can range from mundane (ignoring your texts) to NSFW (sexual acts without permission) to emotional (making your heart flutter without consent).

Respond in JSON only, no markdown, no extra text:
{"title":"죄목명 (Korean, 3-8 chars, ends with 죄 or 행위)", "desc":"고소 내용 in Korean, 2-3 sentences, written as a formal complaint in ${charName}'s voice. Refer to yourself as 피해자(${charName}), refer to ${userName} as 피의자.", "bounty": <integer between 100 and 5000>}`;

  try {
    const raw = await generateWithRole(sys, `최근 대화:\n${chatText}`, 'wanted');
    const clean = raw.replace(/```json|```/g,'').trim();
    const obj = JSON.parse(clean);
    crimeCounter++;
    const crime = { id: crimeCounter, title: obj.title||'불명죄', desc: obj.desc||'', bounty: parseInt(obj.bounty)||500 };
    wantedCrimes.push(crime);
    totalBounty += crime.bounty;
    wtRenderAll();
  } catch(e) {
    console.error('[Wanted] error', e);
    showToast('생성에 실패했어요');
  }

  btn.classList.remove('loading'); btn.textContent = '✦ 새 죄목 추가';
  document.getElementById('wt-loading').style.display = 'none';
};

window.wtTrial = async function() {
  if (!wantedCrimes.length) { showToast('먼저 죄목을 추가해줘'); return; }
  if (!generateWithRole) { showToast('ST와 연결되지 않았어요'); return; }

  const btn = document.getElementById('wt-trial-btn');
  btn.classList.add('loading'); btn.textContent = '판결 중...';
  document.getElementById('wt-trial-loading').style.display = 'flex';
  document.getElementById('wt-verdict').innerHTML = '';

  const crimeList = wantedCrimes.map((c,i) => `${i+1}. ${c.title} — ${c.desc}`).join('\n');
  const count = wantedCrimes.length;

  const sys = `You are ${charName}. You are the judge, prosecutor, AND victim in this trial against ${userName}.
${charDesc ? `Character:\n${charDesc.slice(0,150)}\n` : ''}
The defendant has ${count} crime(s) on record with a total bounty of $${totalBounty.toLocaleString()}.

Crimes:
${crimeList}

Write a Korean verdict (판결문) in ${charName}'s voice. Format (plain text):

One paragraph: start with the crime count and bounty, comment on the crimes in character's natural voice — sarcastic, dramatic, or grudgingly fond. Keep it flowing prose, no line breaks within the paragraph.

[선고]
Choose ONE or MORE sentences from these options based on severity (more crimes = harsher):
- 무죄 석방 (증거 불충분 — 증거 있는데 무시함)
- 집행유예 + absurd condition (e.g. 오늘 저녁 옆에 있을 것, 먼저 연락할 것)
- 벌금 $X (탕감 조건 포함 가능)
- 침대감옥 N시간 (탈출 시 가중처벌)
- 엉덩이 N대 (집행은 재판부 재량)
- 봉사활동: 피해자 전담 마사지 N시간
- 사회적 제재: 도망가기 금지
- 강제이행: 키스 N회 즉시 납부
- 가택연금 N시간 (피해자 집에서 나가기 금지)
For 1-2 crimes: light sentence or acquittal. For 3-4: medium. For 5+: multiple sentences stacked.

End with one short dismissive closing line.

Rules: ${charName}'s natural voice. Comic NSFW ok. Plain text only.`;

  try {
    const result = await generateWithRole(sys, '판결 시작', 'trial');
    wtRenderVerdict(result);
  } catch(e) {
    console.error('[Trial] error', e);
    showToast('생성에 실패했어요');
  }

  btn.classList.remove('loading'); btn.textContent = '✦ 재판 시작';
  document.getElementById('wt-trial-loading').style.display = 'none';
};

function wtRenderVerdict(text) {
  const container = document.getElementById('wt-verdict');
  if (!container) return;

  const isGuilty = !text.includes('무죄');
  const stampClass = isGuilty ? 'verdict-stamp-guilty' : 'verdict-stamp-innocent';
  const stampLabel = isGuilty ? '유죄' : '무죄';

  const parts = text.split(/\[선고\]/);
  const body   = parts[0] ? parts[0].trim() : '';
  const ruling = parts[1] ? parts[1].trim() : '';

  const fmt = (t) => t
    .replace(/<phone_trigger[^>]*>[\s\S]*?<\/phone_trigger>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>');

  container.innerHTML = `
    <div class="verdict-card">
      <div class="verdict-header">
        <div class="${stampClass}">${stampLabel}</div>
        <div class="verdict-title">판 결 문</div>
      </div>
      <div class="verdict-divider"></div>
      <div class="verdict-body">
        <div style="margin-bottom:10px;">${fmt(body)}</div>
        ${ruling ? `<div class="verdict-sentence">
          <div class="verdict-sentence-label">⚖️ 선고</div>
          <div class="verdict-sentence-text">${fmt(ruling)}</div>
        </div>` : ''}
      </div>
      <div class="verdict-sign">${esc(charName)} 판사 (겸 검사, 겸 피해자)</div>
    </div>
  `;
}
