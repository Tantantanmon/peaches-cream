// screens/apology.js — Sorry Not Sorry v2.0

let activeTab = 'apology';

export function render() {
  syncStore();

  if (!document.getElementById('apo-style')) {
    const s = document.createElement('style');
    s.id = 'apo-style';
    s.textContent = `
/* ── 공통 ── */
.apo-gen-btn{width:100%;background:var(--surface);border:0.5px solid var(--divider);border-radius:var(--radius-sm);padding:14px;font-size:15px;font-weight:500;color:var(--text-secondary);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--shadow);}
.apo-gen-btn:active{background:#f5f5f5;}
.apo-gen-btn.loading{opacity:.5;pointer-events:none;}
.apo-input{width:100%;border:none;background:var(--surface);border-radius:var(--radius-sm);border:0.5px solid var(--divider);font-size:15px;color:var(--text-primary);font-family:inherit;resize:none;outline:none;line-height:1.5;padding:14px 16px;display:block;box-shadow:var(--shadow);}

/* ── 반성문 ── */
.apo-doc-wrap{background:#fffef9;border-radius:var(--radius-md);border:0.5px solid #e8e4d8;overflow:hidden;}
.apo-doc-header{padding:22px 20px 18px;text-align:center;position:relative;}
.apo-stamp{position:absolute;top:18px;right:18px;width:46px;height:46px;border-radius:50%;border:2.5px solid #c03020;display:flex;align-items:center;justify-content:center;color:#c03020;font-size:10px;font-weight:700;transform:rotate(-15deg);opacity:.85;line-height:1.2;text-align:center;}
.apo-doc-title{font-size:28px;font-weight:700;letter-spacing:2px;color:#000;font-family:Georgia,serif;}
.apo-doc-divider{height:0.5px;background:#e8e4d8;margin:0 20px;}
.apo-doc-body{padding:18px 20px 6px;font-size:13.5px;color:#1a1a1a;line-height:2;word-break:keep-all;}
.apo-doc-sign{padding:14px 20px 16px;border-top:0.5px solid #e8e4d8;font-size:12px;color:#aaa;text-align:right;}

/* ── 탄원서 ── */
.pet-doc-wrap{background:#fafaf8;border-radius:var(--radius-md);border:0.5px solid #e0ddd4;overflow:hidden;}
.pet-doc-header{padding:20px 20px 0;position:relative;}
.pet-stamp{position:absolute;top:18px;right:18px;width:46px;height:46px;border-radius:50%;border:2.5px solid #b07010;display:flex;align-items:center;justify-content:center;color:#b07010;font-size:10px;font-weight:700;transform:rotate(-12deg);opacity:.85;line-height:1.2;text-align:center;}
.pet-doc-title{font-size:26px;font-weight:700;letter-spacing:2px;color:#000;font-family:Georgia,serif;text-align:center;margin-bottom:14px;}
.pet-meta{border-top:1.5px solid #1a1a1a;border-bottom:0.5px solid #d0cdc4;width:100%;}
.pet-meta-row{display:flex;border-bottom:0.5px solid #e0ddd4;}
.pet-meta-row:last-child{border-bottom:none;}
.pet-meta-key{font-size:11px;font-weight:700;color:#888;letter-spacing:0.8px;padding:8px 12px;width:52px;flex-shrink:0;border-right:0.5px solid #e0ddd4;display:flex;align-items:center;}
.pet-meta-val{font-size:13px;color:#1a1a1a;padding:8px 12px;line-height:1.5;}
.pet-doc-body{padding:16px 20px 6px;font-size:13.5px;color:#1a1a1a;line-height:2;word-break:keep-all;}
.pet-sign-area{margin:0 20px;border-top:0.5px solid #e0ddd4;padding:14px 0 16px;display:flex;justify-content:flex-end;}
.pet-doc-sign{font-size:12px;color:#aaa;text-align:right;}

/* ── 섹션 pill ── */
.doc-section{display:inline-flex;align-items:center;gap:5px;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:600;margin:14px 0 6px;letter-spacing:0.3px;}
.doc-section.why{background:#fff0f0;color:#c03020;}
.doc-section.excuse{background:#fff8e0;color:#a07010;}
.doc-section.plan{background:#f0f0ff;color:#5050c0;}
.doc-section.main{background:#fff8e0;color:#a07010;}
.doc-section.req{background:#e8f4e8;color:#2a7a40;}
.doc-section.threat{background:#fff0f0;color:#c03020;}

/* ── 형광펜 ── */
.hl{background:#fffde7;color:#1a1a1a;border-radius:3px;padding:1px 3px;}
    `;
    document.head.appendChild(s);
  }

  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div class="tab-bar" style="margin:-20px -16px 16px;border-radius:0;">
      <button class="tab-item active" id="apo-tab-apology" onclick="apoSwitchTab('apology')">Apology</button>
      <button class="tab-item" id="apo-tab-petition" onclick="apoSwitchTab('petition')">Petition</button>
    </div>

    <!-- Apology -->
    <div id="apo-pane-apology" style="display:flex;flex-direction:column;gap:12px;">
      <textarea id="apo-reason" class="apo-input" rows="1"
        placeholder="예: 자다가 갑자기 끌어안아서"
        oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"></textarea>
      <button class="apo-gen-btn" id="apo-gen-btn" onclick="apoGenerate()">✦ Apology 생성</button>
      <div class="loading-card" id="apo-loading" style="display:none;"><div class="sp"></div><span class="loading-text">반성문 작성 중...</span></div>
      <div id="apo-result"></div>
    </div>

    <!-- Petition -->
    <div id="apo-pane-petition" style="display:none;flex-direction:column;gap:12px;">
      <button class="apo-gen-btn" id="pet-gen-btn" onclick="petGenerate()">✦ Petition 생성</button>
      <div class="loading-card" id="pet-loading" style="display:none;"><div class="sp"></div><span class="loading-text">탄원서 작성 중...</span></div>
      <div id="pet-result"></div>
    </div>
  `;
}

window.apoSwitchTab = function(tab) {
  activeTab = tab;
  document.getElementById('apo-tab-apology').className = 'tab-item' + (tab==='apology'?' active':'');
  document.getElementById('apo-tab-petition').className = 'tab-item' + (tab==='petition'?' active':'');
  document.getElementById('apo-pane-apology').style.display = tab==='apology' ? 'flex' : 'none';
  document.getElementById('apo-pane-petition').style.display = tab==='petition' ? 'flex' : 'none';
};

function formatDoc(text) {
  return text
    .trim()
    .replace(/<phone_trigger[^>]*>[\s\S]*?<\/phone_trigger>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/~~(.*?)~~/g, '<span class="hl">$1</span>')
    .replace(/\[위반 사유\]/g, '<span class="doc-section why">🚩 위반 사유</span>')
    .replace(/\[변명\]/g,      '<span class="doc-section excuse">🤷 변명</span>')
    .replace(/\[향후 계획\]/g,  '<span class="doc-section plan">📋 향후 계획</span>')
    .replace(/\[탄원 내용\]/g,  '<span class="doc-section main">📄 탄원 내용</span>')
    .replace(/\[요청 사항\]/g,  '<span class="doc-section req">📋 요청 사항</span>')
    .replace(/\[불수락 시 대책\]/g, '<span class="doc-section threat">⚠️ 불수락 시 대책</span>')
    .replace(/\n/g, '<br>');
}

function renderApologyDoc(containerId, text) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="apo-doc-wrap">
      <div class="apo-doc-header">
        <div class="apo-stamp">거절</div>
        <div class="apo-doc-title">I'm Sorry</div>
      </div>
      <div class="apo-doc-divider"></div>
      <div class="apo-doc-body">${formatDoc(text)}</div>
      <div class="apo-doc-sign">${esc(charName)} 올림</div>
    </div>
  `;
}

