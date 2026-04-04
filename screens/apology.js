// screens/apology.js — Sorry Not Sorry v1.0

let activeTab = 'apology';

export function render() {
  syncStore();

  if (!document.getElementById('apo-style')) {
    const s = document.createElement('style');
    s.id = 'apo-style';
    s.textContent = `
.apo-paper{background:#fffef9;padding:22px 20px 26px;position:relative;font-size:13px;line-height:1.95;color:#1a1a1a;border:0.5px solid #e8e4d8;border-radius:var(--radius-md);}
.apo-stamp{position:absolute;top:16px;right:16px;width:50px;height:50px;border-radius:50%;border:3px solid #c03020;display:flex;align-items:center;justify-content:center;color:#c03020;font-size:11px;font-weight:700;transform:rotate(-18deg);opacity:.85;}
.apo-stamp.pending{border-color:#b07010;color:#b07010;transform:rotate(-12deg);}
.apo-doc-title{text-align:center;font-size:17px;font-weight:700;letter-spacing:6px;margin-bottom:14px;color:#000;}
.apo-meta{font-size:12px;color:#555;margin-bottom:3px;}
.apo-divider{height:0.5px;background:#e0dcd0;margin:12px 0;}
.apo-section{font-size:11px;font-weight:700;letter-spacing:1px;color:#888;text-transform:uppercase;margin:12px 0 5px;}
.apo-body{font-size:13px;color:#2a2a2a;line-height:2;white-space:pre-wrap;word-break:keep-all;}
.apo-closing{text-align:center;font-size:13px;color:#555;font-style:italic;margin-top:14px;line-height:1.8;}
.apo-sign{margin-top:14px;text-align:right;font-size:12px;color:#888;border-top:0.5px solid #e8e4d8;padding-top:10px;}
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
      <div class="list-group">
        <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 16px;">
          <span style="font-size:12px;font-weight:500;color:var(--text-muted);">무슨 일로?</span>
          <textarea id="apo-reason" style="width:100%;background:var(--background);border:none;border-radius:10px;padding:10px 12px;font-size:15px;color:var(--text-primary);outline:none;font-family:inherit;resize:none;line-height:1.5;" rows="2" placeholder="예: 자다가 갑자기 끌어안아서"></textarea>
        </div>
      </div>
      <button class="gen-btn" id="apo-gen-btn" onclick="apoGenerate()">✦ Apology 생성</button>
      <div class="loading-card" id="apo-loading" style="display:none;"><div class="sp"></div><span class="loading-text">반성문 작성 중...</span></div>
      <div id="apo-result"></div>
    </div>

    <!-- Petition -->
    <div id="apo-pane-petition" style="display:none;flex-direction:column;gap:12px;">
      <button class="gen-btn" id="pet-gen-btn" onclick="petGenerate()">✦ Petition 생성</button>
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

function renderDoc(containerId, text, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const stampLabel = type === 'apology' ? '거절' : '검토중';
  const stampClass = type === 'apology' ? '' : ' pending';
  container.innerHTML = `
    <div class="apo-paper">
      <div class="apo-stamp${stampClass}">${stampLabel}</div>
      <div class="apo-body">${formatDoc(text)}</div>
    </div>
  `;
}

function formatDoc(text) {
  return text
    .trim()
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/~~(.*?)~~/g, '<span style="text-decoration:line-through;color:#bbb;">$1</span>')
    .replace(/\n/g, '<br>');
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
${charDesc ? `Character:\n${charDesc.slice(0, 150)}\n` : ''}
Write a Korean apology letter (반성문) in ${charName}'s exact natural voice and personality.
Reason for apology: "${reason}"

Format (plain text, in order):
반 성 문
작성자: [name] / 직업: [job, make it funny] / 현재 상황: [funny current situation]

[위반 사유]
Explain what happened naturally in character's voice. Weave in who/what/when/where/why/how organically — do NOT list them as labels.

~~[one crossed-out excuse that accidentally reveals the truth]~~

[변명]
2~3 excuses in character's voice. At least one struck through with ~~text~~.

[향후 계획]
Basically admit they'll do it again.

[closing line — clearly insincere apology]

[character name] 올림

Rules: Write in ${charName}'s natural speech style. Shameless and comic tone. NSFW ok. No stiff formal language unless that IS the character. Plain text only, use ~~text~~ for strikethrough.`;

  try {
    const result = await generateWithRole(sys, `${reason}에 대한 반성문`, 'apology');
    renderDoc('apo-result', result, 'apology');
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
${charDesc ? `Character:\n${charDesc.slice(0, 150)}\n` : ''}
Write a Korean petition letter (탄원서) to ${userName} in ${charName}'s exact natural voice and personality.
Choose what ${charName} wants to petition for — based on the character's personality and desires. Be creative and specific.

Format (plain text, in order):
탄 원 서
수신: ${userName} / 발신: ${charName} / 직책: [funny title]

[main petition — what character wants, with shameless reasoning]
~~[crossed-out real reason that reveals the truth]~~

[요청 사항]
Numbered list of specific asks.

[불수락 시 대책]
What character will do if rejected — petty, dramatic, or mildly threatening. Stay in character.

[closing — overly formal but clearly desperate/bratty]

${charName} 올림

Rules: Write in ${charName}'s natural speech style. Mix of threatening and pathetic. NSFW ok. Plain text only, use ~~text~~ for strikethrough.`;

  try {
    const result = await generateWithRole(sys, '탄원서 작성', 'apology');
    renderDoc('pet-result', result, 'petition');
  } catch(e) {
    console.error('[Petition] error', e);
    showToast('생성에 실패했어요');
  }

  btn.classList.remove('loading'); btn.textContent = '✦ Petition 생성';
  document.getElementById('pet-loading').style.display = 'none';
};
