// screens/vault-settings.js — Settings

export function render() {
  syncStore();
  const cfg = store.fanFeedConfig || { group:'', npcs:[] };
  const area = document.getElementById('scroll-area');

  area.innerHTML = `
    <!-- WORLD FEED -->
    <div class="section-label" style="margin-top:4px;">World Feed</div>
    <div class="list-group">
      <div class="list-row">
        <div>
          <div class="row-label">세계관</div>
          <div class="row-sub">AI가 피드 생성할 때 참고해요</div>
        </div>
        <input class="row-text-input" id="ff-group" type="text" placeholder="예: 콜오브듀티, F1, 대학교" value="${esc(cfg.group||'')}"/>
      </div>
    </div>
    <div class="list-group">
      <div class="list-row" style="flex-direction:column;align-items:flex-start;gap:10px;">
        <div>
          <div class="row-label">등장 NPC <span style="font-size:11px;color:var(--text-hint);">최대 8명</span></div>
          <div class="row-sub">피드에 등장할 인물들</div>
        </div>
        <div class="tag-wrap" id="ff-npc-wrap">
          ${(cfg.npcs||[]).map(n=>`<div class="kw-tag">${esc(n)}<span class="kw-x" onclick="this.parentElement.remove()">×</span></div>`).join('')}
          <button class="add-tag" onclick="ffAddNPC()">+ 추가</button>
        </div>
      </div>
    </div>
    <button class="save-btn" id="ff-save-btn" onclick="ffSaveConfig()" style="margin:0 0 20px;">World Feed 설정 저장</button>

    <!-- 앱별 초기화 -->
    <div class="section-label">앱별 초기화</div>
    <div class="list-group">
      <div class="list-row tappable" onclick="resetApp('reviews')">
        <div>
          <div class="row-label">Reviews</div>
          <div class="row-sub">저장된 후기 전체 삭제</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
      <div class="list-row tappable" onclick="resetApp('offrecord')">
        <div>
          <div class="row-label">Off the Record</div>
          <div class="row-sub">Caught Off Guard · Dark Thoughts 카드 삭제</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
      <div class="list-row tappable" onclick="resetApp('worldfeed')">
        <div>
          <div class="row-label">World Feed</div>
          <div class="row-sub">생성 히스토리 초기화</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
      <div class="list-row tappable" onclick="resetApp('blackbox')">
        <div>
          <div class="row-label">Blackbox</div>
          <div class="row-sub">협박편지 · 민원 히스토리 삭제</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
      <div class="list-row tappable" onclick="resetApp('dreamlog')">
        <div>
          <div class="row-label">Dream Log</div>
          <div class="row-sub">현재 꿈 기록 삭제</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
      <div class="list-row tappable" onclick="resetApp('monologue')">
        <div>
          <div class="row-label">Monologue</div>
          <div class="row-sub">핀 · 오늘 카드 · 사용된 질문 전체 삭제</div>
        </div>
        <span class="row-chevron">›</span>
      </div>
    </div>

    <!-- DANGER -->
    <div class="section-label">데이터</div>
    <button class="reset-btn" onclick="resetAll()">이 캐릭터 데이터 전체 초기화</button>
    <div style="padding:8px 2px;"><span style="font-size:12px;color:var(--text-hint);">Character Profile, 모든 생성 기록이 삭제돼요. 툴바 커스텀 태그는 유지됩니다.</span></div>
  `;
}

window.ffAddNPC = function() {
  const wrap = document.getElementById('ff-npc-wrap');
  const current = wrap.querySelectorAll('.kw-tag').length;
  if (current >= 8) { showToast('NPC는 최대 8명까지 추가할 수 있어요'); return; }
  const val = prompt('NPC 이름:');
  if (!val||!val.trim()) return;
  const addBtn = wrap.querySelector('.add-tag');
  const tag    = document.createElement('div');
  tag.className = 'kw-tag';
  tag.innerHTML = `${esc(val.trim())}<span class="kw-x" onclick="this.parentElement.remove()">×</span>`;
  wrap.insertBefore(tag, addBtn);
};

window.ffSaveConfig = function() {
  const group = document.getElementById('ff-group')?.value.trim() || '';
  const npcs  = Array.from(document.getElementById('ff-npc-wrap')?.querySelectorAll('.kw-tag')||[])
                  .map(t=>t.textContent.replace('×','').trim());
  syncStore();
  store.fanFeedConfig = { group, npcs };
  if (window.parent?.__PC_STORE__) window.parent.__PC_STORE__.fanFeedConfig = { group, npcs };
  if (saveStore) saveStore();
  showToast('저장됐어요 ✓');
};

window.resetApp = function(type) {
  const labels = {
    'reviews':   '저장된 후기를 전부 삭제할까요?',
    'offrecord': 'Off the Record 카드를 전부 삭제할까요?',
    'worldfeed': 'World Feed 히스토리를 초기화할까요?',
    'blackbox':  'Blackbox 히스토리를 전부 삭제할까요?',
    'dreamlog':  'Dream Log 기록을 삭제할까요?',
    'monologue': '핀된 카드와 모든 Monologue 기록을 삭제할까요?',
  };
  showModal({
    title: '초기화',
    desc: labels[type] || '초기화할까요?',
    confirmText: '초기화',
    danger: true,
    onConfirm: () => {
      syncStore();
      const ps = window.parent?.__PC_STORE__;
      if (type === 'reviews') {
        store.reviewsSaved   = [];
        store.reviewsHistory = [];
        if (ps) { ps.reviewsSaved = []; ps.reviewsHistory = []; }
      }
      if (type === 'offrecord') {
        store.cogCards    = [];
        store.cogHistory  = [];
        store.darkCards   = [];
        store.darkHistory = [];
        if (ps) { ps.cogCards = []; ps.cogHistory = []; ps.darkCards = []; ps.darkHistory = []; }
      }
      if (type === 'worldfeed') {
        store.fanFeedHistory = [];
        if (ps) ps.fanFeedHistory = [];
      }
      if (type === 'blackbox') {
        store.blackboxHistory = { threat:[], complaint:[] };
        if (ps) ps.blackboxHistory = { threat:[], complaint:[] };
      }
      if (type === 'dreamlog') {
        store.dreamLogCurrent = null;
        if (ps) ps.dreamLogCurrent = null;
      }
      if (type === 'monologue') {
        store.monologuePinned      = [];
        store.monologueToday       = [];
        store.monologueLastDate    = '';
        store.monologueUsedIndices = [];
        if (ps) {
          ps.monologuePinned      = [];
          ps.monologueToday       = [];
          ps.monologueLastDate    = '';
          ps.monologueUsedIndices = [];
        }
      }
      if (saveStore) saveStore();
      showToast('초기화됐어요');
    }
  });
};

window.resetAll = function() {
  showModal({
    title:'전체 초기화',
    desc:'이 캐릭터의 모든 데이터가 삭제돼요. 되돌릴 수 없어요. (툴바 커스텀 태그는 유지됩니다)',
    confirmText:'초기화',
    danger:true,
    onConfirm:() => {
      const key = window.parent?.__PC_CHAR_KEY__ || charKey;
      const globalStore = window.parent?.__PC_GLOBAL_STORE__;
      if (globalStore?.chars?.[key]) delete globalStore.chars[key];
      if (saveStore) saveStore();
      if (refreshPrompt) refreshPrompt();
      showToast('전체 데이터 초기화됐어요');
      router.go('vault');
    }
  });
};