function renderPetitionDoc(containerId, text, toName, fromName) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="pet-doc-wrap">
      <div class="pet-doc-header">
        <div class="pet-stamp">검토중</div>
        <div class="pet-doc-title">Petition</div>
      </div>
      <div class="pet-meta">
        <div class="pet-meta-row">
          <div class="pet-meta-key">수신</div>
          <div class="pet-meta-val">${esc(toName)} 귀중</div>
        </div>
        <div class="pet-meta-row">
          <div class="pet-meta-key">발신</div>
          <div class="pet-meta-val">${esc(fromName)}</div>
        </div>
      </div>
      <div class="pet-doc-body">${formatDoc(text)}</div>
      <div class="pet-sign-area">
        <div class="pet-doc-sign">${esc(fromName)} 올림</div>
      </div>
    </div>
  `;
}

window.apoGenerate = async function() {
  const reason = document.getElementById('apo-reason')?.value.trim();
  if (!reason) { showToast('사유를 입력해줘'); return; }
  if (!generateWithRole) { showToast('ST와 연결되지 않았어요'); return; }

  const btn = document.getElementById('apo-gen-btn');
  btn.classList.add('loading'); btn.textContent = '작성 중...';
  document.getElementById('apo-loading').style.display = 'flex';
  document.getElementById('apo-result').innerHTML = '';

  const sys = `You are ${charName}.
