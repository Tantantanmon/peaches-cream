// screens/vault-settings.js — Settings

export function render() {
  syncStore();
  const cfg = store.fanFeedConfig || { group:'', fandomName:'', npcs:[] };
  const area = document.getElementById('scroll-area');

  area.innerHTML = `
    <!-- FAN FEED -->
    <div class="section-label" style="margin-top:4px;">Fan Feed</div>
    <div class="list-group">
      <div class="list-row">
        <div>
          <div class="row-label">소속 집단</div>
          <div class="row-sub">AI가 트윗 생성할 때 참고해요</div>
        </div>
        <input class="row-text-input" id="ff-group" type="text" placeholder="예: F1팀, 대학교, 군대" value="${esc(cfg.group||'')}"/>
      </div>
      <div class="list-row">
        <div>
          <div class="row-label">팬덤 이름</div>
          <div class="row-sub">팬 계정 이름에 사용돼요</div>
        </div>
        <input class="row-text-input" id="ff-fandom" type="text" placeholder="예: 아리아팬" value="${esc(cfg.fandomName||'')}"/>
      </div>
    </div>
    <div class="list-group">
      <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:10px;">
        <div>
          <div class="row-label">등장 NPC</div>
          <div class="row-sub">트윗에 자주 등장할 인물들</div>
        </div>
        <div class="tag-wrap" id="ff-npc-wrap">
          ${(cfg.npcs||[]).map(n=>`<div class="kw-tag">${esc(n)}<span class="kw-x" onclick="this.parentElement.remove()">×</span></div>`).join('')}
          <button class="add-tag" onclick="ffAddNPC()">+ 추가</button>
        </div>
      </div>
    </div>
    <div class="list-group">
      <div class="list-row tappable" onclick="resetHistory('fan-feed')">
        <div>
          <div class="row-label">생성 히스토리 초기화</div>
          <div class="row-sub">중복 방지 기록을 지워요</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
    </div>
    <button class="save-btn" id="ff-save-btn" onclick="ffSaveConfig()" style="margin:0 0 20px;">Fan Feed 설정 저장</button>

    <!-- OFF THE RECORD -->
    <div class="section-label">Off the Record</div>
    <div class="list-group">
      <div class="list-row tappable" onclick="resetHistory('cog')">
        <div>
          <div class="row-label">Caught Off Guard 초기화</div>
          <div class="row-sub">생성된 카드 히스토리를 지워요</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
      <div class="list-row tappable" onclick="resetHistory('dark')">
        <div>
          <div class="row-label">Dark Thoughts 초기화</div>
          <div class="row-sub">생성된 카드 히스토리를 지워요</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
    </div>

    <!-- REVIEWS -->
    <div class="section-label">Reviews</div>
    <div class="list-group">
      <div class="list-row tappable" onclick="resetHistory('reviews')">
        <div>
          <div class="row-label">후기 히스토리 초기화</div>
          <div class="row-sub">생성된 후기 기록을 지워요</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
    </div>

    <!-- DANGER -->
    <div class="section-label">데이터</div>
    <button class="reset-btn" onclick="resetAll()">이 캐릭터 데이터 전체 초기화</button>
    <div style="padding:8px 2px;"><span style="font-size:12px;color:var(--text-hint);">Character Profile, Kink & Fetish, 모든 생성 기록이 삭제돼요.</span></div>
  `;
}

window.ffAddNPC = function() {
  const val = prompt('NPC 이름:');
  if (!val||!val.trim()) return;
  const wrap   = document.getElementById('ff-npc-wrap');
  const addBtn = wrap.querySelector('.add-tag');
  const tag    = document.createElement('div');
  tag.className = 'kw-tag';
  tag.innerHTML = `${esc(val.trim())}<span class="kw-x" onclick="this.parentElement.remove()">×</span>`;
  wrap.insertBefore(tag, addBtn);
};

window.ffSaveConfig = function() {
  const group      = document.getElementById('ff-group')?.value.trim()  || '';
  const fandomName = document.getElementById('ff-fandom')?.value.trim() || '';
  const npcs       = Array.from(document.getElementById('ff-npc-wrap')?.querySelectorAll('.kw-tag')||[])
                       .map(t=>t.textContent.replace('×','').trim());
  if (window.parent?.__PC_STORE__) {
    window.parent.__PC_STORE__.fanFeedConfig = { group, fandomName, npcs };
    if (saveStore) saveStore();
  }
  showToast('저장됐어요 ✓');
};

window.resetHistory = function(type) {
  const labels = {
    'fan-feed': 'Fan Feed 히스토리를 초기화할까요?',
    'cog':      'Caught Off Guard 히스토리를 초기화할까요?',
    'dark':     'Dark Thoughts 히스토리를 초기화할까요?',
    'reviews':  '후기 히스토리를 초기화할까요?',
  };
  showModal({
    title:'히스토리 초기화',
    desc: labels[type] || '초기화할까요?',
    confirmText:'초기화',
    danger:true,
    onConfirm:() => {
      if (!window.parent?.__PC_STORE__) return;
      if (type==='fan-feed') window.parent.__PC_STORE__.fanFeedHistory = [];
      if (type==='cog')      window.parent.__PC_STORE__.cogHistory     = [];
      if (type==='dark')     window.parent.__PC_STORE__.darkHistory    = [];
      if (type==='reviews')  window.parent.__PC_STORE__.reviewsHistory = [];
      if (saveStore) saveStore();
      showToast('초기화됐어요');
    }
  });
};

window.resetAll = function() {
  showModal({
    title:'전체 초기화',
    desc:'이 캐릭터의 모든 데이터가 삭제돼요. 되돌릴 수 없어요.',
    confirmText:'초기화',
    danger:true,
    onConfirm:() => {
      if (!window.parent?.__PC_STORE__) return;
      const key = charKey;
      const globalStore = window.parent.__PC_GLOBAL_STORE__;
      if (globalStore?.chars?.[key]) delete globalStore.chars[key];
      if (saveStore) saveStore();
      if (refreshPrompt) refreshPrompt();
      showToast('전체 데이터 초기화됐어요');
      router.go('vault');
    }
  });
};