${charDesc ? `Character:\n${charDesc.slice(0,300)}\n` : ''}
${charName ? `Speak strictly in ${charName}'s tone and personality.` : ''}
Write a Korean apology letter (반성문) in ${charName}'s exact natural voice and personality.
Reason for apology: "${reason}"

Format (plain text, in order):

[위반 사유]
Explain what happened naturally in character's voice. Weave in who/what/when/where/why/how organically — do NOT list them as labels.
Somewhere in this section, include one sentence that accidentally reveals the truth, wrapped in ~~text~~.

[변명]
2~3 excuses in character's voice, each on a new line starting with -. At least one wrapped in ~~text~~.

[향후 계획]
Basically admit they'll do it again.

[closing line — clearly insincere apology]

Rules: Write in ${charName}'s natural speech style. Shameless and comic tone. NSFW ok. No stiff formal language unless that IS the character. Plain text only, use ~~text~~ for highlights.`;

  try {
    const result = await generateWithRole(sys, `${reason}에 대한 반성문`, 'apology');
    renderApologyDoc('apo-result', result);
  } catch(e) {
    console.error('[Apology] error', e);
    showToast('생성에 실패했어요');
  }

  btn.classList.remove('loading'); btn.textContent = '✦ Apology 생성';
  document.getElementById('apo-loading').style.display = 'none';
};

window.petGenerate = async function() {
  if (!generateWithRole) { showToast('ST와 연결되지 않았어요'); return; }

  const btn = document.getElementById('pet-gen-btn');
  btn.classList.add('loading'); btn.textContent = '작성 중...';
  document.getElementById('pet-loading').style.display = 'flex';
  document.getElementById('pet-result').innerHTML = '';

  const sys = `You are ${charName}.
${charDesc ? `Character:\n${charDesc.slice(0,300)}\n` : ''}
${charName ? `Speak strictly in ${charName}'s tone and personality.` : ''}
Write a Korean petition letter (탄원서) to ${userName} in ${charName}'s exact natural voice and personality.
Choose what ${charName} wants to petition for — based on the character's personality and desires. Be creative and specific.

Format (plain text, in order):

[탄원 내용]
Main petition — what character wants, with shameless reasoning.
Include one sentence wrapped in ~~text~~ that reveals the real reason.

[요청 사항]
Numbered list of specific asks.

[불수락 시 대책]
What character will do if rejected — petty, dramatic, or mildly threatening. Stay in character.

[closing — overly formal but clearly desperate/bratty]

Rules: Write in ${charName}'s natural speech style. Mix of threatening and pathetic. NSFW ok. Plain text only, use ~~text~~ for highlights.`;

  try {
    const result = await generateWithRole(sys, '탄원서 작성', 'apology');
    renderPetitionDoc('pet-result', result, userName, charName);
  } catch(e) {
    console.error('[Petition] error', e);
    showToast('생성에 실패했어요');
  }

  btn.classList.remove('loading'); btn.textContent = '✦ Petition 생성';
  document.getElementById('pet-loading').style.display = 'none';
};
